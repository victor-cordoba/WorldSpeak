#!/usr/bin/env python3
"""Compila una receta de lección en cues listos para synth.py / assemble.py.

Determinista: el narrador habla por plantillas, la construcción hacia atrás se
calcula por sílabas, el repaso espaciado se intercala solo. La misma receta con
--minutes distinto da una lección más corta o más larga (ajusta repeticiones y
bloques), y --mode review genera solo anticipación de los ítems.

Uso:
  compile_lesson.py --course tagalog --lesson 1 [--minutes 15] [--mode lesson|review]
  compile_lesson.py --course tagalog --items ako,ko,mo,saan --minutes 5 --mode review --out custom
"""
import argparse
import random
import re

from common import course_dir, load_json, save_json

# pausas (segundos tras el cue)
P = {"syllable": 1.2, "short": 2.5, "long": 3.5, "prompt": 4.0, "explain": 0.4, "dialogue": 0.8, "listen": 2.0}

VOWELS = "aeiouAEIOUáéíóú"


def syllables(word):
    """Divide una palabra tagala en sílabas de forma aproximada (CV, CVC, VC)."""
    w = word
    out = []
    i = 0
    while i < len(w):
        j = i
        # consonantes iniciales (incluye ng como una)
        while j < len(w) and w[j] not in VOWELS:
            j += 2 if w[j:j+2].lower() == "ng" else 1
        if j >= len(w):
            if out:
                out[-1] += w[i:]
            else:
                out.append(w[i:])
            break
        j += 1  # la vocal
        # coda: consonante si la siguiente es consonante+vocal o fin
        if j < len(w) and w[j] not in VOWELS:
            step = 2 if w[j:j+2].lower() == "ng" else 1
            nxt = j + step
            if nxt >= len(w) or (w[nxt] not in VOWELS):
                j = nxt
        out.append(w[i:j])
        i = j
    return out


def backward_build(phrase):
    """'Magandang tanghali' -> ['li', 'hali', 'tanghali', 'dang tanghali', 'Magandang tanghali']"""
    clean = re.sub(r"[?!.,]", "", phrase).strip()
    words = clean.split()
    if not words:
        return []
    steps = []
    # sílabas de la última palabra, de atrás hacia delante
    last = words[-1]
    syl = syllables(last)
    acc = ""
    for s in reversed(syl):
        acc = s + acc
        steps.append(acc)
    # palabras anteriores completas, una a una
    for k in range(len(words) - 2, -1, -1):
        steps.append(" ".join(words[k:]))
    # quita duplicados manteniendo orden y descarta trozos de 1 letra
    seen = set()
    result = []
    for s in steps:
        key = s.lower()
        if key in seen or len(s.replace(" ", "")) < 2:
            continue
        seen.add(key)
        result.append(s)
    # limita a 5 pasos: los 3 primeros + los 2 últimos
    if len(result) > 5:
        result = result[:3] + result[-2:]
    return result


def q(text):
    """Texto entre comillas para el narrador, sin puntuación final duplicada."""
    return "«" + re.sub(r"[.!]+$", "", text.strip()) + "»"


def cue(role, text, kind, pause, lang=None, translation="", item=None):
    return {"role": role, "lang": lang or ("es" if role == "narrator" else "tl"), "text": text, "kind": kind, "pause": pause, "translation_es": translation, "item": item}


NUM_ES = {1: "uno", 2: "dos", 3: "tres", 4: "cuatro", 5: "cinco", 6: "seis", 7: "siete", 8: "ocho", 9: "nueve", 10: "diez", 11: "once", 12: "doce", 13: "trece", 14: "catorce", 15: "quince", 16: "dieciséis", 17: "diecisiete", 18: "dieciocho", 19: "diecinueve", 20: "veinte", 21: "veintiuno", 22: "veintidós", 23: "veintitrés", 24: "veinticuatro", 25: "veinticinco", 26: "veintiséis", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve", 30: "treinta"}


def end_sentence(text):
    """Cierra la frase con punto si el texto (dinámico) no trae puntuación final; si no, el narrador lo lee del tirón.
    No duplica si ya acaba en . ! ? … : o en cita cerrada tras puntuación («¿Qué tal?»)."""
    text = text.strip()
    return text if re.search(r"([.!?…:]|[.!?…]\s*[»”)])$", text) else text + "."


class Compiler:
    def __init__(self, items, scenes, minutes, mode, seed=7, lang_code="tl", method=None):
        self.lang_code = lang_code
        # Ajustes por idioma (course.json -> "method"): notas que se explican la primera vez que aparece un
        # disparador (p. ej. "po" en Tagalog, "Lei" en italiano), despedida, y textos fijos del narrador.
        self.method = method or {}
        self.notes_done = set()
        self.items = {i["id"]: i for i in items}
        self.scenes = scenes
        self.minutes = minutes
        self.mode = mode
        self.rng = random.Random(seed)
        self.cues = []
        self.native = "native_f"
        self.po_explained = False

    # --- helpers
    def n(self, text, pause=P["explain"], kind="instruction"):
        # Todo texto del narrador termina en puntuación (mucho es dinámico: subtítulos, notas, pills).
        self.cues.append(cue("narrator", end_sentence(text), kind, pause))

    def voice(self, item):
        # Regla fija: el "profesor" nativo (hombre) dice todas las frases que aprendes;
        # la voz de mujer solo aparece en el bloque de entender y en el diálogo.
        v = item.get("speaker")
        if v in ("native_m", "native_f", "kid_m", "kid_f"):
            return v
        return "native_m"

    def say(self, item, pause=None, kind="phrase", role=None):
        text = item["tl"]
        p = pause if pause is not None else (P["long"] if len(text) > 22 else P["short"])
        self.cues.append(cue(role or self.voice(item), text, kind, p, translation=item["es"], item=item["id"]))

    def prompt(self, item, variant=0):
        e = q(item["es"])
        forms = [f"¿Cómo se dice {e}?", f"Di: {e}.", f"Otra vez. {e}.", f"Y ahora, {e}."]
        self.n(forms[variant % len(forms)], P["prompt"], "prompt")
        self.say(item, kind="phrase")

    # --- bloques
    def intro(self, scene, recipe):
        num = NUM_ES.get(int(recipe["lesson"]), str(recipe["lesson"]))  # en letra: Fish lee mal "Lección 1."
        self.n(f"Lección {num}. {end_sentence(re.sub(r'[.]+$', '', recipe['title']))}", 0.6)
        self.n(end_sentence(scene["setting"]) + " Escucha la conversación.", 0.8)
        self.dialogue(scene)

    def dialogue(self, scene):
        for line in scene["lines"]:
            self.cues.append(cue(line["role"], line["tl"], "dialogue", P["dialogue"], translation=line["es"]))

    def explain(self, recipe):
        self.n(end_sentence(recipe["subtitle"]) + " Al terminar, esta conversación la vas a hacer tú.", 0.8, "explanation")

    def recall(self, ids, label="Antes de empezar, repasemos."):
        if not ids:
            return
        self.n(label, 0.5)
        for k, iid in enumerate(ids):
            self.prompt(self.items[iid], variant=k % 2)

    def teach(self, item, reps=2):
        note = item.get("note", "")
        var_tl = (item.get("variant") or {}).get("tl", "")
        haystack = f" {item['tl']} {note} {var_tl} ".lower()
        for k, fn in enumerate(self.method.get("first_time_notes", [])):
            if k in self.notes_done:
                continue
            if any(f" {t.lower()}" in haystack or f"{t.lower()} " in haystack for t in fn.get("triggers", [])):
                self.notes_done.add(k)
                self.n(fn["text"], 0.6, "explanation")
        lit = item.get("lit", "")
        parts = [q(item["es"]) + "."]
        if lit:
            parts.append(f"Literalmente, {lit}.")
        parts.append("Escucha y repite.")
        self.n(" ".join(parts), 0.5)
        self.say(item)
        for step in backward_build(item["tl"]):
            self.cues.append(cue(self.voice(item), step, "phrase", P["syllable"] if " " not in step else P["short"], translation="", item=item["id"]))
        for k in range(reps):
            self.say(item, pause=1.2 if (k == reps - 1 and note and self.mode == "lesson") else None)
        if note and self.mode == "lesson":
            self.n(note, 0.5, "explanation")
        var = item.get("variant")
        if var and self.mode == "lesson":
            self.n(f"Y {var['es']}, escucha:", 0.3, "explanation")
            self.cues.append(cue(self.voice(item), var["tl"], "phrase", P["short"], translation=var["es"], item=item["id"]))
            self.n("Pero hoy practicamos la primera forma.", 0.4, "explanation") if "respeto" in var["es"] else None
        self.prompt(item, 0)
        self.prompt(item, 2)

    def listen(self, ids):
        if not ids:
            return
        self.n("Ahora, a entender. Vas a oír respuestas típicas, con otra voz. Escucha, y piensa qué significan. Luego te lo digo.", 0.6)
        for iid in ids:
            item = self.items[iid]
            self.say(item, pause=P["listen"], kind="phrase", role="native_f")
            self.n(q(item["es"]) + ".", 0.5, "explanation")
            self.say(item, pause=1.2, kind="phrase", role="native_f")

    def grammar(self, pill):
        self.n(end_sentence(pill["title"]), 0.4, "explanation")
        self.n(pill["text"], 0.6, "explanation")
        for iid in pill.get("examples", []):
            self.say(self.items[iid], kind="phrase")

    def guided(self, steps):
        self.n("Conversación guiada. Yo te digo la situación, tú hablas, y luego lo oyes.", 0.6)
        for step in steps:
            self.n(step["prompt"], P["prompt"], "prompt")
            self.say(self.items[step["item"]], kind="phrase")

    def review(self, ids):
        self.n("Repaso final. Todo lo de hoy.", 0.5)
        for k, iid in enumerate(ids):
            self.prompt(self.items[iid], variant=(k + 1) % 4)

    def outro(self, scene):
        self.n("Escucha la conversación completa una vez más. Ahora la entiendes entera.", 0.6)
        self.dialogue(scene)
        self.n("Hasta la próxima lección. " + self.method.get("closing", "¡Hasta pronto!"), 0.3)

    # --- compilar
    def lesson(self, recipe):
        scene = self.scenes[recipe["scene"]]
        teach = recipe["teach"]
        prev = list(recipe.get("recall_prev", []))
        # Recuerdo sorpresa (Pimsleur): dos ítems de lecciones ANTERIORES a la previa, elegidos con semilla fija
        older = [i["id"] for i in self.items.values() if isinstance(i.get("lesson"), int) and i["lesson"] <= recipe["lesson"] - 2 and not i.get("answer")]
        if older:
            rng = random.Random(1000 + recipe["lesson"])
            for iid in rng.sample(older, min(2, len(older))):
                if iid not in prev and iid not in teach:
                    prev.append(iid)
        # escala por duración: 15 min = referencia
        scale = self.minutes / 10   # calibrado con audio real: 10 min por unidad de escala
        reps = 2 if scale >= 1 else 1
        self.intro(scene, recipe)
        self.explain(recipe)
        self.recall(prev[: max(3, int(5 * scale))])
        taught = []
        for k, iid in enumerate(teach):
            self.teach(self.items[iid], reps=reps)
            taught.append(iid)
            # repaso espaciado: cada 2 ítems recupera uno de hace 2 o 3
            if k % 2 == 1 and len(taught) >= 3:
                back = taught[-3]
                self.n("Un momento. Volvamos atrás.", 0.4)
                self.prompt(self.items[back], 3)
        if older:
            surprise = random.Random(2000 + recipe["lesson"]).choice(older)
            self.n("Pregunta sorpresa, de una lección anterior.", 0.4)
            self.prompt(self.items[surprise], 3)
        if recipe.get("grammar_pill"):
            self.grammar(recipe["grammar_pill"])
        self.listen(recipe.get("listen", []))
        if scale >= 0.66:
            self.guided(recipe.get("guided", []))
        self.review(teach)
        if scale >= 1.5:
            self.n("Como hay tiempo, repasemos de nuevo lo anterior.", 0.5)
            self.recall(prev, label="")
            self.review(teach)
        self.outro(scene)

    def review_only(self, ids, title="Repaso"):
        self.n(f"{title}. Solo preguntas. Piensa, di la frase en voz alta, y comprueba.", 0.8)
        rounds = max(1, round(self.minutes / (len(ids) * 0.25)))  # ~15 s por ítem y ronda
        order = list(ids)
        for r in range(rounds):
            self.rng.shuffle(order)
            for k, iid in enumerate(order):
                self.prompt(self.items[iid], variant=(k + r) % 4)
        self.n("Muy bien. Ingat ka!", 0.3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int)
    parser.add_argument("--items", help="ids separados por coma (modo a medida)")
    parser.add_argument("--minutes", type=int, default=15)
    parser.add_argument("--mode", choices=["lesson", "review"], default="lesson")
    parser.add_argument("--out", help="nombre del guion de salida (por defecto lesson-NN)")
    args = parser.parse_args()

    cdir = course_dir(args.course)
    content = cdir / "content"
    items = load_json(content / "items.json")["items"]
    scenes = load_json(content / "scenes.json")["scenes"]
    course_meta = load_json(cdir / "course.json", {})
    comp = Compiler(items, scenes, args.minutes, args.mode, lang_code=course_meta.get("language", {}).get("code", "tl"), method=course_meta.get("method_config", {}))

    if args.lesson and args.mode == "lesson":
        recipe = load_json(content / "recipes" / f"lesson-{args.lesson:02d}.json")
        comp.lesson(recipe)
        meta = {"title": recipe["title"], "subtitle": recipe["subtitle"], "summary_es": recipe["summary_es"], "topics": recipe["topics"],
                "dialogue": {"tl": [l["tl"] for l in scenes[recipe["scene"]]["lines"]], "es": [l["es"] for l in scenes[recipe["scene"]]["lines"]]},
                "vocabulary": [{"term": comp.items[i]["tl"], "es": comp.items[i]["es"]} for i in recipe["teach"]]}
        name = args.out or f"lesson-{args.lesson:02d}"
    else:
        if args.lesson:
            recipe = load_json(content / "recipes" / f"lesson-{args.lesson:02d}.json")
            ids = recipe["teach"] + recipe.get("recall_prev", [])
            title = f"Repaso de la lección {args.lesson}"
        else:
            ids = [i.strip() for i in (args.items or "").split(",") if i.strip()]
            title = "Repaso a medida"
        comp.review_only(ids, title)
        meta = {"title": title, "subtitle": f"{len(ids)} frases, {args.minutes} minutos", "summary_es": "Repaso por anticipación.", "topics": ["Repaso"],
                "dialogue": {"tl": [], "es": []}, "vocabulary": [{"term": comp.items[i]["tl"], "es": comp.items[i]["es"]} for i in ids]}
        name = args.out or (f"review-{args.lesson:02d}" if args.lesson else "custom")

    cues = comp.cues
    chars = sum(len(c["text"]) for c in cues)
    speech = chars / 11.0  # calibrado con audio real (Fish/ElevenLabs): ~11 caracteres por segundo
    pauses = sum(c["pause"] for c in cues)
    est = (speech + pauses) / 60
    script = {**meta, "cues": cues, "_meta": {"compiler": "compile_lesson.py", "minutes_target": args.minutes, "minutes_estimated": round(est, 1), "chars": chars, "cues": len(cues), "mode": args.mode, "lesson": args.lesson}}
    out = cdir / "scripts" / f"{name}.json"
    save_json(out, script)
    unique = len({(c["role"], c["text"]) for c in cues if c["role"] != "narrator"})
    print(f"{out.name}: {len(cues)} cues, {chars} chars, ~{est:.1f} min estimados, {unique} clips nativos únicos")


if __name__ == "__main__":
    main()

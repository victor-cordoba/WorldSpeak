#!/usr/bin/env python3
"""Redacta con GPT los ítems, la escena y la receta de una lección a partir del currículo.

Lee web/<curso>/content/curriculum.json (título, ítems clave, gramática) y los ítems
ya existentes (para repaso y para no repetir ids), y añade a items.json, scenes.json
y recipes/lesson-NN.json. Idempotente: si la receta existe, no hace nada salvo --force.
Después revisa un humano: el Tagalog lo escribe un modelo.

Uso: author_lesson.py --course tagalog --lesson 9
"""
import argparse
import json
import re

from common import course_dir, http_json, load_json, read_key, save_json

SYSTEM = """Eres profesor nativo de {LANG} y diseñador de cursos
por audio para hispanohablantes. Escribes contenido para una lección del método Pimsleur.
Devuelve SOLO JSON válido con esta forma exacta:
{
 "items": [ {"id": "kebab-unico", "tl": "frase en {LANG} natural, con puntuación", "es": "español de España natural",
             "lit": "traducción literal corta o vacío", "note": "una frase útil del narrador (uso, cortesía po, matiz)",
             "pill": "una de: preguntar, entender, presentarse, cortesia, moverse, mercado, ninos, corazon, familia, casa, trabajo, comida, tiempo, fe, salud, social, peligro",
             "tags": ["etiquetas de gramática"], "answer": false } ],
 "scene": { "setting": "una frase del narrador situando la escena en el lugar del curso (ver course_context)", "lines": [ {"role": "native_m|native_f|kid_m|kid_f", "tl": "...", "es": "..."} ] },
 "recipe": { "title": "...", "subtitle": "una frase con lo que se aprende", "summary_es": "una frase", "topics": ["4-6 etiquetas cortas"],
             "teach": ["ids de 6 a 8 ítems nuevos, en orden pedagógico"], "listen": ["ids de 2 a 4 respuestas típicas a entender (answer=true)"],
             "recall_prev": ["ids de 3 a 5 ítems de lecciones anteriores, de la lista dada"],
             "grammar_pill": {"title": "...", "text": "explicación de 2-4 frases, hablada, clara", "examples": ["2 ids"]},
             "guided": [ {"prompt": "situación en español para que el alumno produzca", "item": "id"} ] } }
Reglas: 6-8 ítems nuevos + 2-4 respuestas (answer=true). Los ids nuevos no pueden coincidir con los existentes.
{LANG} correcto y natural, situado SOLO en los lugares del course_context (nunca en otros países). Con niños, registro cariñoso y preguntas con tacto. Diálogo de 5-8 líneas
usando SOLO ítems de la lección y de anteriores. Nada en inglés."""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--course", required=True)
    ap.add_argument("--lesson", type=int, required=True)
    ap.add_argument("--model", default="gpt-4o")
    ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    cdir = course_dir(a.course); content = cdir / "content"
    recipe_path = content / "recipes" / f"lesson-{a.lesson:02d}.json"
    if recipe_path.exists() and not a.force:
        print(f"skip L{a.lesson}: receta ya existe"); return
    cur = load_json(content / "curriculum.json"); lesson = next(l for l in cur["lessons"] if l["lesson"] == a.lesson)
    level = next(lv for lv in cur["levels"] if lv["id"] == lesson["level"])
    items = load_json(content / "items.json"); scenes = load_json(content / "scenes.json")
    existing = [{"id": i["id"], "tl": i["tl"], "es": i["es"], "lesson": i["lesson"]} for i in items["items"]]
    course = load_json(cdir / "course.json")
    user = json.dumps({"lesson": a.lesson, "level": level, "title": lesson["title"], "key_items_es_or_tl": lesson["items"], "grammar_focus": lesson["grammar"],
                       "course_context": course.get("context", ""), "existing_items": existing}, ensure_ascii=False)
    system = SYSTEM.replace("{LANG}", course.get("language", {}).get("name", "Tagalog"))
    print(f"redactando L{a.lesson} · {lesson['title']}", flush=True)
    r = http_json("https://api.openai.com/v1/chat/completions", {"model": a.model, "temperature": 0.4, "response_format": {"type": "json_object"}, "max_tokens": 6000,
                  "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]}, {"Authorization": f"Bearer {read_key('openai')}"})
    out = json.loads(r["choices"][0]["message"]["content"])
    ids = {i["id"] for i in items["items"]}
    new = []
    for it in out["items"]:
        iid = re.sub(r"[^a-z0-9-]", "", it["id"].lower().replace(" ", "-")) or f"l{a.lesson}-{len(new)}"
        while iid in ids: iid += "-2"
        ids.add(iid); it["id"] = iid; it["lesson"] = a.lesson; it.setdefault("tags", []); it.setdefault("lit", ""); it.setdefault("note", "")
        if not it.get("answer"): it.pop("answer", None)
        new.append(it)
    # reasignar ids en receta si el modelo los cambió
    idmap = {o["id"]: n["id"] for o, n in zip(out["items"], new)}
    rec = out["recipe"]; fix = lambda lst: [idmap.get(x, x) for x in lst if idmap.get(x, x) in ids]
    rec["teach"] = fix(rec.get("teach", [])); rec["listen"] = fix(rec.get("listen", [])); rec["recall_prev"] = fix(rec.get("recall_prev", []))
    rec["grammar_pill"]["examples"] = fix(rec["grammar_pill"].get("examples", []))
    rec["guided"] = [{"prompt": g["prompt"], "item": idmap.get(g["item"], g["item"])} for g in rec.get("guided", []) if idmap.get(g["item"], g["item"]) in ids]
    if len(rec["teach"]) < 4: raise SystemExit("receta demasiado corta")
    items["items"].extend(new); save_json(content / "items.json", items)
    scenes["scenes"][f"lesson-{a.lesson:02d}"] = out["scene"]; save_json(content / "scenes.json", scenes)
    save_json(recipe_path, {"id": f"lesson-{a.lesson:02d}", "lesson": a.lesson, **rec, "scene": f"lesson-{a.lesson:02d}", "_review": "redactado por GPT; pendiente de revisión humana"})
    print(f"L{a.lesson}: {len(new)} ítems, diálogo de {len(out['scene']['lines'])} líneas")


if __name__ == "__main__":
    main()

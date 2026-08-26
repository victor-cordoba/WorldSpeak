#!/usr/bin/env python3
"""Revisa el contenido de un curso antes de compilar y arregla lo automático.

Comprueba: campos obligatorios, pills válidas, duplicados, notas del narrador con
frases en el idioma objetivo (se convierten en 'variant' para que las diga el
nativo), respuestas (answer) en 'teach' (se mueven a 'listen'), escenas con más
de dos personajes, ids inexistentes en recetas, palabras en inglés.
Uso: lint_content.py --course tagalog [--fix]
"""
import argparse, json, re
from common import course_dir, load_json, save_json

PILLS = {"surf","preguntar","entender","presentarse","cortesia","moverse","mercado","ninos","corazon","familia","casa","trabajo","comida","tiempo","fe","salud","social","peligro","bar","horarios","arte","calcio","romano"}
ENGLISH = re.compile(r"\b(the|and|you|please|listen|repeat|hello|thank you|good morning|yes|no problem)\b", re.I)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--course", required=True); ap.add_argument("--fix", action="store_true"); a = ap.parse_args()
    cdir = course_dir(a.course); content = cdir / "content"
    course = load_json(cdir / "course.json", {}); lang = course.get("language", {}).get("name", "idioma")
    items = load_json(content / "items.json"); scenes = load_json(content / "scenes.json")["scenes"]
    problems = []; fixed = 0
    forbidden = [w.lower() for w in course.get("method_config", {}).get("forbidden", [])]
    seen_tl = {}
    for it in items["items"]:
        iid = it.get("id", "?")
        for k in ("tl", "es", "pill", "lesson"):
            if not it.get(k): problems.append(f"item {iid}: falta {k}")
        if it.get("pill") and it["pill"] not in PILLS: problems.append(f"item {iid}: pill desconocida '{it['pill']}'")
        key = re.sub(r"[^\w ]", "", it.get("tl", "").lower()).strip()
        if key in seen_tl and seen_tl[key] != iid: problems.append(f"item {iid}: duplicado de {seen_tl[key]} ('{it['tl']}')")
        seen_tl.setdefault(key, iid)
        if ENGLISH.search(it.get("tl", "")): problems.append(f"item {iid}: parece inglés en tl: '{it['tl']}'")
        blob = f"{it.get('tl','')} {it.get('es','')} {it.get('note','')}".lower()
        for w in forbidden:
            if w in blob: problems.append(f"item {iid}: palabra prohibida en este curso: '{w}' ({it.get('tl')})")
        note = it.get("note", "")
        # nota con frase objetivo tras dos puntos: "…: Ingat po kayo." -> variant
        m = re.search(r"^(.*?)(?:[:：]|=)\s*([A-ZÑ][^.!?]{2,60}[.!?]?)\s*$", note)
        if m and not it.get("variant") and it.get("tl") and m.group(2).strip(" .!?") not in it["tl"]:
            cand = m.group(2).strip()
            if not re.search(r"[áéíóúü]|\b(el|la|los|las|de|que|con|para|por|una|un)\b", cand):  # pinta a idioma objetivo, no a español
                problems.append(f"item {iid}: la nota contiene una frase en {lang} que diría el narrador: '{cand}'")
                if a.fix:
                    it["variant"] = {"tl": cand, "es": m.group(1).strip().rstrip(",;") or "otra forma"}
                    it["note"] = (m.group(1).strip().rstrip(":=,; ") + ".") if m.group(1).strip() else ""
                    fixed += 1
    ids = {i["id"] for i in items["items"]}; answers = {i["id"] for i in items["items"] if i.get("answer")}
    for sid, sc in scenes.items():
        roles = []
        for l in sc.get("lines", []):
            if l["role"] not in roles: roles.append(l["role"])
        if len(roles) > 2: problems.append(f"escena {sid}: {len(roles)} personajes ({roles})")
        if not sc.get("setting"): problems.append(f"escena {sid}: sin setting")
        for w in forbidden:
            if w in json.dumps(sc, ensure_ascii=False).lower(): problems.append(f"escena {sid}: palabra prohibida '{w}'")
    for rp in sorted((content / "recipes").glob("lesson-*.json")):
        r = load_json(rp)
        for k in ("teach", "listen", "recall_prev"):
            bad = [x for x in r.get(k, []) if x not in ids]
            if bad: problems.append(f"{rp.name}: ids inexistentes en {k}: {bad}")
        mixed = [x for x in r.get("teach", []) if x in answers]
        if mixed:
            problems.append(f"{rp.name}: respuestas (answer) dentro de teach: {mixed}")
            if a.fix:
                # Si la lección se queda sin frases suficientes, esas "respuestas" se enseñan (se les quita answer);
                # si hay de sobra, pasan al bloque de entender.
                keep = [x for x in r["teach"] if x not in answers]
                movable = []
                for x in mixed:
                    if len(keep) >= 5: movable.append(x)
                    else:
                        keep.append(x)
                        for it in items["items"]:
                            if it["id"] == x: it.pop("answer", None)
                r["teach"] = keep; r["listen"] = list(dict.fromkeys(r.get("listen", []) + movable)); save_json(rp, r); fixed += 1
        if not (4 <= len(r.get("teach", [])) <= 9): problems.append(f"{rp.name}: teach con {len(r.get('teach', []))} ítems")
        if r.get("scene") not in scenes: problems.append(f"{rp.name}: escena '{r.get('scene')}' no existe")
        for g in r.get("guided", []):
            if g.get("item") not in ids: problems.append(f"{rp.name}: guided con id inexistente {g.get('item')}")
    if a.fix:
        dups = {}
        seen = {}
        for it in items["items"]:
            key = re.sub(r"[^\w ]", "", it.get("tl", "").lower()).strip()
            if key in seen: dups[it["id"]] = seen[key]
            else: seen[key] = it["id"]
        if dups:
            items["items"] = [it for it in items["items"] if it["id"] not in dups]
            for rp in (content / "recipes").glob("lesson-*.json"):
                r = load_json(rp); changed = False
                for k in ("teach", "listen", "recall_prev"):
                    new = list(dict.fromkeys(dups.get(x, x) for x in r.get(k, [])))
                    if new != r.get(k, []): r[k] = new; changed = True
                for g in r.get("guided", []):
                    if g.get("item") in dups: g["item"] = dups[g["item"]]; changed = True
                if changed: save_json(rp, r)
            fixed += len(dups)
        # escenas con más de 2 personajes: los extra se reasignan al personaje del mismo género
        for sid, sc in scenes.items():
            roles = []
            for l in sc.get("lines", []):
                if l["role"] not in roles: roles.append(l["role"])
            if len(roles) > 2:
                keep = roles[:2]
                for l in sc["lines"]:
                    if l["role"] not in keep:
                        same = [k for k in keep if k[-1] == l["role"][-1]]
                        l["role"] = same[0] if same else keep[0]
                fixed += 1
        save_json(content / "scenes.json", {"scenes": scenes})
        save_json(content / "items.json", items)
    for p in problems: print("  -", p)
    print(f"{len(problems)} avisos · {fixed} arreglados automáticamente")

if __name__ == "__main__":
    main()

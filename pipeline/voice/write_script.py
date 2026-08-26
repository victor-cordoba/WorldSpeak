#!/usr/bin/env python3
"""Escribe el guion de una lección al estilo Pimsleur con un LLM.

Salida: web/<curso>/scripts/lesson-NN.json con la lista de "cues":
  { role: narrator|native_m|native_f, lang: es|tl, text, kind, pause, translation_es }

El narrador habla en español. Las voces nativas solo dicen frases en el idioma
objetivo. Cada cue lleva la pausa (en segundos) que debe seguirle para que el
alumno repita. Las lecciones posteriores reciben el vocabulario de las anteriores
para hacer repaso espaciado (graduated interval recall).

Uso: write_script.py --course tagalog --lesson 1 --minutes 6 --theme "Saludar y preguntar si entiende"
"""
import argparse
import json

from common import course_dir, http_json, load_json, read_key, save_json

SYSTEM = """Eres un diseñador de cursos de idiomas por audio que sigue el MÉTODO PIMSLEUR
con rigor. Escribes guiones para un alumno HISPANOHABLANTE que aprende {language_name}.

Principios del método que DEBES aplicar:
1. Anticipación: el narrador pide al alumno que produzca la frase ("¿Cómo se dice...?"),
   deja una pausa, y DESPUÉS el nativo da la respuesta correcta. Nunca al revés.
2. Construcción hacia atrás: cada palabra nueva se presenta de atrás hacia delante,
   sílaba a sílaba, con pausa para repetir cada trozo (ej. "li", "hali", "tanghali").
3. Repaso espaciado: las palabras aprendidas reaparecen a intervalos crecientes dentro
   de la lección y se recuperan las de lecciones anteriores.
4. Vocabulario esencial: pocas palabras nuevas por lección (6 a 9), de altísima frecuencia
   y utilidad real, muchas repeticiones.
5. Conversación: la lección abre con un diálogo corto entre dos nativos (hombre y mujer),
   el narrador lo explica, se trabaja, y se cierra volviendo a escucharlo entero.
6. El narrador es cercano, claro, en español de España, tutea. Frases cortas.
   Explica el significado literal cuando ayuda ("literalmente, 'bello mediodía'").
7. Las voces nativas SOLO hablan en {language_name}. Nunca en español ni en inglés.

Contexto del curso: {context}

Devuelve SOLO JSON con esta forma:
{{
  "title": "título corto en español de la lección",
  "subtitle": "una frase con lo que se aprende",
  "summary_es": "una frase",
  "topics": ["4 a 8 etiquetas cortas"],
  "dialogue": {{ "tl": ["frases del diálogo en {language_name}"], "es": ["traducción"] }},
  "vocabulary": [ {{ "term": "...", "es": "..." }} ],
  "cues": [ {{ "role": "narrator|native_m|native_f", "lang": "es|{lang_code}", "text": "...", "kind": "instruction|dialogue|prompt|phrase|explanation", "pause": 0.0, "translation_es": "" }} ]
}}
Reglas de los cues:
- "pause" es la pausa en segundos DESPUÉS del cue. Tras una frase nativa que el alumno
  debe repetir: 2.5 a 4 según longitud. Tras una pregunta del narrador al alumno: 3 a 5.
  Tras explicaciones del narrador: 0.4.
- Los cues nativos llevan "translation_es"; los del narrador lo dejan vacío.
- "kind": dialogue (líneas del diálogo), phrase (palabra o frase a repetir), prompt
  (el narrador pide producir), instruction (escucha y repite, etc.), explanation.
- Escribe las sílabas de la construcción hacia atrás como cues nativos separados, cortos.

ESQUELETO OBLIGATORIO de la lección (en este orden):
A. Narrador: "Escucha esta conversación" + contexto de quién habla con quién. Diálogo completo (nativos).
B. Narrador: explica de qué va el diálogo en dos frases.
C. Por CADA palabra o frase nueva (6 a 9 en total):
   1. Narrador da el significado en español y pide escuchar y repetir.
   2. Nativo: frase completa (pausa). 3. Nativo: última sílaba, luego últimas dos, ... hasta la frase entera, con pausa tras cada trozo.
   4. Nativo: frase completa dos veces más (pausa tras cada una).
   5. Narrador: "¿Cómo se dice ...?" (pausa larga) -> Nativo responde (pausa). Repetir este par al menos 2 veces con variaciones.
   6. Cada 2 palabras nuevas, el narrador recupera 1 o 2 de las anteriores con preguntas de anticipación (pausa) -> Nativo responde.
D. Mini conversación guiada: el narrador plantea una situación y pide al alumno que produzca cada línea; el nativo confirma.
E. Repaso final de todas las palabras (pregunta -> pausa -> respuesta).
F. Narrador: "Escucha el diálogo completo una vez más." Diálogo completo. Despedida breve del narrador.

LONGITUD: la lección debe durar {minutes} minutos de audio. Eso son COMO MÍNIMO {min_cues} cues y aproximadamente {target_words} palabras de texto. No resumas ni abrevies: un guion corto es un guion fallido.
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--lesson", type=int, required=True)
    parser.add_argument("--minutes", type=int, default=25)
    parser.add_argument("--theme", default="")
    parser.add_argument("--model", default="gpt-4o")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    cdir = course_dir(args.course)
    course = load_json(cdir / "course.json", {})
    lang = course.get("language", {"code": "tl", "name": "Tagalog"})
    out = cdir / "scripts" / f"lesson-{args.lesson:02d}.json"
    if out.exists() and not args.force:
        print(f"skip {out} ya existe")
        return

    previous = []
    for n in range(1, args.lesson):
        data = load_json(cdir / "scripts" / f"lesson-{n:02d}.json")
        if data:
            previous.append({"lesson": n, "title": data.get("title"), "vocabulary": data.get("vocabulary", [])})

    # unas 120 palabras de guion por minuto de audio final, contando pausas
    target_words = args.minutes * 120
    system = SYSTEM.format(language_name=lang["name"], lang_code=lang["code"], context=course.get("context", course.get("description", "")), target_words=target_words, minutes=args.minutes, min_cues=args.minutes * 14)
    user = json.dumps({
        "lesson": args.lesson,
        "theme": args.theme or "elige el tema más útil siguiendo la progresión natural del método",
        "previous_lessons": previous,
        "instruction": "Repasa 2 o 3 palabras de lecciones anteriores si las hay. Presenta el vocabulario nuevo. Cierra con el diálogo completo.",
    }, ensure_ascii=False)

    print(f"escribiendo guion lección {args.lesson} ({args.minutes} min, {args.model})", flush=True)
    response = http_json(
        "https://api.openai.com/v1/chat/completions",
        {"model": args.model, "temperature": 0.6, "response_format": {"type": "json_object"},
         "max_tokens": 16000, "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]},
        {"Authorization": f"Bearer {read_key('openai')}"},
    )
    script = json.loads(response["choices"][0]["message"]["content"])
    cues = script.get("cues") or []
    if not cues:
        raise SystemExit("El modelo no devolvió cues")
    chars = sum(len(c.get("text", "")) for c in cues)
    script["_meta"] = {"model": args.model, "minutes": args.minutes, "chars": chars, "cues": len(cues), "lesson": args.lesson}
    save_json(out, script)
    print(f"guardado {out}: {len(cues)} cues, {chars} caracteres de TTS")


if __name__ == "__main__":
    main()

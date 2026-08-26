#!/usr/bin/env python3
"""Casting de voces: genera la misma frase con varias voces (Fish + ElevenLabs) y publica
web/<curso>/voces/ con un manifest para la página voces.html. Uso: casting.py --course tagalog"""
import argparse, json, re, time, urllib.request, urllib.parse
from common import course_dir, read_key, save_json, load_json

ES = "Escucha esta conversación. Un hombre saluda a una mujer a mediodía. ¿Cómo se dice «buenos días»? Escucha y repite."
TL = "Magandang umaga po! Kumusta? Ako si Ana. Anong pangalan mo? Nakatira ako sa Tondo, malapit lang."
CELEB = ("pbb", "kuya", "dj ", "brainrot", "miku", "parappa", "closs", "alawi", "kapamilya", "tiktok", "smash", "dragon", "jesus", "youtuber", "streamer", "anime", "goku", "vegeta", "narrador de", "ibai", "auron", "rubius", "elrubius", "vegetta", "willyrex", "trump", "obama", "messi", "peso pluma", "bad bunny", "rosalia", "shakira", "cristiano")

def fish_get(key, path):
    r = urllib.request.Request("https://api.fish.audio" + path, headers={"Authorization": f"Bearer {key}"})
    return json.loads(urllib.request.urlopen(r, timeout=60).read())

def fish_tts(key, vid, text, out):
    body = json.dumps({"text": text, "reference_id": vid, "format": "mp3"}).encode()
    r = urllib.request.Request("https://api.fish.audio/v1/tts", data=body, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": "s2.1-pro-free"}, method="POST")
    out.write_bytes(urllib.request.urlopen(r, timeout=120).read())

def el_get(key, path):
    r = urllib.request.Request("https://api.elevenlabs.io" + path, headers={"xi-api-key": key})
    return json.loads(urllib.request.urlopen(r, timeout=60).read())

def el_add(key, owner, vid, name):
    body = json.dumps({"new_name": name}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/voices/add/{owner}/{vid}", data=body, headers={"xi-api-key": key, "Content-Type": "application/json"}, method="POST")
    try: urllib.request.urlopen(r, timeout=60).read()
    except Exception: pass

def el_tts(key, vid, text, lang, out):
    body = json.dumps({"text": text, "model_id": "eleven_v3", "language_code": lang, "voice_settings": {"stability": 0.55, "similarity_boost": 0.85, "style": 0.2, "use_speaker_boost": True}}).encode()
    r = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128", data=body, headers={"xi-api-key": key, "Content-Type": "application/json"}, method="POST")
    out.write_bytes(urllib.request.urlopen(r, timeout=120).read())

def ok_title(t):
    t = t.lower(); return not any(c in t for c in CELEB)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--course", required=True); a = ap.parse_args()
    cdir = course_dir(a.course); out = cdir / "voces"; out.mkdir(exist_ok=True)
    fk, ek = read_key("fishaudio"), read_key("elevenlabs")
    cands = []
    # --- Fish español (narrador) ---
    seen = set()
    for q in ["narrador", "locutor", "voz masculina", "voz femenina", "castellano", "español neutro", "presentadora"]:
        for m in fish_get(fk, f"/model?title={urllib.parse.quote(q)}&language=es&page_size=12&sort_by=task_count").get("items", []):
            if m["_id"] in seen or not ok_title(m["title"]): continue
            seen.add(m["_id"]); cands.append({"group": "narrador-es", "provider": "fish", "id": m["_id"], "name": m["title"][:40], "uses": m.get("task_count", 0)})
    fish_es = sorted([c for c in cands if c["group"] == "narrador-es"], key=lambda c: -c["uses"])[:6]
    # --- Fish tagalog ---
    fish_tl = []
    for q in ["filipina", "filipino male", "filipino female", "tagalog", "pinoy", "filipino voice"]:
        for m in fish_get(fk, f"/model?title={urllib.parse.quote(q)}&language=tl&page_size=12&sort_by=task_count").get("items", []):
            if m["_id"] in seen or not ok_title(m["title"]): continue
            seen.add(m["_id"]); fish_tl.append({"group": "tagalog", "provider": "fish", "id": m["_id"], "name": m["title"][:40], "uses": m.get("task_count", 0)})
    fish_tl = sorted(fish_tl, key=lambda c: -c["uses"])[:8]
    # --- ElevenLabs español peninsular ---
    el_es = []
    for acc in ["peninsular", "castilian", "spanish"]:
        for v in el_get(ek, f"/v1/shared-voices?language=es&accent={acc}&page_size=30").get("voices", []):
            if v["voice_id"] in seen: continue
            seen.add(v["voice_id"]); el_es.append({"group": "narrador-es", "provider": "elevenlabs", "id": v["voice_id"], "owner": v["public_owner_id"], "name": v["name"][:40], "uses": v.get("cloned_by_count", 0), "gender": v.get("gender")})
    el_es = sorted(el_es, key=lambda c: -c["uses"])[:5]
    # --- ElevenLabs tagalog (biblioteca, conocidas) ---
    el_tl = []
    for v in el_get(ek, "/v1/shared-voices?language=fil&page_size=100").get("voices", []):
        if v["voice_id"] in seen or v.get("category") == "generated": continue
        seen.add(v["voice_id"]); el_tl.append({"group": "tagalog", "provider": "elevenlabs", "id": v["voice_id"], "owner": v["public_owner_id"], "name": v["name"][:40], "uses": v.get("cloned_by_count", 0), "gender": v.get("gender")})
    el_tl = sorted(el_tl, key=lambda c: -c["uses"])
    el_tl = ([c for c in el_tl if c.get("gender") == "female"][:4] + [c for c in el_tl if c.get("gender") == "male"][:4])
    picks = fish_es + el_es + fish_tl + el_tl
    manifest = []
    for c in picks:
        text = ES if c["group"] == "narrador-es" else TL
        fname = f"{c['provider']}-{re.sub(r'[^a-z0-9]+', '-', c['name'].lower()).strip('-')[:30]}.mp3"
        dst = out / fname
        try:
            if not dst.exists():
                if c["provider"] == "fish": fish_tts(fk, c["id"], text, dst)
                else:
                    el_add(ek, c["owner"], c["id"], "WS casting " + c["name"][:20]); time.sleep(0.5)
                    el_tts(ek, c["id"], text, "es" if c["group"] == "narrador-es" else "fil", dst)
            manifest.append({**c, "file": f"voces/{fname}"}); print("ok", c["provider"], c["name"], flush=True)
        except Exception as e:
            print("FALLO", c["provider"], c["name"], str(e)[:80], flush=True)
    save_json(cdir / "voces" / "manifest.json", {"es": ES, "tl": TL, "voices": manifest})
    print(f"{len(manifest)} muestras")

if __name__ == "__main__":
    main()

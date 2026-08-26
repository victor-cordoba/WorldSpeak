"""Utilidades compartidas del pipeline de voz."""
import hashlib
import json
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
WEB = REPO / "web"
FFMPEG = os.environ.get("FFMPEG", "/opt/homebrew/bin/ffmpeg" if Path("/opt/homebrew/bin/ffmpeg").exists() else "ffmpeg")
FFPROBE = FFMPEG.replace("ffmpeg", "ffprobe")


def read_key(name):
    path = Path(os.environ.get(f"{name.upper()}_KEY_FILE", f"~/.config/victor/{name}_api_key")).expanduser()
    key = path.read_text().strip()
    if not key:
        raise SystemExit(f"Falta la clave en {path}")
    return key


def course_dir(course_id):
    path = WEB / course_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_json(path, default=None):
    path = Path(path)
    return json.loads(path.read_text()) if path.exists() else default


def save_json(path, data):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def http_json(url, payload, headers, timeout=300):
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", **headers}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as error:
        raise RuntimeError(f"HTTP {error.code} {url}: {error.read().decode('utf-8', 'replace')[:500]}") from error


def duration_of(path):
    out = subprocess.run([FFPROBE, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def digest(*parts):
    return hashlib.sha1("|".join(str(p) for p in parts).encode()).hexdigest()[:16]

#!/usr/bin/env python3
"""
Builds frontend runtime RU->EN dictionary for the legacy UI translator.

Usage:
  python scripts/i18n_build_runtime_dictionary.py
"""

from __future__ import annotations

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "resources" / "js" / "data" / "i18n-ru-en.json"
OVERRIDES = ROOT / "resources" / "js" / "data" / "i18n-overrides.json"
JS_ROOT = ROOT / "resources" / "js"
GEOS_FILE = ROOT / "resources" / "js" / "data" / "geos.json"

TRANSLATE_URL = "https://translate.googleapis.com/translate_a/single"
CYRILLIC = re.compile(r"[\u0400-\u04FF]")
WORD_CYRILLIC = re.compile(r"[\u0400-\u04FF]{2,}")
TEXT_BETWEEN_TAGS = re.compile(r">([^<]+)<", re.S)
QUOTED = re.compile(r"'([^'\\]*(?:\\.[^'\\]*)*)'|\"([^\"\\]*(?:\\.[^\"\\]*)*)\"|`([^`\\]*(?:\\.[^`\\]*)*)`", re.S)


def has_cyrillic(text: str) -> bool:
    return bool(CYRILLIC.search(text or ""))


def normalize(text: str) -> str:
    text = text.replace("\\n", " ").replace("\\r", " ").replace("\\t", " ")
    text = re.sub(r"\$\{[^}]*\}", " ", text)
    text = re.sub(r"\{[^{}]*\}", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def collect_frontend_phrases() -> set[str]:
    phrases: set[str] = set()

    for path in JS_ROOT.rglob("*.jsx"):
        content = path.read_text(encoding="utf-8")

        for match in QUOTED.finditer(content):
            value = next(group for group in match.groups() if group is not None)
            value = normalize(value)
            if value and has_cyrillic(value):
                phrases.add(value)

        for match in TEXT_BETWEEN_TAGS.finditer(content):
            value = normalize(match.group(1))
            if value and has_cyrillic(value):
                phrases.add(value)

    if GEOS_FILE.exists():
        geos = json.loads(GEOS_FILE.read_text(encoding="utf-8"))
        for item in geos:
            text = str(item.get("text", "")).strip()
            if text and has_cyrillic(text):
                phrases.add(text)

    return phrases


def collect_words(phrases: Iterable[str]) -> set[str]:
    words: set[str] = set()
    for phrase in phrases:
        words.update(WORD_CYRILLIC.findall(phrase))
    return words


def translate_batch(text: str) -> str:
    params = [
        ("client", "gtx"),
        ("sl", "ru"),
        ("tl", "en"),
        ("dt", "t"),
        ("q", text),
    ]
    url = TRANSLATE_URL + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=30) as response:
        raw = response.read().decode("utf-8")
    data = json.loads(raw)
    return "".join(part[0] for part in data[0] if part and part[0] is not None)


def translate_missing(entries: list[str], existing: dict[str, str]) -> dict[str, str]:
    result: dict[str, str] = dict(existing)
    pending = [entry for entry in entries if entry not in result]
    if not pending:
        return result

    chunk_size = 20
    for idx in range(0, len(pending), chunk_size):
        chunk = pending[idx : idx + chunk_size]
        joined = "\n".join(chunk)

        try:
            translated = translate_batch(joined).split("\n")
            if len(translated) != len(chunk):
                raise RuntimeError("translation line mismatch")
            for source, target in zip(chunk, translated):
                result[source] = target.strip() or source
        except Exception:
            for source in chunk:
                try:
                    result[source] = translate_batch(source).strip() or source
                except Exception:
                    result[source] = source
                time.sleep(0.05)

        time.sleep(0.1)

    return result


def main() -> int:
    current = {}
    if TARGET.exists():
        current = json.loads(TARGET.read_text(encoding="utf-8"))

    overrides = {}
    if OVERRIDES.exists():
        overrides = json.loads(OVERRIDES.read_text(encoding="utf-8"))

    phrases = collect_frontend_phrases()
    words = collect_words(phrases)
    entries = sorted(phrases | words | set(overrides.keys()), key=lambda x: (len(x), x))

    translated = translate_missing(entries, current)
    translated.update(overrides)

    # Keep only meaningful RU->EN pairs.
    translated = {
        key: value
        for key, value in translated.items()
        if key
        and value
        and has_cyrillic(key)
    }

    TARGET.write_text(
        json.dumps(dict(sorted(translated.items())), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Dictionary updated: {TARGET} ({len(translated)} entries)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

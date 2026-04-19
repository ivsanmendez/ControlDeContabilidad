#!/usr/bin/env python3
"""
Memory-bank vector embedding pipeline.
Uses Ollama (nomic-embed-text) to generate embeddings and stores them
in a companion SQLite table inside the AgentFS database.

Usage:
  python3 embed.py index          # Index / re-index all memory-bank files
  python3 embed.py search <query> # Semantic search over memory-bank
  python3 embed.py status         # Show indexed files
"""

import sys
import os
import json
import sqlite3
import struct
import math
import hashlib

# Resolve paths relative to this script's location (.agentfs/)
_SCRIPT_DIR   = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_SCRIPT_DIR)

DB_PATH       = os.path.join(_SCRIPT_DIR, "control-contabilidad.db")
MEMORY_BANK   = os.path.join(_PROJECT_ROOT, "memory-bank")
OLLAMA_URL    = "http://localhost:11434/api/embeddings"
EMBED_MODEL   = "nomic-embed-text"

# ---------------------------------------------------------------------------
# SQLite helpers
# ---------------------------------------------------------------------------

def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()


def get_db():
    db = sqlite3.connect(DB_PATH)
    db.execute("""
        CREATE TABLE IF NOT EXISTS vec_memory_bank (
            path        TEXT PRIMARY KEY,
            content     TEXT NOT NULL,
            content_hash TEXT NOT NULL DEFAULT '',
            model       TEXT NOT NULL,
            embedding   BLOB NOT NULL,   -- little-endian float32 array
            indexed_at  TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    # Migrate: add content_hash column if it doesn't exist yet
    cols = {r[1] for r in db.execute("PRAGMA table_info(vec_memory_bank)").fetchall()}
    if "content_hash" not in cols:
        db.execute("ALTER TABLE vec_memory_bank ADD COLUMN content_hash TEXT NOT NULL DEFAULT ''")
    db.commit()
    return db


def pack_vector(floats: list[float]) -> bytes:
    return struct.pack(f"{len(floats)}f", *floats)


def unpack_vector(blob: bytes) -> list[float]:
    n = len(blob) // 4
    return list(struct.unpack(f"{n}f", blob))


# ---------------------------------------------------------------------------
# Ollama helpers
# ---------------------------------------------------------------------------

CHUNK_SIZE = 4000   # chars per chunk — conservative for nomic-embed-text (~8192 token ctx)
OVERLAP    = int(CHUNK_SIZE * 0.10)  # 400-char overlap between consecutive chunks


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = OVERLAP) -> list[str]:
    """Split text into overlapping chunks."""
    if len(text) <= chunk_size:
        return [text]
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        if end >= len(text):
            break
        start = end - overlap
    return chunks


def _embed_single(text: str) -> list[float]:
    """Call Ollama for one chunk. Returns embedding or raises ValueError on context overflow."""
    import subprocess
    payload = json.dumps({"model": EMBED_MODEL, "prompt": text})
    result = subprocess.run(
        ["curl", "-s", "--max-time", "120",
         "-X", "POST", OLLAMA_URL,
         "-H", "Content-Type: application/json",
         "-d", payload],
        capture_output=True, text=True,
    )
    if result.returncode != 0 or not result.stdout.strip():
        print(f"\nERROR: curl failed (rc={result.returncode}): {result.stderr.strip()}")
        print(f"  Make sure Ollama is running: ollama serve")
        print(f"  And the model is pulled:     ollama pull {EMBED_MODEL}")
        sys.exit(1)
    data = json.loads(result.stdout)
    if "error" in data and "context length" in data["error"]:
        raise ValueError("context_overflow")
    if "embedding" not in data:
        print(f"\nERROR: unexpected Ollama response: {result.stdout[:200]}")
        sys.exit(1)
    return data["embedding"]


def get_embedding(text: str) -> list[float]:
    """Embed text, chunking with 10% overlap when it exceeds CHUNK_SIZE.
    Automatically halves chunk size if the model reports a context overflow.
    Returns a single vector by averaging all chunk embeddings."""
    chunk_size = CHUNK_SIZE
    while True:
        overlap = int(chunk_size * 0.10)
        chunks = chunk_text(text, chunk_size, overlap)
        try:
            vectors = [_embed_single(c) for c in chunks]
            break
        except ValueError:
            chunk_size = chunk_size // 2
            print(f"(chunk too large, retrying at {chunk_size} chars)...", end=" ", flush=True)

    if len(vectors) == 1:
        return vectors[0]
    dim = len(vectors[0])
    return [sum(v[i] for v in vectors) / len(vectors) for i in range(dim)]


# ---------------------------------------------------------------------------
# Cosine similarity
# ---------------------------------------------------------------------------

def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


# ---------------------------------------------------------------------------
# Local memory-bank file listing
# ---------------------------------------------------------------------------

def list_memory_files() -> list[str]:
    """Return all .md file paths relative to MEMORY_BANK root, sorted."""
    result = []
    for dirpath, _, filenames in os.walk(MEMORY_BANK):
        for name in filenames:
            if name.endswith(".md"):
                abs_path = os.path.join(dirpath, name)
                rel_path = os.path.relpath(abs_path, MEMORY_BANK)
                result.append(rel_path)
    return sorted(result)


def read_memory_file(rel_path: str) -> str:
    abs_path = os.path.join(MEMORY_BANK, rel_path)
    with open(abs_path, encoding="utf-8") as f:
        return f.read()


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_index(force: bool = False):
    db = get_db()
    files = list_memory_files()

    # Load existing index: path → content_hash
    stored = {
        row[0]: row[1]
        for row in db.execute("SELECT path, content_hash FROM vec_memory_bank").fetchall()
    }

    ok = skipped = unchanged = 0
    for path in files:
        content = read_memory_file(path)
        if not content.strip():
            print(f"  SKIP  {path} (empty)")
            skipped += 1
            continue

        chash = content_hash(content)

        if not force and stored.get(path) == chash:
            unchanged += 1
            continue  # file hasn't changed, keep existing embedding

        status = "update" if path in stored else "new"
        text = f"File: {path}\n\n{content}"
        n_chunks = len(chunk_text(text))
        chunk_info = f"{n_chunks} chunks" if n_chunks > 1 else "1 chunk"
        print(f"  [{status}] {path} [{chunk_info}]...", end=" ", flush=True)
        embedding = get_embedding(text)
        blob = pack_vector(embedding)

        db.execute("""
            INSERT INTO vec_memory_bank (path, content, content_hash, model, embedding)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                content      = excluded.content,
                content_hash = excluded.content_hash,
                model        = excluded.model,
                embedding    = excluded.embedding,
                indexed_at   = datetime('now')
        """, (path, content, chash, EMBED_MODEL, blob))
        db.commit()
        print(f"ok ({len(embedding)}d)")
        ok += 1

    print(f"\nDone. {ok} embedded, {unchanged} unchanged, {skipped} skipped ({len(files)} total).")

    print(f"\nDone. {len(files)} files indexed.")


def cmd_search(query: str, top_k: int = 5):
    db = get_db()
    rows = db.execute(
        "SELECT path, content, embedding FROM vec_memory_bank"
    ).fetchall()

    if not rows:
        print("No files indexed yet. Run: python3 embed.py index")
        return

    print(f"Embedding query ...", end=" ", flush=True)
    q_vec = get_embedding(query)
    print("done\n")

    scored = []
    for path, content, blob in rows:
        vec = unpack_vector(blob)
        score = cosine_similarity(q_vec, vec)
        scored.append((score, path, content))

    scored.sort(reverse=True)

    print(f"Top {top_k} results for: \"{query}\"\n")
    print("-" * 60)
    for score, path, content in scored[:top_k]:
        preview = content.strip().splitlines()[0][:80]
        print(f"  [{score:.4f}] {path}")
        print(f"           {preview}")
    print("-" * 60)


def cmd_status():
    db = get_db()
    rows = db.execute(
        "SELECT path, content_hash, model, indexed_at FROM vec_memory_bank ORDER BY path"
    ).fetchall()
    if not rows:
        print("No files indexed yet. Run: python3 embed.py index")
        return
    print(f"{'PATH':<52} {'STATUS':<10} INDEXED AT")
    print("-" * 80)
    for path, stored_hash, model, ts in rows:
        try:
            current = content_hash(read_memory_file(path))
            status = "current" if current == stored_hash else "STALE"
        except FileNotFoundError:
            status = "DELETED"
        print(f"  {path:<50} {status:<10} {ts}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(0)

    cmd = sys.argv[1]
    if cmd == "index":
        cmd_index(force="--force" in sys.argv)
    elif cmd == "search":
        if len(sys.argv) < 3:
            print("Usage: python3 embed.py search <query>")
            sys.exit(1)
        cmd_search(" ".join(sys.argv[2:]))
    elif cmd == "status":
        cmd_status()
    else:
        print(__doc__)
        sys.exit(1)
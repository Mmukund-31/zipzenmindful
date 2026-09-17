"""Embeds the wellness knowledge_base/*.md docs into the Chroma "wellness_kb"
collection. This is the RAG ingestion step: parse -> chunk-free short docs ->
embed -> store, so the chat/wellness endpoints can later retrieve them by
semantic search instead of hard-coding advice into prompts.

Safe to run multiple times: skips work if the collection is already populated
unless force=True.
"""
import glob
from pathlib import Path

from langchain_core.documents import Document

from .vectorstore import wellness_kb

KB_DIR = Path(__file__).parent / "knowledge_base"


def _parse_doc(path: Path) -> Document:
    """Parses a markdown file with a simple `key: value` frontmatter block
    delimited by `---` lines into a LangChain Document with metadata."""
    text = path.read_text(encoding="utf-8")
    metadata: dict[str, str] = {"source": path.name}
    body = text

    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            front, body = parts[1], parts[2]
            for line in front.strip().splitlines():
                if ":" in line:
                    key, value = line.split(":", 1)
                    metadata[key.strip()] = value.strip()

    return Document(page_content=body.strip(), metadata=metadata)


def ingest_knowledge_base(force: bool = False) -> int:
    store = wellness_kb()

    if not force:
        existing = store.get(limit=1)
        if existing.get("ids"):
            return 0

    doc_paths = sorted(glob.glob(str(KB_DIR / "*.md")))
    if not doc_paths:
        return 0

    documents = [_parse_doc(Path(p)) for p in doc_paths]
    store.add_documents(documents)
    return len(documents)


if __name__ == "__main__":
    count = ingest_knowledge_base(force=True)
    print(f"Ingested {count} documents into the wellness_kb vector collection.")

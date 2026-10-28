import argparse
import hashlib
import shutil
import tempfile
from pathlib import Path

from docx import Document
from docx.oxml.ns import qn


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def body_nodes(document):
    return list(document.element.body.iter(qn("w:t")))


def body_text(document):
    return "".join(node.text or "" for node in body_nodes(document))


def main():
    parser = argparse.ArgumentParser(
        description="Safely copy or make one exact replacement in an approved DOCX."
    )
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--old")
    parser.add_argument("--new")
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()

    if source == output:
        parser.error("Source and output must be different.")
    if not source.is_file() or source.suffix.lower() != ".docx":
        parser.error("Source must be an existing DOCX.")
    if output.exists() or not output.parent.is_dir():
        parser.error("Output must not exist; parent directory must exist.")
    if output.suffix.lower() != ".docx":
        parser.error("Output must have .docx extension.")
    if (args.old is None) != (args.new is None):
        parser.error("Supply both --old and --new, or neither.")
    if args.old == "":
        parser.error("Empty search text is not allowed.")

    original_hash = digest(source)
    original = Document(str(source))
    expected_text = body_text(original)
    operation = "COPY"

    with tempfile.TemporaryDirectory(prefix="cv-revise-", dir=output.parent) as folder:
        temporary = Path(folder) / "candidate.docx"

        if args.old is None:
            shutil.copyfile(source, temporary)
        else:
            if expected_text.count(args.old) != 1:
                parser.error("Text must occur exactly once in the document body.")

            matches = [
                node for node in body_nodes(original)
                if args.old in (node.text or "")
            ]

            if len(matches) != 1:
                parser.error(
                    "Text spans multiple Word runs; refusing unsafe replacement."
                )

            matches[0].text = matches[0].text.replace(
                args.old, args.new, 1
            )
            expected_text = expected_text.replace(
                args.old, args.new, 1
            )
            original.save(str(temporary))
            operation = "REPLACE"

        verified = Document(str(temporary))

        if body_text(verified) != expected_text:
            raise RuntimeError("Document text validation failed.")

        if (
            len(original.paragraphs) != len(verified.paragraphs)
            or len(original.tables) != len(verified.tables)
            or len(original.sections) != len(verified.sections)
        ):
            raise RuntimeError("Document structure validation failed.")

        if digest(source) != original_hash:
            raise RuntimeError("Source changed during processing.")

        if operation == "COPY" and digest(temporary) != original_hash:
            raise RuntimeError("Byte-for-byte copy validation failed.")

        with temporary.open("rb") as reader, output.open("xb") as writer:
            shutil.copyfileobj(reader, writer)

    print(f"Operation: {operation}")
    print(f"SourceUnchanged: {digest(source) == original_hash}")
    print(f"OutputCreated: {output.is_file()}")
    print("TextAndStructure: PASS")
    print(f"Output: {output}")


if __name__ == "__main__":
    main()

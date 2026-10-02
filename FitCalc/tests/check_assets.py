"""Dependency-free checks for local HTML/CSS references and app metadata."""
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        for key in ("src", "href"):
            value = attrs.get(key, "").strip()
            if value:
                self.refs.append(value)


def local_path(ref, owner):
    if ref.startswith(("#", "//", "data:", "mailto:", "tel:")) or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", ref):
        return None
    path = ref.split("#", 1)[0].split("?", 1)[0]
    if not path:
        return None
    result = (owner.parent / path).resolve()
    if result.is_dir():
        result /= "index.html"
    return result


def main():
    errors = []
    # Ignore generated Electron output and installed packages; they are not
    # project source pages and can contain third-party license HTML.
    html_files = sorted(path for path in ROOT.rglob("*.html") if not {"node_modules", "dist"}.intersection(path.relative_to(ROOT).parts))
    for html in html_files:
        parser = References()
        parser.feed(html.read_text(encoding="utf-8"))
        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        if duplicates:
            errors.append(f"{html.relative_to(ROOT)} duplicate IDs: {', '.join(duplicates)}")
        for ref in parser.refs:
            path = local_path(ref, html)
            if path and not path.is_file():
                errors.append(f"{html.relative_to(ROOT)} missing local reference: {ref}")

    css = ROOT / "main.css"
    for ref in re.findall(r"url\((?:['\"])?([^)'\"]+)", css.read_text(encoding="utf-8")):
        path = local_path(ref.strip(), css)
        if path and not path.is_file():
            errors.append(f"main.css missing local reference: {ref}")

    manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
    for icon in manifest.get("icons", []):
        if not (ROOT / icon["src"]).is_file():
            errors.append(f"manifest missing icon: {icon['src']}")

    service_worker = (ROOT / "service-worker.js").read_text(encoding="utf-8")
    for ref in re.findall(r'"(\./[^"?]+)"', service_worker):
        if not (ROOT / ref.removeprefix("./")).is_file():
            errors.append(f"service worker missing app-shell reference: {ref}")

    if errors:
        print("\n".join("FAIL " + error for error in errors))
        return 1
    print(f"PASS local references, unique IDs, and manifest icons ({len(html_files)} HTML pages)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

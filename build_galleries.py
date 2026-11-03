#!/usr/bin/env python3
"""
Build gallery pages from data/galleries.json.

Edit data/galleries.json, then run:

    python build_galleries.py

Each album needs: title, date, slug, folder, images[].
Optional: playlist.

Image fields:
  path (required), alt, name, loc, loc2, title (artwork title), desc
"""

from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data" / "galleries.json"
OUT = ROOT / "pages" / "gallery"
ASSETS = ROOT / "assets" / "images" / "gallery"


def esc(text: str) -> str:
    return html.escape(text or "", quote=False)


def esc_attr(text: str) -> str:
    return html.escape(text or "", quote=True)


def render_image(folder: str, image: dict) -> str:
    path = image["path"]
    alt = esc_attr(image.get("alt", image.get("name", "")))
    src = f"/assets/images/gallery/{folder}/{path}"

    lines = []
    artwork = image.get("title")
    name = image.get("name", "")
    if artwork:
        lines.append(f"<i>{esc(artwork)},</i> {esc(name)}".rstrip())
    elif name:
        lines.append(esc(name))

    loc = image.get("loc")
    loc2 = image.get("loc2")
    if loc and loc2:
        lines.append(f"{esc(loc)}<br>{esc(loc2)}")
    elif loc:
        lines.append(esc(loc))
    elif loc2:
        lines.append(esc(loc2))

    primary = "<br>\n".join(lines) if lines else ""
    desc = image.get("desc")
    desc_html = f"<p>\n{esc(desc)}\n</p>" if desc else ""

    return f"""        <div class="container" tabindex="0">
            <img src="{src}" alt="{alt}" class="image">
            <div class="overlay">
                <div class="text">
                    <p>
{primary}
</p>
                    {desc_html}
                </div>
            </div>
        </div>"""


def render_page(album: dict) -> str:
    title = album["title"]
    date = album.get("date", "")
    playlist = album.get("playlist", "")
    folder = album["folder"]
    images = "\n\n".join(render_image(folder, img) for img in album.get("images", []))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>{esc(title)} — Kaylee J. Rosendahl</title>
  <link rel="icon" href="/assets/images/favicon/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/images/favicon/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/assets/images/favicon/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/assets/images/favicon/apple-touch-icon.png">
  <link rel="manifest" href="/assets/images/favicon/site.webmanifest">
  <link rel="stylesheet" href="/css/site.css">
  <link rel="stylesheet" href="/css/gallery.css">
  <script src="https://kit.fontawesome.com/a74ec3136c.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="site-header"></div>
  <main class="page page-gallery">
    <article>
      <header id="post-meta" data-title="{esc_attr(title)}" data-date="{esc_attr(date)}" data-playlist="{esc_attr(playlist)}"></header>
<div class="gallery-grid">
{images}
</div>
    </article>
  </main>
  <script src="/js/site.js"></script>
</body>
</html>
"""


def validate(album: dict) -> None:
    for key in ("title", "slug", "folder", "date"):
        if not album.get(key):
            raise SystemExit(f"album missing '{key}': {album.get('title') or album}")
    folder = ASSETS / album["folder"]
    if not folder.is_dir():
        raise SystemExit(f"missing asset folder: assets/images/gallery/{album['folder']}")
    for image in album.get("images", []):
        path = image.get("path")
        if not path:
            raise SystemExit(f"image missing path in {album['title']}")
        if not (folder / path).is_file():
            raise SystemExit(f"missing image: {album['folder']}/{path}")


def build() -> None:
    if not DATA.exists():
        raise SystemExit("missing data/galleries.json")

    albums = json.loads(DATA.read_text(encoding="utf-8"))
    if not isinstance(albums, list):
        raise SystemExit("data/galleries.json must be a list of albums")

    for album in albums:
        validate(album)

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)

    for album in albums:
        dest = OUT / album["slug"]
        dest.mkdir(parents=True)
        (dest / "index.html").write_text(render_page(album), encoding="utf-8")
        print(f"built {album['slug']} ({len(album.get('images', []))} images)")

    print(f"done ({len(albums)} albums)")


if __name__ == "__main__":
    build()

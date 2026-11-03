# kjrosendahl.github.io

Static personal site (plain HTML/CSS/JS). GitHub Pages serves the repo root.

## View locally

```powershell
python -m http.server 8765
```

Open [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Use a local server (not `file://`) so `/data/...` and `/css/...` load correctly.

## Edit the site

| What | Where |
| --- | --- |
| Home copy | `index.html` |
| Theme / layout | `css/site.css` |
| Gallery grid / hover | `css/gallery.css` |
| Header, tabs, lists | `js/site.js` |
| Resume, socials, project/blog links, lucky words | `data/site.json` |
| **Gallery albums** | `data/galleries.json` |
| Blog / project pages | `pages/blog/...`, `pages/projects/...` |

Theme follows the OS: light accent `#2ba0b3`, dark accent `#e23d3d`.

## Galleries

Edit `data/galleries.json`, then build pages:

```powershell
python build_galleries.py
```

That writes `pages/gallery/<slug>/index.html`. The home Gallery tab reads `galleries.json` directly.

### Add / edit an album

1. Put photos in `assets/images/gallery/<folder>/`
2. Add an object to `data/galleries.json`:

```json
{
  "title": "May 2024: Montreal",
  "date": "2024-05-01",
  "slug": "2024-montreal",
  "folder": "montreal-24",
  "playlist": "",
  "images": [
    {
      "path": "maison.jpg",
      "alt": "brick mansion with overgrown ivy",
      "name": "Maison Reid Wilson",
      "loc": "Golden Square Mile, Montreal, Canada",
      "desc": ""
    }
  ]
}
```

- `folder` = asset subfolder under `assets/images/gallery/`
- `slug` = URL path `/pages/gallery/<slug>/`
- `playlist` = Spotify playlist id (optional)
- Image `title` = artwork title (optional, shown in italics)
- `loc` / `loc2` = location lines; `desc` = extra caption

3. Run `python build_galleries.py`

Do not hand-edit generated files under `pages/gallery/` — they are overwritten by the build.

# Dressindia — fabric on lehenga

Upload a fabric photo, pick a lehenga shape, and see how it sits on the skirt, blouse, and dupatta. Open two or three lehengas at once to compare.

**Use it here after GitHub Pages is on:** `https://<your-username>.github.io/dressindia/`

## How to use

1. Click a lehenga template (classic flare, A-line, mermaid, bridal circle).
2. Upload your fabric photos, or click a sample.
3. Turn **Compare** to 2 or 3 to try fabrics side by side.
4. Click the skirt, blouse, or dupatta if you want a different fabric on that piece.
5. Drag **Print size** if the motif looks too big or too small.
6. **Save preview** downloads a PNG of the selected lehenga.

Uploads stay in your own browser. They are not sent to a server.

## Put your fabrics in the repo (so everyone sees them)

1. Add images to `assets/fabrics/`.
2. List them in `assets/fabrics.json`:

```json
{ "id": "my-silk", "name": "My Silk", "file": "my-silk.jpg" }
```

Square photos tile best. A close-up of the cloth, no mannequin, works better than a full outfit shot.

## Run locally

Open the folder with any static server:

```bash
npx --yes serve .
```

Then visit the URL it prints. Opening `index.html` as a file can block the sample fabrics.

## GitHub Pages

This is a static site (HTML / CSS / JS). In the repo: **Settings → Pages → Deploy from a branch → `main` / root**.

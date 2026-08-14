const imgCache = new Map();

export async function loadTemplates() {
  const res = await fetch("assets/templates.json");
  return res.json();
}

export function loadImage(src) {
  if (!src) return Promise.resolve(null);
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
  imgCache.set(src, p);
  return p;
}

function tileFabric(ctx, fabric, w, h, size, rot) {
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.translate(-w / 2, -h / 2);
  const tw = Math.max(28, size);
  const th = Math.max(28, Math.round((tw * fabric.height) / Math.max(1, fabric.width)));
  for (let y = -th; y < h + th; y += th) {
    for (let x = -tw; x < w + tw; x += tw) {
      ctx.drawImage(fabric, x, y, tw, th);
    }
  }
  ctx.restore();
}

function drawMaskedFabric(ctx, fabric, mask, light, w, h, size, rot) {
  if (!fabric || !mask) return;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const o = off.getContext("2d");
  tileFabric(o, fabric, w, h, size, rot);
  o.globalCompositeOperation = "multiply";
  o.drawImage(light, 0, 0, w, h);
  o.globalCompositeOperation = "destination-in";
  o.drawImage(mask, 0, 0, w, h);
  ctx.drawImage(off, 0, 0);
}

export async function paintLehenga(canvas, template, opts) {
  const [photo, mask, light, overlay, fabric, blouseMask] = await Promise.all([
    loadImage(template.photo),
    loadImage(template.mask),
    loadImage(template.light),
    loadImage(template.overlay),
    opts.skirt ? loadImage(opts.skirt) : Promise.resolve(null),
    loadImage(template.blouse),
  ]);
  const blouseFab = opts.blouse ? await loadImage(opts.blouse) : fabric;

  const w = photo.naturalWidth;
  const h = photo.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const size = opts.scale || 90;
  const rot = opts.rotation || 0;

  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(photo, 0, 0, w, h);
  drawMaskedFabric(ctx, fabric, mask, light, w, h, size, rot);
  if (opts.applyBlouse !== false) {
    drawMaskedFabric(ctx, blouseFab || fabric, blouseMask, light, w, h, size, rot);
  }
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.2;
  ctx.drawImage(photo, 0, 0, w, h);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  if (overlay) ctx.drawImage(overlay, 0, 0, w, h);
}

const PAGES = "https://achaud26.github.io/dressindia";
const MODELS = ["gptimage", "gpt-image-2", "klein", "kontext"];

function publicUrl(src) {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  const rel = src.replace(/^\.\//, "").replace(/^\//, "");
  if (location.hostname.endsWith("github.io")) {
    return new URL(rel, location.href).href;
  }
  return `${PAGES}/${rel}`;
}

function buildPrompt({ fabricName, templateName, applyBlouse }) {
  const piece = applyBlouse === false ? "lehenga skirt only (keep the existing blouse)" : "full lehenga — skirt and blouse";
  return [
    "Photorealistic luxury fashion photograph, like a high-end bridal campaign shot on a Phase One camera.",
    `Keep the SAME woman, face, body, pose, jewelry, hair, and camera angle as the first reference photo (${templateName || "lehenga model"}).`,
    `Redress the ${piece} using the EXACT textile from the second reference image (${fabricName || "this fabric"}).`,
    "Match the fabric color, woven floral or brocade motif, metallic zari, and silk sheen exactly. The cloth must look like real draped silk with natural folds, volume, and studio lighting.",
    "Do not change her identity. Do not turn it into illustration, 3D, or cartoon. Full body, dark studio background, ultra detailed, 85mm lens.",
  ].join(" ");
}

function imageUrl(prompt, model, refs) {
  const usable = refs.filter((u) => u && !u.startsWith("data:") && !u.startsWith("blob:"));
  const params = new URLSearchParams({
    model,
    width: "768",
    height: "1024",
    nologo: "true",
    enhance: "true",
    private: "true",
  });
  if (usable.length) params.set("image", usable.join("|"));
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

async function blobFromResponse(res) {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  if (!blob.type.startsWith("image") && blob.size < 4000) throw new Error("not an image");
  return blob;
}

async function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

export async function generateAiPhoto(opts) {
  const prompt = buildPrompt(opts);
  const refs = [publicUrl(opts.templatePhoto), publicUrl(opts.fabricUrl)];
  let lastErr = null;

  for (const model of MODELS) {
    try {
      const url = imageUrl(prompt, model, model === "kontext" ? [refs[0]] : refs);
      const res = await fetch(url, { redirect: "follow" });
      const blob = await blobFromResponse(res);
      return await blobToDataUrl(blob);
    } catch (err) {
      lastErr = err;
    }
  }

  throw lastErr || new Error("AI photo failed");
}

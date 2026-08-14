export const TEMPLATES = [
  { id: "classic", name: "Classic flare" },
  { id: "aline", name: "A-line" },
  { id: "mermaid", name: "Mermaid" },
  { id: "bridal", name: "Bridal circle" },
];

const SKIRTS = {
  classic:
    "M168 318 C148 330 96 378 70 468 C46 552 34 652 38 776 C96 812 304 812 362 776 C366 652 354 552 330 468 C304 378 252 330 232 318 Z",
  aline:
    "M170 318 C162 430 138 600 108 786 C150 804 250 804 292 786 C262 600 238 430 230 318 Z",
  mermaid:
    "M172 318 C168 410 166 500 170 558 C118 602 72 700 56 786 C120 812 280 812 344 786 C328 700 282 602 230 558 C234 500 232 410 228 318 Z",
  bridal:
    "M166 318 C132 338 58 412 32 530 C14 628 12 720 22 778 C90 816 310 816 378 778 C388 720 386 628 368 530 C342 412 268 338 234 318 Z",
};

const HEMS = {
  classic: "M38 776 C96 812 304 812 362 776",
  aline: "M108 786 C150 804 250 804 292 786",
  mermaid: "M56 786 C120 812 280 812 344 786",
  bridal: "M22 778 C90 816 310 816 378 778",
};

function pattern(id, href, size, rot) {
  if (!href) {
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="18" height="18">
      <rect width="18" height="18" fill="#cbb79a"/>
      <path d="M0 18L18 0" stroke="#b79d7d" stroke-width="1"/>
    </pattern>`;
  }
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}" patternTransform="rotate(${rot})">
    <image href="${href}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/>
  </pattern>`;
}

function kalis(id) {
  const lines = [-42, -28, -14, 0, 14, 28, 42]
    .map((a, i) => {
      const r = (a * Math.PI) / 180;
      const x = 200 + Math.sin(r) * 168;
      const y = 318 + Math.cos(r) * 12 + 455;
      return `<line x1="200" y1="322" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(0,0,0,.18)" stroke-width="${i === 3 ? 1.6 : 1}"/>`;
    })
    .join("");
  return `<g clip-path="url(#skirt-${id})" pointer-events="none">${lines}</g>`;
}

function iconPath(templateId) {
  return SKIRTS[templateId];
}

export function templateIcon(templateId) {
  return `<svg viewBox="80 120 240 700" aria-hidden="true">
    <path d="M168 175 L232 175 L228 318 L172 318 Z" fill="none" stroke="currentColor" stroke-width="14"/>
    <path d="${iconPath(templateId)}" fill="none" stroke="currentColor" stroke-width="14"/>
  </svg>`;
}

export function buildLehengaSvg({
  uid,
  template = "classic",
  skirt,
  blouse,
  dupatta,
  scale = 72,
  rotation = 0,
  showDupatta = true,
}) {
  const skirtPath = SKIRTS[template] || SKIRTS.classic;
  const hem = HEMS[template] || HEMS.classic;
  const s = Math.round(scale);
  const showKali = template === "classic" || template === "bridal";

  return `
<svg viewBox="0 0 400 860" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${template} lehenga">
  <defs>
    ${pattern(`skirt-${uid}`, skirt, s, rotation)}
    ${pattern(`blouse-${uid}`, blouse, s, rotation)}
    ${pattern(`dupatta-${uid}`, dupatta, Math.round(s * 0.9), rotation)}
    <linearGradient id="light-${uid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".28"/>
      <stop offset=".45" stop-color="#fff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity=".38"/>
    </linearGradient>
    <linearGradient id="foldL-${uid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".38"/>
      <stop offset=".5" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="foldR-${uid}" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0" stop-color="#000" stop-opacity=".3"/>
      <stop offset=".55" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="skirt-${uid}"><path d="${skirtPath}"/></clipPath>
    <clipPath id="blouse-${uid}"><path d="M150 168 C126 176 108 196 104 222 C100 244 118 252 136 242 C142 228 148 208 156 196 L148 214 C144 250 150 286 158 300 L242 300 C250 286 256 250 252 214 L244 196 C252 208 258 228 264 242 C282 252 300 244 296 222 C292 196 274 176 250 168 C238 156 218 150 200 166 C182 150 162 156 150 168 Z"/></clipPath>
    <radialGradient id="skin-${uid}" cx="35%" cy="30%" r="70%">
      <stop offset="0" stop-color="#efc4a0"/>
      <stop offset="1" stop-color="#d59a72"/>
    </radialGradient>
  </defs>

  <ellipse cx="200" cy="812" rx="118" ry="14" fill="rgba(0,0,0,.45)"/>

  <path d="M148 54 C126 86 128 128 150 150 C168 128 176 96 170 70 C198 48 238 58 252 96 C268 84 278 108 262 150 C286 128 292 84 268 52 C236 18 176 18 148 54 Z" fill="#1a0f0c"/>
  <ellipse cx="200" cy="86" rx="29" ry="34" fill="url(#skin-${uid})"/>
  <path d="M188 118 L212 118 C214 138 210 152 200 158 C190 152 186 138 188 118 Z" fill="url(#skin-${uid})"/>

  <path data-part="arm" d="M250 170 C278 186 296 236 290 318 C288 352 282 402 276 438 C274 450 262 450 260 438 C268 390 274 340 272 300 C270 240 262 196 244 178 Z" fill="url(#skin-${uid})"/>

  <path data-part="skirt" d="${skirtPath}" fill="url(#skirt-${uid})" />
  <g clip-path="url(#skirt-${uid})" pointer-events="none">
    <rect x="40" y="318" width="90" height="500" fill="url(#foldL-${uid})"/>
    <rect x="270" y="318" width="90" height="500" fill="url(#foldR-${uid})"/>
    <rect x="20" y="300" width="360" height="520" fill="url(#light-${uid})"/>
  </g>
  ${showKali ? kalis(uid) : ""}
  <path d="${hem}" fill="none" stroke="#d4af6a" stroke-width="7" stroke-linecap="round"/>
  <path d="${hem}" fill="none" stroke="#f3e0a8" stroke-width="1.6" transform="translate(0 -4)"/>

  <path d="M176 300 L224 300 C236 304 238 322 224 326 L176 326 C162 322 164 304 176 300 Z" fill="#d4af6a"/>
  <path d="M180 306 L220 306" stroke="#f3e0a8" stroke-width="1.2"/>

  <path d="M168 292 C176 304 224 304 232 292 C228 308 172 308 168 292 Z" fill="url(#skin-${uid})"/>

  <path data-part="blouse" d="M150 168 C126 176 108 196 104 222 C100 244 118 252 136 242 C142 228 148 208 156 196 L148 214 C144 250 150 286 158 300 L242 300 C250 286 256 250 252 214 L244 196 C252 208 258 228 264 242 C282 252 300 244 296 222 C292 196 274 176 250 168 C238 156 218 150 200 166 C182 150 162 156 150 168 Z" fill="url(#blouse-${uid})" />
  <g clip-path="url(#blouse-${uid})" pointer-events="none">
    <rect x="100" y="150" width="200" height="160" fill="url(#light-${uid})"/>
  </g>
  <path d="M176 300 L224 300" fill="none" stroke="#d4af6a" stroke-width="3"/>

  <path data-part="arm" d="M150 170 C122 186 100 228 108 268 C114 292 138 304 154 292 C148 278 132 268 136 242 C140 214 148 190 164 178 Z" fill="url(#skin-${uid})"/>

  ${
    showDupatta
      ? `<path data-part="dupatta" d="M214 148 C250 170 272 230 286 330 C300 430 322 560 348 650 C356 678 328 690 318 658 C292 540 274 420 258 328 C244 236 228 180 204 156 C196 148 204 142 214 148 Z" fill="url(#dupatta-${uid})" opacity=".96"/>
         <path d="M196 160 C210 200 226 268 232 330 C238 280 224 210 200 168 Z" fill="url(#dupatta-${uid})" opacity=".9" data-part="dupatta"/>`
      : ""
  }

  <path d="M170 58 C186 36 226 36 232 64 C210 48 186 50 170 58 Z" fill="#1a0f0c"/>
  <path d="M198 52 L202 52 L204 92 L196 92 Z" fill="#d4af6a"/>
  <circle cx="200" cy="102" r="4.2" fill="#d4af6a"/>
  <path d="M171 88 C176 86 180 90 180 94" fill="none" stroke="#3a241c" stroke-width="1.5"/>
  <path d="M229 88 C224 86 220 90 220 94" fill="none" stroke="#3a241c" stroke-width="1.5"/>
  <path d="M194 112 C198 116 202 116 206 112" fill="none" stroke="#a3454a" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="168" cy="102" r="3.2" fill="#d4af6a"/>
  <circle cx="232" cy="102" r="3.2" fill="#d4af6a"/>
  <path d="M188 128 C196 148 204 148 212 128" fill="none" stroke="#d4af6a" stroke-width="2"/>
  <circle cx="200" cy="146" r="3.5" fill="#d4af6a"/>
  <circle cx="188" cy="136" r="2" fill="#e8d39a"/>
  <circle cx="212" cy="136" r="2" fill="#e8d39a"/>
</svg>`;
}

import { TEMPLATES, buildLehengaSvg, templateIcon } from "./templates.js";

const DB_NAME = "dressindia";
const STORE = "uploads";

const state = {
  template: "classic",
  scale: 72,
  rotation: 0,
  part: "all",
  slots: 2,
  active: 0,
  showDupatta: true,
  fabrics: [],
  picks: [
    { skirt: "maroon-brocade", blouse: "maroon-brocade", dupatta: "ivory-zari" },
    { skirt: "ivory-zari", blouse: "ivory-zari", dupatta: "maroon-brocade" },
    { skirt: "emerald-silk", blouse: "emerald-silk", dupatta: "mustard-silk" },
  ],
};

const $ = (id) => document.getElementById(id);

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function allUploads() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveUpload(item) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function deleteUpload(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function fabricById(id) {
  return state.fabrics.find((f) => f.id === id);
}

function fabricUrl(id) {
  return fabricById(id)?.url || "";
}

function fabricName(id) {
  return fabricById(id)?.name || "No fabric";
}

function usedIds() {
  const ids = new Set();
  state.picks.slice(0, state.slots).forEach((p) => {
    ids.add(p.skirt);
    ids.add(p.blouse);
    ids.add(p.dupatta);
  });
  return ids;
}

function renderFabrics() {
  const used = usedIds();
  $("fabricGrid").innerHTML = state.fabrics
    .map(
      (f) => `
      <div class="swatch ${used.has(f.id) ? "is-used" : ""}" data-fabric="${f.id}" role="button" tabindex="0">
        <img src="${f.url}" alt="${f.name}" />
        <span>${f.name}</span>
        ${f.uploaded ? `<button class="x" data-del="${f.id}" type="button" aria-label="Remove">×</button>` : ""}
      </div>`
    )
    .join("");
}

function renderTemplates() {
  $("templateRow").innerHTML = TEMPLATES.map(
    (t) => `
    <button class="tpl ${state.template === t.id ? "is-on" : ""}" data-template="${t.id}" type="button">
      ${templateIcon(t.id)}
      <b>${t.name}</b>
    </button>`
  ).join("");
}

function renderStage() {
  $("stage").style.setProperty("--cols", state.slots);
  $("stage").innerHTML = state.picks
    .slice(0, state.slots)
    .map((pick, i) => {
      const svg = buildLehengaSvg({
        uid: `s${i}`,
        template: state.template,
        skirt: fabricUrl(pick.skirt),
        blouse: fabricUrl(pick.blouse),
        dupatta: fabricUrl(pick.dupatta),
        scale: state.scale,
        rotation: state.rotation,
        showDupatta: state.showDupatta,
      });
      return `<article class="slot ${i === state.active ? "is-focus" : ""}" data-slot="${i}">
        ${svg}
        <div class="slot-label">
          <span>Lehenga ${i + 1}</span>
          <strong>${fabricName(pick.skirt)}</strong>
        </div>
      </article>`;
    })
    .join("");
}

function render() {
  renderFabrics();
  renderTemplates();
  renderStage();
  document.querySelectorAll(".slot-btn").forEach((b) => {
    b.classList.toggle("is-on", Number(b.dataset.slots) === state.slots);
  });
  document.querySelectorAll("#partPills button").forEach((b) => {
    b.classList.toggle("is-on", b.dataset.part === state.part);
  });
}

function applyFabric(id) {
  const pick = state.picks[state.active];
  if (state.part === "all") {
    pick.skirt = id;
    pick.blouse = id;
    pick.dupatta = id;
  } else {
    pick[state.part] = id;
  }
  render();
}

function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function addFiles(fileList) {
  const files = [...fileList].filter((f) => f.type.startsWith("image/"));
  for (const file of files) {
    const url = await readFile(file);
    const item = {
      id: `up-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      url,
      uploaded: true,
    };
    await saveUpload(item);
    state.fabrics.push(item);
  }
  if (files.length) applyFabric(state.fabrics[state.fabrics.length - 1].id);
  else render();
}

async function boot() {
  const res = await fetch("assets/fabrics.json");
  const samples = await res.json();
  state.fabrics = samples.map((s) => ({
    ...s,
    url: `assets/fabrics/${s.file}`,
    uploaded: false,
  }));
  try {
    const uploads = await allUploads();
    state.fabrics.push(...uploads);
  } catch {
    /* private mode */
  }
  render();
}

$("stage").addEventListener("click", (e) => {
  const slot = e.target.closest("[data-slot]");
  if (!slot) return;
  state.active = Number(slot.dataset.slot);
  const part = e.target.closest("[data-part]")?.dataset.part;
  if (part && part !== "arm") {
    state.part = part;
  }
  render();
});

$("fabricGrid").addEventListener("click", async (e) => {
  const del = e.target.closest("[data-del]");
  if (del) {
    e.preventDefault();
    e.stopPropagation();
    await deleteUpload(del.dataset.del);
    state.fabrics = state.fabrics.filter((f) => f.id !== del.dataset.del);
    render();
    return;
  }
  const swatch = e.target.closest("[data-fabric]");
  if (swatch) applyFabric(swatch.dataset.fabric);
});

$("templateRow").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-template]");
  if (!btn) return;
  state.template = btn.dataset.template;
  render();
});

document.querySelector(".compare-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-slots]");
  if (!btn) return;
  state.slots = Number(btn.dataset.slots);
  state.active = Math.min(state.active, state.slots - 1);
  render();
});

$("partPills").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-part]");
  if (!btn) return;
  state.part = btn.dataset.part;
  render();
});

$("scale").addEventListener("input", (e) => {
  state.scale = Number(e.target.value);
  renderStage();
});
$("rotation").addEventListener("input", (e) => {
  state.rotation = Number(e.target.value);
  renderStage();
});
$("showDupatta").addEventListener("change", (e) => {
  state.showDupatta = e.target.checked;
  renderStage();
});

const drop = $("dropZone");
const input = $("fileInput");
input.addEventListener("change", () => addFiles(input.files));
["dragenter", "dragover"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.add("is-over");
  });
});
["dragleave", "drop"].forEach((ev) => {
  drop.addEventListener(ev, (e) => {
    e.preventDefault();
    drop.classList.remove("is-over");
  });
});
drop.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

$("saveBtn").addEventListener("click", async () => {
  const slot = document.querySelector(".slot.is-focus svg") || document.querySelector(".slot svg");
  if (!slot) return;
  const xml = new XMLSerializer().serializeToString(slot);
  const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 1935;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1a1210";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `dressindia-lehenga.png`;
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
});

boot();

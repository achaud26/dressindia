import { loadTemplates, paintLehenga } from "./templates.js";

const DB_NAME = "dressindia";
const STORE = "uploads";

const state = {
  templates: [],
  template: "studio",
  scale: 88,
  rotation: 0,
  part: "all",
  slots: 2,
  active: 0,
  fabrics: [],
  picks: [{ skirt: "", blouse: "" }, { skirt: "", blouse: "" }, { skirt: "", blouse: "" }],
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
  return fabricById(id)?.name || "Pick a fabric";
}

function usedIds() {
  const ids = new Set();
  state.picks.slice(0, state.slots).forEach((p) => {
    ids.add(p.skirt);
    ids.add(p.blouse);
  });
  return ids;
}

function family(name) {
  return (name || "").replace(/ \d+$/, "");
}

function renderFabrics() {
  const used = usedIds();
  const verified = state.fabrics.filter((f) => f.group === "verified");
  const uploads = state.fabrics.filter((f) => f.uploaded);
  const swatch = (f) => `
    <div class="swatch ${used.has(f.id) ? "is-used" : ""}" data-fabric="${f.id}" role="button" tabindex="0">
      <img src="${f.url}" alt="${f.name}" />
      <span>${f.name}</span>
      ${f.uploaded ? `<button class="x" data-del="${f.id}" type="button" aria-label="Remove">×</button>` : ""}
    </div>`;

  let html = "";
  if (verified.length) {
    html += `<p class="group-label">Verified · ${verified.length} · color order</p>`;
    let last = "";
    for (const f of verified) {
      const fam = family(f.name);
      if (fam !== last) {
        html += `<p class="hue-label">${fam}</p>`;
        last = fam;
      }
      html += swatch(f);
    }
  }
  if (uploads.length) {
    html += `<p class="group-label">Your uploads</p>`;
    html += uploads.map(swatch).join("");
  }
  $("fabricGrid").innerHTML = html;
}

function currentTemplate() {
  return state.templates.find((t) => t.id === state.template) || state.templates[0];
}

function renderTemplates() {
  $("templateRow").innerHTML = state.templates
    .map(
      (t) => `
      <button class="tpl ${state.template === t.id ? "is-on" : ""}" data-template="${t.id}" type="button">
        <img src="${t.photo}" alt="" />
        <b>${t.name}</b>
        ${t.credit ? `<i>${t.credit}</i>` : ""}
      </button>`
    )
    .join("");
}

async function renderStage() {
  $("stage").style.setProperty("--cols", state.slots);
  const tpl = currentTemplate();
  $("stage").innerHTML = state.picks
    .slice(0, state.slots)
    .map(
      (pick, i) => `
      <article class="slot ${i === state.active ? "is-focus" : ""}" data-slot="${i}">
        <canvas id="cv-${i}"></canvas>
        <div class="slot-label">
          <span>${tpl?.name || "Lehenga"} ${i + 1}</span>
          <strong>${fabricName(pick.skirt)}</strong>
        </div>
      </article>`
    )
    .join("");

  await Promise.all(
    state.picks.slice(0, state.slots).map((pick, i) => {
      const canvas = document.getElementById(`cv-${i}`);
      if (!canvas || !tpl) return Promise.resolve();
      return paintLehenga(canvas, tpl, {
        skirt: fabricUrl(pick.skirt),
        blouse: fabricUrl(pick.blouse || pick.skirt),
        scale: state.scale,
        rotation: state.rotation,
        applyBlouse: state.part !== "skirt",
      }).catch((err) => console.warn(err));
    })
  );
}

function renderChrome() {
  renderFabrics();
  renderTemplates();
  document.querySelectorAll(".slot-btn").forEach((b) => {
    b.classList.toggle("is-on", Number(b.dataset.slots) === state.slots);
  });
  document.querySelectorAll("#partPills button").forEach((b) => {
    b.classList.toggle("is-on", b.dataset.part === state.part);
  });
}

async function render() {
  renderChrome();
  await renderStage();
}

function applyFabric(id) {
  const pick = state.picks[state.active];
  if (state.part === "blouse") pick.blouse = id;
  else if (state.part === "skirt") pick.skirt = id;
  else {
    pick.skirt = id;
    pick.blouse = id;
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
  const [samples, templates] = await Promise.all([
    fetch("assets/fabrics.json").then((r) => r.json()),
    loadTemplates(),
  ]);
  state.templates = templates;
  state.template = templates[0]?.id || "studio";
  state.fabrics = samples.map((s) => ({
    ...s,
    url: `assets/fabrics/${s.file}`,
    uploaded: false,
  }));
  const verified = state.fabrics.filter((f) => f.group === "verified");
  if (verified[0]) {
    state.picks[0] = { skirt: verified[0].id, blouse: verified[0].id };
  }
  if (verified[8]) {
    state.picks[1] = { skirt: verified[8].id, blouse: verified[8].id };
  } else if (verified[1]) {
    state.picks[1] = { skirt: verified[1].id, blouse: verified[1].id };
  }
  if (verified[16]) {
    state.picks[2] = { skirt: verified[16].id, blouse: verified[16].id };
  }
  try {
    const uploads = await allUploads();
    state.fabrics.push(...uploads);
  } catch {
    /* private mode */
  }
  await render();
}

$("stage").addEventListener("click", (e) => {
  const slot = e.target.closest("[data-slot]");
  if (!slot) return;
  state.active = Number(slot.dataset.slot);
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
  renderChrome();
});

let scaleTimer;
$("scale").addEventListener("input", (e) => {
  state.scale = Number(e.target.value);
  clearTimeout(scaleTimer);
  scaleTimer = setTimeout(() => renderStage(), 40);
});
$("rotation").addEventListener("input", (e) => {
  state.rotation = Number(e.target.value);
  clearTimeout(scaleTimer);
  scaleTimer = setTimeout(() => renderStage(), 40);
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

$("saveBtn").addEventListener("click", () => {
  const canvas = document.querySelector(".slot.is-focus canvas") || document.querySelector(".slot canvas");
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "dressindia-lehenga.png";
  a.click();
});

boot();

(function () {
  const MONACO_BASE =
    "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs";

  function loadMonaco(callback) {
    const script = document.createElement("script");

    script.src = MONACO_BASE + "/loader.js";

    script.onload = function () {
      window.require.config({
        paths: {
          vs: MONACO_BASE,
        },
      });

      window.require(["vs/editor/editor.main"], function () {
        window.createEditorInstance = function (el, value = "") {
          return monaco.editor.create(el, {
            value,
            language: "python",
            theme: "vs-dark",
            automaticLayout: true,
          });
        };

        callback();
      });
    };

    document.head.appendChild(script);
  }

  loadMonaco(() => {
    initNotebook();
  });
})();

let editors = {};

let NOTEBOOK = {
  cells: [],

  dirty: false,
};

let savePromise = null;

let saveTimer = null;

const NOTEBOOK_ID = document.getElementById("notebook").dataset.notebookId;

const saveStatus = document.getElementById("save-status");

// =======================
// STATUS
// =======================

function setSaveStatus(status) {
  saveStatus.className = "";

  const map = {
    saved: "Saved",

    unsaved: "● Unsaved changes",

    saving: "Saving...",

    error: "Save failed",
  };

  saveStatus.textContent = map[status];

  saveStatus.classList.add(status);
}

// =======================
// INIT
// =======================

async function initNotebook() {
  await loadNotebook();

  if (NOTEBOOK.cells.length === 0) {
    await insertAtTop("code");
  }
}

// =======================
// LOAD
// =======================

async function loadNotebook() {
  const res = await fetch(
    `/workbench/load-notebook/?notebook_id=${NOTEBOOK_ID}`,
  );

  const data = await res.json();

  NOTEBOOK.cells = data.cells;

  data.cells.forEach((cell) => renderCell(cell));
}

// =======================
// SAVE
// =======================

function scheduleSave() {
  clearTimeout(saveTimer);

  saveTimer = setTimeout(() => {
    if (NOTEBOOK.dirty) saveNotebook();
  }, 2000);
}

async function saveNotebook() {
  if (savePromise) return savePromise;

  savePromise = performSave();

  try {
    await savePromise;
  } finally {
    savePromise = null;
  }
}

async function performSave() {
  setSaveStatus("saving");

  const cells = NOTEBOOK.cells.map((cell) => ({
    ...cell,

    source: editors[cell.id] ? editors[cell.id].getValue() : cell.source,
  }));

  const res = await fetch("/workbench/save-notebook/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,

      cells,
    }),
  });

  if (!res.ok) throw Error();

  NOTEBOOK.dirty = false;

  setSaveStatus("saved");
}

// =======================
// INSERT
// =======================

async function insertAtTop(type) {
  const cell = await createCell(type);

  NOTEBOOK.cells.unshift(cell);

  renderCell(cell);

  NOTEBOOK.dirty = true;

  saveNotebook();
}

async function insertCell(afterId, type) {
  const cell = await createCell(type);

  const index = NOTEBOOK.cells.findIndex((c) => c.id === afterId);

  NOTEBOOK.cells.splice(index + 1, 0, cell);

  renderCell(cell, afterId);

  NOTEBOOK.dirty = true;

  saveNotebook();
}

async function createCell(type) {
  const res = await fetch("/workbench/add-cell/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,

      type,
    }),
  });

  return await res.json();
}

// =======================
// RENDER
// =======================

function renderCell(cell, afterId = null) {
  const container = document.getElementById("cells");

  const wrapper = document.createElement("div");

  wrapper.className = "cell-wrapper";

  wrapper.id = "wrapper-" + cell.id;

  wrapper.innerHTML = `

<div class="cell">

<div class="cell-header">

<span>${cell.type}</span>

<div>

<button onclick="runCell('${cell.id}')">
Run ▶
</button>

<button onclick="deleteCell('${cell.id}')">
Delete ✖
</button>

</div>

</div>


<div id="editor-${cell.id}"
class="editor">
</div>

</div>


<div class="output"
id="output-${cell.id}">
</div>


<div class="insert-bar">

<div class="insert-buttons">

<button onclick="insertCell('${cell.id}','code')">
+ Code
</button>


<button onclick="insertCell('${cell.id}','text')">
+ Text
</button>

</div>

</div>

`;

  if (afterId) {
    document
      .getElementById("wrapper-" + afterId)
      .insertAdjacentElement("afterend", wrapper);
  } else {
    container.appendChild(wrapper);
  }

  setTimeout(() => {
    const editor = createEditorInstance(
      document.getElementById("editor-" + cell.id),
      cell.source || "",
    );

    editors[cell.id] = editor;

    editor.onDidChangeModelContent(() => {
      cell.source = editor.getValue();

      NOTEBOOK.dirty = true;

      setSaveStatus("unsaved");

      scheduleSave();
    });
  }, 0);
}

// =======================
// RUN
// =======================

async function runCell(id) {
  await saveNotebook();

  const res = await fetch("/workbench/run-cell/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,

      cell_id: id,
    }),
  });

  const data = await res.json();

  document.getElementById("output-" + id).textContent =
    data.error || data.output || "";
}

// =======================
// DELETE
// =======================

async function deleteCell(id) {
  await fetch("/workbench/delete-cell/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,

      cell_id: id,
    }),
  });

  document.getElementById("wrapper-" + id).remove();

  delete editors[id];

  NOTEBOOK.cells = NOTEBOOK.cells.filter((c) => c.id !== id);

  NOTEBOOK.dirty = true;

  saveNotebook();
}

// =======================
// CTRL+S
// =======================

document.addEventListener("keydown", async (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault();

    await saveNotebook();
  }
});

// =======================
// CSRF
// =======================

function getCSRF() {
  const cookies = decodeURIComponent(document.cookie).split(";");

  for (let c of cookies) {
    c = c.trim();

    if (c.startsWith("csrftoken=")) return c.substring(10);
  }

  return "";
}

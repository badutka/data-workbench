// <!-- ================= MONACO ISOLATED LOADER ================= -->

(function () {
  const MONACO_BASE =
    "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs";

  function loadMonaco(callback) {
    const script = document.createElement("script");
    script.src = MONACO_BASE + "/loader.js";

    script.onload = function () {
      const require = window.require;

      require.config({
        paths: { vs: MONACO_BASE },
      });

      require(["vs/editor/editor.main"], function () {
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

  loadMonaco(function () {
    initNotebook();
  });
})();

// <!-- ================= NOTEBOOK LOGIC ================= -->

let editors = {};
let NOTEBOOK = { cells: [] };
const NOTEBOOK_ID = document.getElementById("notebook").dataset.notebookId;

// ================= INIT =================
async function initNotebook() {
  await loadNotebook();

  if (NOTEBOOK.cells.length === 0) {
    await createCell();
  }
}

// =========================
// SAVE NOTEBOOK
// =========================

async function saveNotebook() {
  const cells = NOTEBOOK.cells.map((cell) => {
    return {
      id: cell.id,
      source: editors[cell.id] ? editors[cell.id].getValue() : "",
    };
  });

  const res = await fetch("/workbench/save-notebook/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      cells,
    }),
  });

  const data = await res.json();

  console.log("Notebook saved:", data.saved, "cells");
}

async function loadNotebook() {
  const res = await fetch(
    `/workbench/load-notebook/?notebook_id=${NOTEBOOK_ID}`,
  );

  const data = await res.json();

  NOTEBOOK.cells = data.cells;

  data.cells.forEach((cell) => {
    renderCell(cell);
  });
}

// ================= CREATE FIRST CELL =================
async function createCell() {
  const res = await fetch("/workbench/add-cell/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRF(),
    },
    body: JSON.stringify({ notebook_id: NOTEBOOK_ID }),
  });

  const cell = await res.json();

  NOTEBOOK.cells.push(cell);
  renderCell(cell);
}

// ================= GLOBAL INSERT (TOP) =================
async function insertAtTop(type) {
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

  const cell = await res.json();

  NOTEBOOK.cells.unshift(cell);

  const first = document.querySelector(".cell-wrapper");

  renderCell(cell);

  if (first) {
    const newEl = document.getElementById("wrapper-" + cell.id);
    first.insertAdjacentElement("beforebegin", newEl);
  }
}

// ================= INSERT AFTER CELL =================
async function insertCell(afterCellId, type) {
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

  const cell = await res.json();

  NOTEBOOK.cells.push(cell);

  renderCell(cell, afterCellId);
}

// ================= RENDER CELL =================
function renderCell(cell, afterCellId = null) {
  const container = document.getElementById("cells");

  const wrapper = document.createElement("div");
  wrapper.className = "cell-wrapper";
  wrapper.id = "wrapper-" + cell.id;

  wrapper.innerHTML = `
        <div class="cell">
            <div class="cell-header">
                <span>Cell ${cell.id}</span>
                <div>
                    <button onclick="runCell('${cell.id}')">Run ▶</button>
                    <button onclick="deleteCell('${cell.id}')">Delete ✖</button>
                </div>
            </div>

            <div id="editor-${cell.id}" class="editor"></div>
        </div>

        <div class="output" id="output-${cell.id}"></div>

        <!-- BOTTOM INSERT BAR (same UI as global bar) -->
        <div class="insert-bar">
            <div class="insert-buttons">
                <button onclick="insertCell('${cell.id}', 'code')">+ Code</button>
                <button onclick="insertCell('${cell.id}', 'text')">+ Text</button>
            </div>
        </div>
    `;

  setTimeout(() => {
    editors[cell.id] = window.createEditorInstance(
      document.getElementById("editor-" + cell.id),
      cell.source || "",
    );
  }, 0);

  if (afterCellId) {
    const after = document.getElementById("wrapper-" + afterCellId);
    after.insertAdjacentElement("afterend", wrapper);
  } else {
    container.appendChild(wrapper);
  }
}

// ================= RUN CELL =================
async function runCell(cellId) {
  await saveCell(cellId);

  const code = editors[cellId].getValue();

  const res = await fetch("/workbench/run-cell/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRF(),
    },
    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,
      cell_id: cellId,
      code,
    }),
  });

  const data = await res.json();

  const out = document.getElementById("output-" + cellId);

  if (data.error) {
    out.style.color = "red";
    out.textContent = data.error;
  } else {
    out.style.color = "#0f0";
    out.textContent = data.output;
  }
}

// ================= SAVE CELL =================
async function saveCell(cellId) {
  const source = editors[cellId].getValue();

  await fetch("/workbench/update-cell/", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRF(),
    },

    body: JSON.stringify({
      cell_id: cellId,
      source,
    }),
  });
}

// ================= DELETE CELL =================
async function deleteCell(cellId) {
  await fetch("/workbench/delete-cell/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRF(),
    },
    body: JSON.stringify({
      notebook_id: NOTEBOOK_ID,
      cell_id: cellId,
    }),
  });

  const wrapper = document.getElementById("wrapper-" + cellId);

  if (wrapper) wrapper.remove();

  delete editors[cellId];
  NOTEBOOK.cells = NOTEBOOK.cells.filter((c) => c.id !== cellId);
}

// ================= CSRF =================
function getCSRF() {
  const name = "csrftoken=";
  const cookies = decodeURIComponent(document.cookie).split(";");

  for (let c of cookies) {
    c = c.trim();
    if (c.startsWith(name)) {
      return c.substring(name.length);
    }
  }
  return "";
}

// =========================
// KEYBOARD SHORTCUTS
// =========================

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "s") {
    event.preventDefault();

    saveNotebook();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
       TOOLBAR DROPDOWNS
    ========================= */

  const toolbarMenus = document.querySelectorAll(".toolbar-menu");

  document.querySelectorAll(".app-menu-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const menu = button.closest(".toolbar-menu");

      toolbarMenus.forEach((item) => {
        if (item !== menu) {
          item.classList.remove("open");
        }
      });

      menu.classList.toggle("open");
    });
  });

  document.addEventListener("click", () => {
    toolbarMenus.forEach((menu) => {
      menu.classList.remove("open");
    });
  });

  /* =========================
       SIDE PANELS
    ========================= */

  const leftPanel = document.getElementById("leftPanel");
  const rightPanel = document.getElementById("rightPanel");

  let activeLeftPanel = null;
  let activeRightPanel = null;

  function openLeftPanel(panelName) {
    if (!leftPanel) {
      return;
    }

    leftPanel.classList.add("open");

    leftPanel.querySelector(".panel-header").textContent = panelName;

    const content = leftPanel.querySelector(".panel-content");

    activeLeftPanel = panelName;

    switch (panelName) {
      case "Catalog":
        content.innerHTML = `
                    <div class="catalog-tree-item">
                        <i class="fas fa-folder"></i>
                        Projects
                    </div>

                    <div class="catalog-tree-item">
                        <i class="fas fa-folder-open"></i>
                        Analysis
                    </div>

                    <div class="catalog-tree-item">
                        <i class="fas fa-file"></i>
                        notebook_A.ipynb
                    </div>

                    <div class="catalog-tree-item">
                        <i class="fas fa-file"></i>
                        notebook_B.ipynb
                    </div>
                `;

        break;

      case "Workspace":
        content.innerHTML = `
                    <div class="catalog-tree-item">
                        <i class="fas fa-layer-group"></i>
                        Current workspace
                    </div>
                `;

        break;

      default:
        content.innerHTML = "";
    }
  }

  function closeLeftPanel() {
    if (!leftPanel) {
      return;
    }

    leftPanel.classList.remove("open");
    activeLeftPanel = null;
  }

  function openRightPanel(panelName) {
    if (!rightPanel) {
      return;
    }

    rightPanel.classList.add("open");

    rightPanel.querySelector(".panel-header").textContent = panelName;

    activeRightPanel = panelName;
  }

  function closeRightPanel() {
    if (!rightPanel) {
      return;
    }

    rightPanel.classList.remove("open");
    activeRightPanel = null;
  }

  document.querySelectorAll(".side-rail-button").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const side = button.dataset.side;
      const panel = button.dataset.panel;

      if (side === "left") {
        if (activeLeftPanel === panel) {
          closeLeftPanel();
        } else {
          openLeftPanel(panel);
        }
      }

      if (side === "right") {
        if (activeRightPanel === panel) {
          closeRightPanel();
        } else {
          openRightPanel(panel);
        }
      }
    });
  });
});

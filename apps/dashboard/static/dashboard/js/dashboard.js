// dashboard.js


/**
 * Dashboard bootstrap and manager coordinator.
 *
 * Connects:
 * - GridManager -> GridStack layout handling
 * - LayoutManager -> layout persistence
 * - EditModeManager -> edit state UI
 * - SidebarResizer -> sidebar resizing
 *
 * Startup:
 * DOMContentLoaded
 *   ├── initCSRF()
 *   ├── initWidgets()
 *   ├── initDropdowns()
 *   └── DashboardManager.init()
 *
 * Layout flow: GridManager -> LayoutManager -> Backend
 */


import { SidebarResizer } from "./sidebar/SidebarResizer.js";
import { GridManager } from "./grid/GridManager.js";
import { EditModeManager } from "./edit/EditModeManager.js";
import { LayoutManager } from "./layout/LayoutManager.js";
import { initWidgets } from "./widgets/initWidgets.js";
import { initCSRF } from "./utils/csrf.js";
import { initDropdowns } from "./ui/DropdownManager.js";


const DashboardManager = {

    gridManager: null,
    editModeManager: null,
    layoutManager: null,
    sidebarResizer: null,


    ui: {
        shell: null,
        gridStack: null,
        editBtn: null,
        editActions: null,
        resizer: null,
        sidebarContent: null
    },


    /**
     * Initializes dashboard components.
     */
    init() {

        this.ui.shell =
            document.querySelector('.dashboard-shell');

        this.ui.gridStack =
            document.querySelector('.grid-stack');

        this.ui.editBtn =
            document.getElementById('editBtn');

        this.ui.editActions =
            document.getElementById('editActions');

        this.ui.resizer =
            document.getElementById('resizer');

        this.ui.sidebarContent =
            document.getElementById('sidebar-content');


        if (!this.ui.gridStack) {
            return;
        }


        this.initGridStack();
        this.initLayoutManager();
        this.initEditMode();
        this.initEventListeners();
        this.initSidebarResizer();
    },


    /**
     * Creates and initializes GridStack handling.
     */
    initGridStack() {

        this.gridManager = new GridManager({
            element: this.ui.gridStack,
            columns: 32,
            cellHeight: 50
        });


        this.gridManager.init();


        this.gridManager.onChange(
            () => {

                this.layoutManager.save();

            }
        );
    },


    /**
     * Creates layout persistence manager.
     */
    initLayoutManager() {

        this.layoutManager = new LayoutManager({

            gridManager: this.gridManager,

            endpoint:
                "/dashboard/api/widgets/update-layout/"

        });

    },


    /**
     * Creates edit mode controller.
     */
    initEditMode() {

        this.editModeManager = new EditModeManager({

            shell: this.ui.shell,

            gridElement: this.ui.gridStack,

            editBtn: this.ui.editBtn,

            editActions: this.ui.editActions,

            gridManager: this.gridManager

        });


        this.editModeManager.init();
    },


    /**
     * Connects dashboard action buttons.
     */
    initEventListeners() {

        const cancelBtn =
            document.getElementById('cancelBtn');

        const saveBtn =
            document.getElementById('saveBtn');


        if (cancelBtn) {

            cancelBtn.addEventListener(
                'click',
                () => this.editModeManager.toggle()
            );

        }


        if (saveBtn) {

            saveBtn.addEventListener(
                'click',
                () => this.editModeManager.toggle()
            );

        }

    },


    /**
     * Creates sidebar resizing controller.
     */
    initSidebarResizer() {

        this.sidebarResizer = new SidebarResizer({

            resizer: this.ui.resizer,

            sidebarContent: this.ui.sidebarContent

        });


        this.sidebarResizer.init();

    }

};


// Application startup

document.addEventListener('DOMContentLoaded', () => {

    initCSRF();

    initWidgets();

    initDropdowns();

    DashboardManager.init();

});
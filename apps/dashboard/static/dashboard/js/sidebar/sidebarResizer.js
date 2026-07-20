// sidebar/SidebarResizer.js

/**
 * Sidebar resizing controller.
 *
 * Handles the drag interaction used to resize the dashboard sidebar.
 *
 * Responsibilities:
 * - Listen for resize mouse events
 * - Calculate new sidebar width
 * - Update sidebar width styles
 * - Manage resizing UI state
 *
 */


export class SidebarResizer {

    constructor({
        resizer,
        sidebarContent
    }) {

        this.resizer = resizer;
        this.sidebarContent = sidebarContent;

        this.isResizing = false;
    }


    /**
     * Initializes mouse event listeners.
     *
     * Exits silently if required DOM elements are missing.
     */
    init() {

        if (!this.resizer || !this.sidebarContent) {
            return;
        }


        this.resizer.addEventListener(
            'mousedown',
            () => this.startResize()
        );


        document.addEventListener(
            'mousemove',
            (event) => this.resize(event)
        );


        document.addEventListener(
            'mouseup',
            () => this.stopResize()
        );
    }


    /**
     * Starts the resize operation.
     */
    startResize() {

        this.isResizing = true;

        this.resizer.classList.add(
            'is-dragging'
        );

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }


    /**
     * Updates sidebar width while dragging.
     *
     * Applies min/max width limits to prevent invalid layouts.
     */
    resize(event) {

        if (!this.isResizing) {
            return;
        }


        const newWidth =
            window.innerWidth - event.clientX;


        if (newWidth > 200 && newWidth < 800) {

            this.sidebarContent.style.width =
                `${newWidth}px`;

            document.documentElement.style.setProperty(
                '--sidebar-width',
                `${newWidth}px`
            );
        }
    }


    /**
     * Ends the resize operation and restores default UI state.
     */
    stopResize() {

        this.isResizing = false;

        this.resizer.classList.remove(
            'is-dragging'
        );

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
}
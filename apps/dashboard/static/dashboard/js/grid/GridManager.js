// grid/GridManager.js


/**
 * Grid layout controller.
 *
 * Wraps GridStack functionality used by the dashboard.
 *
 * Responsibilities:
 * - Initialize the GridStack instance
 * - Control widget movement state
 * - Track layout changes
 * - Provide current widget positions
 */


export class GridManager {

    constructor({
        element,
        columns = 32,
        cellHeight = 50
    }) {

        this.element = element;
        this.columns = columns;
        this.cellHeight = cellHeight;

        this.grid = null;
    }


    /**
     * Creates and configures the GridStack instance.
     */
    init() {

        this.grid = GridStack.init({
            float: true,
            column: this.columns,
            cellHeight: this.cellHeight,
            staticGrid: true
        });


        this.element.style.visibility = 'visible';


        this.bindEvents();
    }


    /**
     * Registers GridStack interaction events.
     */
    bindEvents() {

        this.grid.on(
            'dragstart',
            () => {

                document.body.style.cursor = 'grabbing';

                document.body.classList.add(
                    'is-dragging'
                );

            }
        );


        this.grid.on(
            'dragstop',
            () => {

                document.body.style.cursor = '';

                document.body.classList.remove(
                    'is-dragging'
                );

            }
        );
    }


    /**
     * Enables or disables widget movement.
     *
     * @param {boolean} enabled
     */
    setEditMode(enabled) {

        this.grid.setStatic(!enabled);

    }


    /**
     * Returns the current widget layout.
     */
    getLayout() {

        return this.grid
            .getGridItems()
            .map(el => {

                const node = el.gridstackNode;

                return {
                    id: el.getAttribute('gs-id'),
                    x: node.x,
                    y: node.y,
                    w: node.w,
                    h: node.h
                };

            });

    }


    /**
     * Registers a callback for layout changes.
     *
     * @param {Function} callback
     */
    onChange(callback) {

        this.grid.on(
            'change',
            callback
        );

    }

}
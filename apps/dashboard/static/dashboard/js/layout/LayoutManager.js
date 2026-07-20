// layout/LayoutManager.js

import { LayoutPersistence } from "../persistence/LayoutPersistence.js";


/**
 * Dashboard layout manager.
 *
 * Coordinates retrieving the current grid layout and
 * sending layout changes to the backend.
 *
 * Uses:
 * - GridManager for current widget positions
 * - LayoutPersistence for API communication
 */


export class LayoutManager {

    constructor({
        gridManager,
        endpoint
    }) {

        this.gridManager = gridManager;

        this.persistence = new LayoutPersistence(
            endpoint
        );
    }


    /**
     * Retrieves the current dashboard layout from GridManager.
     */
    getLayout() {

        return this.gridManager.getLayout();

    }


    /**
     * Saves the current dashboard layout.
     */
    async save() {

        const payload = this.getLayout();

        await this.persistence.save(
            payload
        );

    }

}
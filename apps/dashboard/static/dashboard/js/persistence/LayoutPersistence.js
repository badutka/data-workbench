// persistence/LayoutPersistence.js

import { getCSRFToken } from "../utils/csrf.js";


/**
 * Dashboard layout persistence layer.
 *
 * Handles communication between the frontend layout system
 * and the backend layout update endpoint.
 *
 * Responsibilities:
 * - Send widget layout data to the backend
 * - Attach CSRF token to requests
 * - Handle failed persistence requests
 *
 * Used by:
 * - LayoutManager
 */


export class LayoutPersistence {

    constructor(url) {

        this.url = url;
    }


    /**
     * Persists the current dashboard layout.
     *
     * @param {Array} layout
     * Current widget positions and dimensions.
     *
     * Sends:
     * {
     *     widgets: layout
     * }
     */
    async save(layout) {

        const response = await fetch(this.url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCSRFToken()
            },

            body: JSON.stringify({
                widgets: layout
            })
        });


        if (!response.ok) {

            console.error(
                "Dashboard save failed",
                response.status
            );

            throw new Error(
                "Failed to save dashboard layout"
            );
        }


        return response.json();
    }
}
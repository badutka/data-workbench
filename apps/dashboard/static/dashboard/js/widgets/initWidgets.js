// widgets/initWidgets.js

/**
 * Widget initialization entry point.
 *
 * Finds dashboard widgets and connects them with registered renderers.
 *
 * Flow:
 * initWidgets() -> WidgetRegistry -> Widget renderer
 */

import { widgetRenderers } from "./WidgetRegistry.js";


export function initWidgets(container = document) {

    const widgets = container.querySelectorAll(".chart-widget");

    widgets.forEach(el => {

        if (el.dataset.initialized === "true") {
            return;
        }

        const type = el.dataset.widgetType;
        const subtype = el.dataset.widgetSubtype || "default";
        const widgetId = el.dataset.widgetId;
        const scriptEl = document.getElementById(`widget-data-${widgetId}`);

        if (!type || !widgetId || !scriptEl) {
            console.warn("Skipping invalid widget:", el);
            return;
        }

        const data = JSON.parse(scriptEl.textContent);
        const renderer = widgetRenderers?.[type]?.[subtype];

        if (typeof renderer !== "function") {
            console.warn(`No renderer found for ${type}:${subtype}`);
            return;
        }

        const chartContainer = el.querySelector(".chart-container");

        renderer(chartContainer, data);

        el.dataset.initialized = "true";
    });
}
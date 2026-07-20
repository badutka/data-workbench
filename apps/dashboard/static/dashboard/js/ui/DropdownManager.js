// ui/DropdownManager.js

/**
 * Dropdown UI manager.
 *
 * Handles frontend behaviour for generic single-value dropdown components.
 *
 * Responsibilities:
 * - Update displayed dropdown label after selection
 * - Update button icon
 * - Manage active option styling
 *
 * Persistence is handled separately through HTMX endpoints.
 */


/**
 * Initializes generic dropdown interactions.
 *
 * Uses event delegation so dynamically loaded HTMX content
 * can use the same dropdown behaviour without reinitialization.
 */
export function initDropdowns() {

    document.addEventListener('click', function(e) {

        const item = e.target.closest(
            '.dropdown-single-value-generic .dropdown-item'
        );

        if (!item) {
            return;
        }

        const dropdown = item.closest(
            '.dropdown-single-value-generic'
        );

        if (!dropdown) {
            return;
        }

        const label = dropdown.querySelector('.label');
        const btnIcon = dropdown.querySelector('.btn-icon');
        const itemLabel = item.textContent.trim();
        const itemIcon = item.querySelector('i');

        if (label) {
            label.textContent = itemLabel;
        }

        if (itemIcon && btnIcon) {

            const iconClass = [...itemIcon.classList]
                .find(cls => cls.startsWith('fa-') && cls !== 'fas');

            btnIcon.className = `fas ${iconClass} btn-icon`;
        }

        dropdown
            .querySelectorAll('.dropdown-item')
            .forEach(i => i.classList.remove('active'));

        item.classList.add('active');
    });
}
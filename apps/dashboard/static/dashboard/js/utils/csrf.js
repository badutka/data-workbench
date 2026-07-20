// utils/csrf.js

/**
 * CSRF utility module.
 *
 * Provides a shared way to retrieve the Django CSRF token and automatically
 * attach it to HTMX requests.
 *
 * Responsibilities:
 * - Find CSRF token from form input or cookie
 * - Add CSRF headers to HTMX requests
 *
 * Used by:
 * - HTMX requests
 * - JavaScript persistence classes that need CSRF tokens
 */


export function getCSRFToken() {

    return document.querySelector(
        '[name=csrfmiddlewaretoken]'
    )?.value ||
    document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken'))
        ?.split('=')[1];
}


/**
 * Initializes global HTMX CSRF handling.
 *
 * Attaches the current CSRF token to every HTMX request before it is sent.
 */
export function initCSRF() {

    document.body.addEventListener(
        'htmx:configRequest',
        function(event) {

            const token = getCSRFToken();

            if (token) {
                event.detail.headers['X-CSRFToken'] = token;
            }
        }
    );
}
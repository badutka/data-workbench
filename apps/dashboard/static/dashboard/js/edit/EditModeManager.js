// edit/EditModeManager.js


/**
 * Dashboard edit mode controller.
 *
 * Manages switching between view mode and edit mode.
 *
 * Responsibilities:
 * - Track current edit mode state
 * - Toggle dashboard UI classes
 * - Show or hide edit controls
 * - Enable or disable grid editing
 */


export class EditModeManager {

    constructor({
        shell,
        gridElement,
        editBtn,
        editActions,
        gridManager
    }) {

        this.shell = shell;
        this.gridElement = gridElement;
        this.editBtn = editBtn;
        this.editActions = editActions;
        this.gridManager = gridManager;

        this.isEditing = false;
    }


    /**
     * Initializes edit mode controls.
     */
    init() {

        if (this.editBtn) {

            this.editBtn.addEventListener(
                "click",
                () => this.toggle()
            );

        }

        this.setEditMode(false);
    }


    /**
     * Switches between view mode and edit mode.
     */
    toggle() {

        this.setEditMode(
            !this.isEditing
        );

    }


    /**
     * Applies the selected edit mode state.
     *
     * @param {boolean} enabled
     */
    setEditMode(enabled) {

        this.isEditing = enabled;


        if (this.shell) {

            this.shell.classList.toggle(
                "is-editing",
                enabled
            );

        }


        if (this.gridElement) {

            this.gridElement.classList.toggle(
                "edit-mode",
                enabled
            );

        }


        if (this.gridManager) {

            this.gridManager.setEditMode(
                enabled
            );

        }


        if (this.editBtn) {

            this.editBtn.classList.toggle(
                "hidden",
                enabled
            );

        }


        if (this.editActions) {

            this.editActions.classList.toggle(
                "hidden",
                !enabled
            );

        }
    }

}
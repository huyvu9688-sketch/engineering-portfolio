// Right-click context menu for a part (isolate / hide / focus / show-all).

const ICONS = {
    focus: '<circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle>',
    eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line>',
    maximize: '<polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" x2="14" y1="3" y2="10"></line><line x1="3" x2="10" y1="21" y2="14"></line>',
};

function iconSvg(inner) {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="shrink-0">${inner}</svg>`;
}

const MENU_CLASS =
    "viewer-context-menu fixed z-[60] min-w-[190px] overflow-hidden rounded-lg border border-hairline-dark bg-surface-dark/95 py-1 font-mono text-[11px] uppercase tracking-widest text-on-dark shadow-xl backdrop-blur";
const ITEM_CLASS =
    "viewer-context-menu-item flex cursor-pointer items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/10 hover:text-accent";
const SEP_CLASS = "my-1 border-t border-hairline-dark";

export class ContextMenu {
    constructor(controls, componentList, historyManager) {
        this.controls = controls;
        this.componentList = componentList;
        this.historyManager = historyManager;
        this.menuElement = null;
        this.targetObject = null;
        this.onDocClick = () => this.remove();
    }

    show(x, y, targetObject) {
        this.remove();

        this.targetObject = targetObject;
        this.menuElement = document.createElement("div");
        this.menuElement.className = MENU_CLASS;
        this.menuElement.style.left = `${x}px`;
        this.menuElement.style.top = `${y}px`;

        const isHidden = this.componentList.hiddenParts.has(targetObject.uuid);

        this.menuElement.innerHTML = `
            <div class="${ITEM_CLASS}" data-action="isolate">${iconSvg(ICONS.focus)}<span>Isolate</span></div>
            <div class="${ITEM_CLASS}" data-action="toggle-visibility">${iconSvg(isHidden ? ICONS.eye : ICONS.eyeOff)}<span>${isHidden ? "Show" : "Hide"}</span></div>
            <div class="${SEP_CLASS}"></div>
            <div class="${ITEM_CLASS}" data-action="focus">${iconSvg(ICONS.maximize)}<span>Focus</span></div>
            ${
                this.componentList.hiddenParts.size > 0
                    ? `<div class="${SEP_CLASS}"></div><div class="${ITEM_CLASS}" data-action="show-all">${iconSvg(ICONS.eye)}<span>Show All</span></div>`
                    : ""
            }
        `;

        document.body.appendChild(this.menuElement);
        this.keepInViewport(x, y);

        this.menuElement.querySelectorAll(".viewer-context-menu-item").forEach((item) => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                this.handleAction(item.dataset.action);
            });
        });

        setTimeout(() => document.addEventListener("click", this.onDocClick), 0);
    }

    keepInViewport(x, y) {
        if (!this.menuElement) return;
        const rect = this.menuElement.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) {
            this.menuElement.style.left = `${window.innerWidth - rect.width - 8}px`;
        }
        if (y + rect.height > window.innerHeight) {
            this.menuElement.style.top = `${window.innerHeight - rect.height - 8}px`;
        }
    }

    remove() {
        if (this.menuElement) {
            this.menuElement.remove();
            this.menuElement = null;
            this.targetObject = null;
        }
        document.removeEventListener("click", this.onDocClick);
    }

    handleAction(action) {
        if (!this.targetObject) return;
        switch (action) {
            case "isolate":
                this.controls.isolatePart(this.targetObject);
                break;
            case "toggle-visibility":
                this.togglePartVisibility(this.targetObject);
                break;
            case "focus":
                this.controls.focusOnPart(this.targetObject);
                break;
            case "show-all":
                this.showAllHiddenParts();
                break;
        }
        this.remove();
    }

    togglePartVisibility(part) {
        const isHidden = this.componentList.hiddenParts.has(part.uuid);
        if (isHidden) {
            this.componentList.hiddenParts.delete(part.uuid);
            this.setMeshVisibility(part, true);
            this.historyManager?.recordAction({ type: "show", partUuid: part.uuid, partName: part.name });
        } else {
            this.componentList.hiddenParts.add(part.uuid);
            this.setMeshVisibility(part, false);
            this.historyManager?.recordAction({ type: "hide", partUuid: part.uuid, partName: part.name });
        }
        this.componentList.updateVisibility();
    }

    setMeshVisibility(part, visible) {
        part.traverse((child) => {
            if (child.isMesh && !child.userData.isEdgeHelper) child.visible = visible;
        });
    }

    showAllHiddenParts() {
        const previousHiddenParts = Array.from(this.componentList.hiddenParts);
        const allParts = this.controls.modelLoader.allParts;
        this.componentList.hiddenParts.forEach((uuid) => {
            const part =
                allParts.find((p) => p.uuid === uuid) ||
                this.controls.modelLoader.model.getObjectByProperty("uuid", uuid);
            if (part) this.setMeshVisibility(part, true);
        });
        this.componentList.hiddenParts.clear();
        this.componentList.updateVisibility();
        if (previousHiddenParts.length > 0) {
            this.historyManager?.recordAction({ type: "showAll", previousHiddenParts });
        }
    }
}

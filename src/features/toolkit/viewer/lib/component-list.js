// Builds and manages the collapsible component-hierarchy panel.
//
// Pure DOM (no three import). The engine hands it the loaded model's root; it
// renders a searchable, collapsible tree and reports clicks back via callback.

// Inline SVG inner-markup per component type. Shape encodes the type; colour
// comes from the design tokens at the call site (single-accent system).
function getComponentIcon(type) {
    switch (type) {
        case "Assembly":
            return '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>';
        case "Sub-Assembly":
            return '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="8" x2="12" y2="16"></line>';
        case "Part":
            return '<rect x="3" y="3" width="18" height="18" rx="2"></rect>';
        case "Body":
            return '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>';
        default:
            return '<circle cx="12" cy="12" r="10"></circle>';
    }
}

const SEARCH_ICON =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-dark-muted"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';

export class ComponentList {
    constructor() {
        this.hierarchy = [];
    }

    extractHierarchy(rootObject) {
        this.hierarchy = [];

        const traverse = (object, level = 0, parentIndex = null) => {
            const validChildren = object.children.filter((c) => !c.userData.isEdgeHelper);
            const componentType = this.determineComponentType(object, validChildren, rootObject);

            let meshCount = 0;
            object.traverse((child) => {
                if (child.isMesh && !child.userData.isEdgeHelper) meshCount++;
            });

            const currentIndex = this.hierarchy.length;
            this.hierarchy.push({
                name: object.name || object.type || "Unnamed",
                type: componentType,
                level,
                uuid: object.uuid,
                meshCount,
                hasChildren: validChildren.length > 0,
                object,
                index: currentIndex,
                parentIndex,
                collapsed: false,
            });

            validChildren.forEach((child) => traverse(child, level + 1, currentIndex));
        };

        traverse(rootObject);
        return this.hierarchy;
    }

    determineComponentType(object, validChildren, rootObject) {
        const hasMeshChildren = validChildren.some((c) => c.isMesh);
        const hasGroupChildren = validChildren.some((c) => c.isGroup || c.type === "Group");

        if (object === rootObject) return "Assembly";
        if (object.isMesh) return "Body";
        if (hasMeshChildren && hasGroupChildren) return "Sub-Assembly";
        if (hasMeshChildren) return "Part";
        if (hasGroupChildren) return "Sub-Assembly";
        return "Unknown";
    }

    display(onComponentClick) {
        const listContainer = document.getElementById("component-list");
        const headerElement = document.getElementById("component-list-header");
        if (!listContainer) return;

        if (this.hierarchy.length === 0) {
            listContainer.innerHTML =
                '<div class="py-8 text-center font-mono text-[10px] uppercase tracking-widest text-on-dark-muted">No components found</div>';
            return;
        }

        if (headerElement) headerElement.textContent = `Components (${this.hierarchy.length})`;

        listContainer.innerHTML =
            this.buildSearchBar() + '<div class="space-y-0.5 p-1">' + this.buildItems() + "</div>";

        this.attachEventListeners(listContainer, onComponentClick);
    }

    buildSearchBar() {
        return `
            <div class="sticky top-0 z-10 border-b border-hairline-dark bg-surface-dark/95 p-2 backdrop-blur">
                <div class="relative">
                    <input type="text" id="component-search" placeholder="Search"
                        class="w-full rounded-full border border-hairline-dark bg-black/40 px-3 py-1.5 pl-8 font-mono text-[10px] uppercase tracking-widest text-on-dark placeholder:text-on-dark-muted focus:border-accent focus:outline-none" />
                    ${SEARCH_ICON}
                </div>
            </div>
        `;
    }

    buildItems() {
        return this.hierarchy
            .map((comp, idx) => {
                const isHidden = this.isHiddenByParent(comp);
                const indent = comp.level * 14;
                const icon = getComponentIcon(comp.type);
                const showArrow = comp.hasChildren;

                return `
                <div class="component-item-wrapper ${isHidden ? "hidden" : ""}" data-index="${idx}">
                    <div class="component-item flex items-center rounded px-2 py-1.5 transition-colors hover:bg-white/5" data-uuid="${comp.uuid}">
                        <div class="flex w-full items-center" style="padding-left: ${indent}px;">
                            ${
                                showArrow
                                    ? `<button class="collapse-arrow mr-1 shrink-0 rounded p-0.5 text-on-dark-muted transition-colors hover:bg-white/10" data-index="${idx}" onclick="event.stopPropagation();" aria-label="Toggle children">
                                            <svg class="arrow-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="transition: transform 0.2s; transform: rotate(90deg);">
                                                <polyline points="9 18 15 12 9 6"></polyline>
                                            </svg>
                                        </button>`
                                    : '<span class="mr-1 inline-block" style="width: 18px;"></span>'
                            }
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mr-2 shrink-0 text-on-dark-muted">${icon}</svg>
                            <span class="component-name flex-1 cursor-pointer truncate font-mono text-[10px] text-on-dark" title="${comp.name}" data-uuid="${comp.uuid}">${comp.name}</span>
                            <span class="ml-2 shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-on-dark-muted">${comp.type}</span>
                            ${
                                comp.meshCount > 0
                                    ? `<span class="ml-2 shrink-0 font-mono text-[8px] tabular-nums text-on-dark-muted/70">${comp.meshCount}</span>`
                                    : ""
                            }
                        </div>
                    </div>
                </div>`;
            })
            .join("");
    }

    isHiddenByParent(comp) {
        if (comp.parentIndex === null) return false;
        let parent = this.hierarchy[comp.parentIndex];
        while (parent) {
            if (parent.collapsed) return true;
            parent = parent.parentIndex !== null ? this.hierarchy[parent.parentIndex] : null;
        }
        return false;
    }

    attachEventListeners(listContainer, onComponentClick) {
        const searchInput = document.getElementById("component-search");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => this.filterList(e.target.value));
        }

        listContainer.querySelectorAll(".component-name").forEach((item) => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                const component = this.hierarchy.find((c) => c.uuid === item.dataset.uuid);
                if (component && onComponentClick) {
                    onComponentClick(component, item.closest(".component-item"));
                }
            });
        });

        listContainer.querySelectorAll(".collapse-arrow").forEach((arrow) => {
            arrow.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleCollapse(parseInt(arrow.dataset.index, 10));
            });
        });
    }

    filterList(searchTerm) {
        const normalized = searchTerm.toLowerCase().trim();
        this.hierarchy.forEach((comp, idx) => {
            const wrapper = document.querySelector(`.component-item-wrapper[data-index="${idx}"]`);
            if (!wrapper) return;
            const matches =
                comp.name.toLowerCase().includes(normalized) ||
                comp.type.toLowerCase().includes(normalized);
            if (searchTerm === "" || matches) {
                wrapper.classList.toggle("hidden", this.isHiddenByParent(comp));
            } else {
                wrapper.classList.add("hidden");
            }
        });
    }

    toggleCollapse(index) {
        const component = this.hierarchy[index];
        if (!component) return;
        component.collapsed = !component.collapsed;

        const arrow = document.querySelector(`.collapse-arrow[data-index="${index}"] .arrow-icon`);
        if (arrow) arrow.style.transform = component.collapsed ? "rotate(0deg)" : "rotate(90deg)";

        this.hierarchy.forEach((comp, idx) => {
            if (comp.parentIndex === index) {
                const wrapper = document.querySelector(
                    `.component-item-wrapper[data-index="${idx}"]`,
                );
                if (wrapper) {
                    wrapper.classList.toggle(
                        "hidden",
                        component.collapsed || this.isHiddenByParent(comp),
                    );
                }
            }
        });
    }
}

// Builds and manages the collapsible component-hierarchy panel.

import { getComponentIcon } from "./utils.js";

const SEARCH_ICON =
    '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-on-dark-muted"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';

export class ComponentList {
    constructor() {
        this.hierarchy = [];
        this.hiddenParts = new Set();
        this.listVisible = true;
    }

    extractHierarchy(rootObject) {
        this.hierarchy = [];

        const traverse = (object, level = 0, parentPath = "", parentIndex = null) => {
            if (object.userData.isEdgeHelper) return;

            const currentPath = parentPath
                ? `${parentPath}/${object.name || object.type}`
                : object.name || object.type;

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
                path: currentPath,
                uuid: object.uuid,
                meshCount,
                hasChildren: validChildren.length > 0,
                childCount: validChildren.length,
                object,
                index: currentIndex,
                parentIndex,
                collapsed: false,
            });

            validChildren.forEach((child) => traverse(child, level + 1, currentPath, currentIndex));
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

    display(onComponentClick, onComponentContextMenu, onCollapseToggle) {
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
            this.buildSearchBar() +
            '<div class="space-y-0.5 p-1">' +
            this.buildComponentItems() +
            "</div>";

        this.attachEventListeners(
            listContainer,
            onComponentClick,
            onComponentContextMenu,
            onCollapseToggle,
        );
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

    buildComponentItems() {
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
                                            <svg class="arrow-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="transition: transform 0.2s;">
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

    attachEventListeners(listContainer, onComponentClick, onComponentContextMenu, onCollapseToggle) {
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

        listContainer.querySelectorAll(".component-item").forEach((item) => {
            item.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                e.stopPropagation();
                const component = this.hierarchy.find((c) => c.uuid === item.dataset.uuid);
                if (component && onComponentContextMenu) {
                    onComponentContextMenu(e, component.object);
                }
            });
        });

        listContainer.querySelectorAll(".collapse-arrow").forEach((arrow) => {
            arrow.addEventListener("click", (e) => {
                e.stopPropagation();
                const index = parseInt(arrow.dataset.index, 10);
                this.toggleCollapse(index);
                if (onCollapseToggle) onCollapseToggle(index);
            });
        });
    }

    filterList(searchTerm) {
        const normalized = searchTerm.toLowerCase().trim();
        this.hierarchy.forEach((comp, idx) => {
            const wrapper = document.querySelector(`.component-item-wrapper[data-index="${idx}"]`);
            if (!wrapper) return;
            const matchesSearch =
                comp.name.toLowerCase().includes(normalized) ||
                comp.type.toLowerCase().includes(normalized);
            const isHiddenByParent = this.isHiddenByParent(comp);
            if (searchTerm === "" || matchesSearch) {
                wrapper.classList.toggle("hidden", isHiddenByParent);
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
        if (arrow) {
            arrow.style.transform = component.collapsed ? "rotate(0deg)" : "rotate(90deg)";
        }

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

    updateVisibility() {
        this.hierarchy.forEach((comp, idx) => {
            const wrapper = document.querySelector(`.component-item-wrapper[data-index="${idx}"]`);
            if (!wrapper) return;
            const item = wrapper.querySelector(".component-item");
            if (this.hiddenParts.has(comp.uuid)) {
                item.style.opacity = "0.4";
                item.style.textDecoration = "line-through";
            } else {
                item.style.opacity = "1";
                item.style.textDecoration = "none";
            }
        });
    }

    expandAllArrows() {
        document.querySelectorAll(".arrow-icon").forEach((arrow) => {
            arrow.style.transform = "rotate(90deg)";
        });
    }
}

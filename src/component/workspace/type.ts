import React, { ReactElement } from "react";
import { checkPointInArea } from "./util";

class LayoutConfig {
    isLocked: boolean;
    layout: Array<TreeConfig>;

    constructor(isLocked: boolean, layout: Array<TreeConfig>) {
        this.layout = layout;
        this.isLocked = isLocked;
    }
}

export type ParentPosition = { left: number, top: number, width: number, height: number }
export type TreeChild = {
    name: string;
    component: React.ReactElement;
}

export class TreeConfig {
    parent: TreeConfig | undefined;
    key: string; // root element key is root;
    left: number;
    right: number;
    top: number;
    bottom: number;
    minWidth: number;
    maxWidth: number;
    maxHeight: number;
    minHeight: number;
    layout: "row" | "column" | "block";
    children?: Array<TreeConfig>;
    child?: TreeChild;

    constructor({ parent, key, left, right, top, bottom, minWidth, maxWidth, minHeight, maxHeight, layout, option }: {
        parent?: TreeConfig, key: string, left: number, right: number, top: number, bottom: number, minWidth: number, maxWidth: number, maxHeight: number, minHeight: number, layout: "row" | "column" | "block", option?: {
            children?: Array<TreeConfig>, child?: {
                name: string, component: ReactElement
            }
        }
    }) {
        this.key = key;
        this.parent = parent;
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.minWidth = minWidth;
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.minHeight = minHeight;
        this.layout = layout;
        this.child = option?.child;
        this.children = option?.children;
    }

    getLeft = (viewWidth: number): number => {
        return this.left * viewWidth;
    }

    getRight = (viewWidth: number): number => {
        return this.right * viewWidth;
    }

    getTop = (viewHeight: number): number => {
        return this.top * viewHeight;
    }

    getBottom = (viewHeight: number): number => {
        return this.bottom * viewHeight
    }

    getWidth = (viewWidth: number): number => {
        return (this.right - this.left) * viewWidth
    }

    getMinWidth = (viewWidth: number): number => {
        return this.minWidth * viewWidth
    }

    getMaxWidth = (viewWidth: number): number => {
        return this.maxWidth * viewWidth
    }

    getHeight = (viewHeight: number): number => {
        return (this.bottom - this.top) * viewHeight
    }

    getMinHeight = (viewHeight: number): number => {
        return this.minHeight * viewHeight
    }

    getMaxHeight = (viewHeight: number): number => {
        return this.maxHeight * viewHeight
    }


    getCurrentPosition = (view: ParentPosition): ParentPosition => {
        const realLeft = this.getLeft(view.width) + view.left;
        const realTop = this.getTop(view.height) + view.top;
        return { left: realLeft, top: realTop, width: this.getWidth(view.width), height: this.getHeight(view.height) }
    }

    checkedMoveIn = (view: ParentPosition, position: { x: number, y: number }): boolean => {
        const realLeft = this.getLeft(view.width) + view.left;
        const realRight = this.getRight(view.width) + view.left;
        const realTop = this.getTop(view.height) + view.top;
        const realBottom = this.getBottom(view.height) + view.top;
        const area = [{ x: realLeft, y: realTop }, { x: realRight, y: realTop }, { x: realRight, y: realBottom }, { x: realLeft, y: realBottom }];
        if (checkPointInArea(position, area)) {
            return true;
        }
        return false;
    }
}

export type ComponentConfig = {
    target: string,
    layout: "row" | "column" | "block",
    top: number,
    left: number,
    right: number,
    bottom: number,
    position: number
};

function getRandom(): number {
    return Math.floor(Math.random() * 1000);
}

export function generateTreeConfig(parent: TreeConfig | null, view: ParentPosition, config: ComponentConfig, component: React.ReactElement, name: string): TreeConfig {
    const key = Date.now();
    if (parent === null) {
        return new TreeConfig({
            parent: parent ? parent : undefined,
            key: `key-${key}-${getRandom()}`,
            top: config.top / view.height,
            bottom: config.bottom / view.height,
            left: config.left / view.width,
            right: config.right / view.width,
            minHeight: 100 / view.height,
            maxHeight: 1,
            minWidth: 100 / view.width,
            maxWidth: 1,
            layout: config.layout,
            option: {
                child: {
                    name: name,
                    component: component
                }
            }
        })
    } else {
        if (config.layout === "row") {
            const child = parent.child!;
            parent.child = undefined;
            parent.layout = config.layout;
            parent.children = [];
            let newComponent: TreeConfig | null;
            if (config.position === 0) {
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.left / view.width,
                    right: config.right / view.width,
                    minHeight: 100 / view.height,
                    maxHeight: 1,
                    minWidth: 100 / view.width,
                    maxWidth: 1 - (100 / view.width),
                    layout: "block",
                    option: {
                        child: {
                            name: name,
                            component: component
                        }
                    }
                });
                parent.children.push(newComponent)
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: 0.5,
                    right: 1,
                    minHeight: 100 / view.height,
                    maxHeight: 1,
                    minWidth: 100 / view.width,
                    maxWidth: 1 - (100 / view.width),
                    layout: 'block',
                    option: {
                        child
                    }
                }))
            } else {
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: 0,
                    right: config.left / view.width,
                    minHeight: 100 / view.height,
                    maxHeight: 1,
                    minWidth: 100 / view.width,
                    maxWidth: 1 - (100 / view.width),
                    layout: 'block',
                    option: {
                        child
                    }
                }))
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.left / view.width,
                    right: config.right / view.width,
                    minHeight: 100 / view.height,
                    maxHeight: 1,
                    minWidth: 100 / view.width,
                    maxWidth: 1 - (100 / view.width),
                    layout: "block",
                    option: {
                        child: {
                            name: name,
                            component: component
                        }
                    }
                })
                parent.children.push(newComponent)
            }
            return newComponent
        } else {
            const child = parent.child!;
            parent.child = undefined;
            parent.layout = config.layout;
            parent.children = [];
            let newComponent: TreeConfig | null;
            if (config.position === 0) {
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.left / view.width,
                    right: config.right / view.width,
                    minHeight: 100 / view.height,
                    maxHeight: 1 - 100 / view.height,
                    minWidth: 100 / view.width,
                    maxWidth: 1,
                    layout: "block",
                    option: {
                        child: {
                            name: name,
                            component: component
                        }
                    }
                });
                parent.children.push(newComponent)
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.bottom / view.height,
                    bottom: 1,
                    left: 0,
                    right: 1,
                    minHeight: 100 / view.height,
                    maxHeight: 1 - 100 / view.height,
                    minWidth: 100 / view.width,
                    maxWidth: 1,
                    layout: 'block',
                    option: {
                        child
                    }
                }))
            } else {
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: 0,
                    bottom: config.top / view.height,
                    left: 0,
                    right: 1,
                    minHeight: 100 / view.height,
                    maxHeight: 1 - 100 / view.height,
                    minWidth: 100 / view.width,
                    maxWidth: 1,
                    layout: 'block',
                    option: {
                        child
                    }
                }))
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.left / view.width,
                    right: config.right / view.width,
                    minHeight: 100 / view.height,
                    maxHeight: 1 - 100 / view.height,
                    minWidth: 100 / view.width,
                    maxWidth: 1,
                    layout: "block",
                    option: {
                        child: {
                            name: name,
                            component: component
                        }
                    }
                })
                parent.children.push(newComponent)
            }
            return newComponent;
        }
    }

}
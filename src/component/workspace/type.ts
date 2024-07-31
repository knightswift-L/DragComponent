import React, { ReactElement } from "react";
import { checkPointInArea } from "./util";

const Padding = 5;

class LayoutConfig {
    isLocked: boolean;
    layout: Array<TreeConfig>;

    constructor(isLocked: boolean, layout: Array<TreeConfig>) {
        this.layout = layout;
        this.isLocked = isLocked;
    }
}

export type ParentPosition = { left: number, top: number, width: number, height: number, paddingLeft: number, paddingRight: number, paddingTop: number, paddingBottom: number, innerHeight: number, innerWidth: number }
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
    paddingLeft: number = 0;
    paddingRight: number = 0;
    paddingTop: number = 0;
    paddingBottom: number = 0;
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
        const realLeft = this.getLeft(view.innerWidth) + view.left +view.paddingLeft;
        const realTop = this.getTop(view.innerHeight) + view.top + view.paddingTop;
        const innerWidth = this.getWidth(view.innerWidth) - this.paddingLeft - this.paddingRight;
        const innerHeight = this.getHeight(view.innerHeight) - this.paddingTop - this.paddingBottom;
        return {
            left: realLeft,
            top: realTop,
            width: this.getWidth(view.innerWidth),
            height: this.getHeight(view.innerHeight),
            paddingBottom: this.paddingBottom,
            paddingLeft: this.paddingLeft,
            paddingTop: this.paddingTop,
            paddingRight: this.paddingRight,
            innerHeight,
            innerWidth,
        }
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
            top: config.top / view.innerHeight,
            bottom: config.bottom / view.innerHeight,
            left: config.left / view.innerWidth,
            right: config.right / view.innerWidth,
            minHeight: 100 / view.innerHeight,
            maxHeight: 1,
            minWidth: 100 / view.innerWidth,
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
        let newComponent: TreeConfig | null;
        if (config.layout === "row") {
            const child = parent.child!;
            parent.child = undefined;
            parent.layout = config.layout;
            parent.children = [];

            if (config.position === 0) {
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1,
                    minWidth: 100 / view.innerWidth,
                    maxWidth: 1 - (100 / view.innerWidth),
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
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.right / view.innerWidth,
                    right: config.right / view.innerWidth + (config.right - config.left) / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1,
                    minWidth: 100 / view.innerWidth,
                    maxWidth: 1 - (100 / view.innerWidth),
                    layout: 'block',
                    option: {
                        child
                    }
                }))
            } else {
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.left / view.innerWidth - (config.right - config.left) / view.innerWidth,
                    right: config.left / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1,
                    minWidth: 100 / view.innerWidth,
                    maxWidth: 1 - (100 / view.innerWidth),
                    layout: 'block',
                    option: {
                        child
                    }
                }))
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1,
                    minWidth: 100 / view.innerWidth,
                    maxWidth: 1 - (100 / view.innerWidth),
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

        } else {
            const child = parent.child!;
            parent.child = undefined;
            parent.layout = config.layout;
            parent.children = [];
            if (config.position === 0) {
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1 - 100 / view.innerHeight,
                    minWidth: 100 / view.innerWidth,
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
                    top: config.bottom / view.innerHeight,
                    bottom: 1,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1 - 100 / view.innerHeight,
                    minWidth: 100 / view.innerWidth,
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
                    bottom: config.top / view.innerHeight,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1 - 100 / view.innerHeight,
                    minWidth: 100 / view.innerWidth,
                    maxWidth: 1,
                    layout: 'block',
                    option: {
                        child
                    }
                }))
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.left / view.innerWidth,
                    right: config.right / view.innerWidth,
                    minHeight: 100 / view.innerHeight,
                    maxHeight: 1 - 100 / view.innerHeight,
                    minWidth: 100 / view.innerWidth,
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
        }
        if (parent.children) {
            if (parent.layout === 'row') {
                parent.children[0].paddingRight = Padding;
                parent.children[1].paddingLeft = Padding;
            } else if (parent.layout === "column") {
                parent.children[0].paddingBottom = Padding;
                parent.children[1].paddingTop = Padding;
            }
        }
        return newComponent
    }

}
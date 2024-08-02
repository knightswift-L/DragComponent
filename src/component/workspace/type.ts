import React, { ReactElement } from "react";

export const Padding = 10;
export const MinWidth = 100;
export const MinHeight = 100;
// class LayoutConfig {
//     isLocked: boolean;
//     layout: Array<TreeConfig>;

//     constructor(isLocked: boolean, layout: Array<TreeConfig>) {
//         this.layout = layout;
//         this.isLocked = isLocked;
//     }
// }

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
    layout: "row" | "column" | "block";
    children?: Array<TreeConfig>;
    child?: TreeChild;

    constructor({ parent, key, left, right, top, bottom, layout, option }: {
        parent?: TreeConfig, key: string, left: number, right: number, top: number, bottom: number, layout: "row" | "column" | "block", option?: {
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
        this.layout = layout;
        this.child = option?.child;
        this.children = option?.children;
    }



    get isFirst(){
        if(!this.parent){
            return true;
        }
        return this.parent.children!.findIndex((item)=>item.key === this.key) === 0;
    }

    getLeft = (viewWidth: number): number => {
        if(!this.parent){
            return this.left * viewWidth;
        }

        if(this.parent.layout === "column"){
            return this.left * viewWidth;
        }

        return this.isFirst ? this.left * viewWidth : this.left * viewWidth + Padding/2;
    }

    getRight = (viewWidth: number): number => {
        if(!this.parent){
            return this.right * viewWidth;
        }

        if(this.parent.layout === "column"){
            return this.right * viewWidth;
        }

        return this.isFirst ? this.right * viewWidth - Padding/2 : this.right * viewWidth;
    }

    getTop = (viewHeight: number): number => {
        if(!this.parent){
            return this.top * viewHeight;
        }

        if(this.parent.layout === "row"){
            return this.top * viewHeight;
        }
        return this.isFirst ? this.top * viewHeight: this.top * viewHeight + Padding/2;
    }

    getBottom = (viewHeight: number): number => {
        if(!this.parent){
            return this.bottom * viewHeight;
        }

        if(this.parent.layout === "row"){
            return this.bottom * viewHeight;
        }
        return this.isFirst ? this.bottom * viewHeight - Padding/2 :this.bottom * viewHeight;
    }

    getWidth = (viewWidth: number): number => {
        return this.getRight(viewWidth) - this.getLeft(viewWidth);
    }

    getMinWidth = (): number => {
        if (this.layout === "block") {
            return 100;
        }

        if (this.layout === "column") {
            let max = 0;
            for (const item of this.children!) {
                const result = item.getMinWidth();
                max = result > max ? result : max;
            }
             return max;
        }

        let result = 0;
        for (const item of this.children!) {
            result += item.getMinWidth();
        } 
        result +=  Padding;

        return result;

    }



    getHeight = (viewHeight: number): number => {
        return this.getBottom(viewHeight) - this.getTop(viewHeight);
    }

    getMinHeight = (): number => {
        if (this.layout === "block") {
            return 100;
        }

        if (this.layout === "row") {
            let max = 0;
            for (const item of this.children!) {
                const result = item.getMinHeight();
                max = result > max ? result : max;
            }
            return max;
        }

        let result = 0;
        for (const item of this.children!) {
            result += item.getMinHeight();
            
        }
        result = result + Padding;
        return result;
    }


    getCurrentPosition = (view: ParentPosition): ParentPosition => {
        const realLeft = this.getLeft(view.width) + view.left;
        const realTop = this.getTop(view.height) + view.top;
        return {
            left: realLeft,
            top: realTop,
            width: this.getWidth(view.width),
            height: this.getHeight(view.height),
        }
    }

    delete = ()=>{
        if(!this.parent){
            return;
        }
        const anotherOne = this.parent.children!.filter((item)=>item.key !== this.key)[0];
        if(anotherOne.layout === "block"){
            this.parent.child = anotherOne.child;
            this.parent.children = undefined;
            this.parent.layout = anotherOne.layout;
        }else{
            this.parent.child = undefined;
            this.parent.children = anotherOne.children;
            anotherOne.children!.forEach((item)=>item.parent = this.parent);
            this.parent.layout = anotherOne.layout;
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
            top: config.top / view.height,
            bottom: config.bottom / view.height,
            left: config.left / view.width,
            right: config.right / view.width,
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
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.left / view.width,
                    right: config.right / view.width,
                    layout: "block",
                    option: {
                        child: {
                            name: name,
                            component: component
                        }
                    }
                });
                parent.children.push(newComponent);
                parent.children.push(new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: config.top / view.height,
                    bottom: config.bottom / view.height,
                    left: config.right / view.width,
                    right: 1,
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
                    bottom: 1,
                    left: 0,
                    right: config.left / view.width,
                    layout: 'block',
                    option: {
                        child
                    }
                }))
                newComponent = new TreeConfig({
                    parent: parent,
                    key: `key-${key}-${getRandom()}`,
                    top: 0,
                    bottom: 1,
                    left: config.left / view.width,
                    right: 1,
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
                    top: 0,
                    bottom: config.bottom / view.height,
                    left: 0,
                    right: 1,
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
                    left: 0,
                    right: 1,
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
        return newComponent
    }

}
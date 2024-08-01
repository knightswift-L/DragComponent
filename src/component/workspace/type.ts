import React, { ReactElement } from "react";

export const Padding = 10;

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
    paddingLeft: number = 0;
    paddingRight: number = 0;
    paddingTop: number = 0;
    paddingBottom: number = 0;
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

    getMinWidth = (): number => {
        if (this.layout === "block") {
            if(!this.parent){
                return 100;
            }
            
            if(this.parent.layout === 'row'){
                if(this.parent.children!.findIndex((item)=>item.key === this.key) === 0){
                    return 110;
                }else{
                    return 100;
                }
            }else{
                return 100;
            }
        }

        if (this.layout === "column") {
            let max = 0;
            for (const item of this.children!) {
                const result = item.getMinWidth();
                max = result > max ? result : max;
            }
            if(this.parent && this.parent.layout === "row" && this.parent!.children!.findIndex((item)=>item.key === this.key) === 0){
                return max + Padding;
             }
             return max;
        }

        let result = 0;
        for (const item of this.children!) {
            result += item.getMinWidth();
        } 
        if(this.parent && this.parent.layout === "row" && this.parent.children!.findIndex((item)=>item.key === this.key) === 0){
            result +=  Padding;
        }
        return result;

    }



    getHeight = (viewHeight: number): number => {
        return (this.bottom - this.top) * viewHeight
    }

    getMinHeight = (): number => {
        if (this.layout === "block") {
            if(!this.parent){
                return 100;
            }
            
            if(this.parent.layout === 'row'){
                return 100;
            }else{
                if(this.parent.children!.findIndex((item)=>item.key === this.key) === 0){
                    return 110;
                }else{
                    return 100;
                }
                
            }
        }

        if (this.layout === "row") {
            let max = 0;
            for (const item of this.children!) {
                const result = item.getMinHeight();
                max = result > max ? result : max;
            }
            if(this.parent && this.parent.layout === "column" && this.parent!.children!.findIndex((item)=>item.key === this.key) === 0){
               return max + Padding;
            }
            return max;
        }

        let result = 0;
        for (const item of this.children!) {
            result += item.getMinHeight();
            
        }
        if(this.parent && this.parent.layout === "column" && this.parent.children!.findIndex((item)=>item.key === this.key) === 0){
            result = result + Padding;
        }
        return result;
    }


    getCurrentPosition = (view: ParentPosition): ParentPosition => {
        const realLeft = this.getLeft(view.innerWidth) + view.left + view.paddingLeft;
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
            top: config.top / view.innerHeight,
            bottom: config.bottom / view.innerHeight,
            left: config.left / view.innerWidth,
            right: config.right / view.innerWidth,
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
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
                    left: config.right / view.innerWidth,
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
                    right: config.left / view.innerWidth,
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
                    left: config.left / view.innerWidth,
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
                    bottom: config.bottom / view.innerHeight,
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
                    top: config.bottom / view.innerHeight,
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
                    bottom: config.top / view.innerHeight,
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
                    top: config.top / view.innerHeight,
                    bottom: config.bottom / view.innerHeight,
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
        if (parent.children) {
            if (parent.layout === 'row') {
                parent.children[0].paddingRight = Padding;
            } else if (parent.layout === "column") {
                parent.children[0].paddingBottom = Padding;
            }
        }
        return newComponent
    }

}
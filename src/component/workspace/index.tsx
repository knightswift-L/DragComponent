import React, { useCallback, useState, useRef, useEffect } from "react";
import "./index.css";
import ResizeBox from "../resize-box";
import { useResize } from "../../hooks";
import {TreeConfig,ComponentConfig, generateTreeConfig, ParentPosition} from "./type";
import { checkPointInArea } from "./util";

type GenerateComponent = () => React.ReactElement;

export default function Workspace({
  panels,
}: {
  name: string;
  panels: { [key: string]: GenerateComponent };
}) {
  const [anchorVisible, setAnchorVisible] = useState<boolean>(false);
  const [items, setItems] = useState<Array<TreeConfig>>([]);
  const container = useRef<HTMLDivElement | null>(null);
  const [rectStyle, setRectStyle] = useState<{[key:string]:string}>({position: "absolute",});
  const [config, setConfig] = useState<ComponentConfig | null>(null);
  const { width, height } = useResize(container);

  useEffect(()=>{
    window.ondrop = (e)=>{
      e.preventDefault();
      return false;
    }

    window.ondragover = (e)=>{
      e.preventDefault();
      return false;
    }
    return ()=>{
      window.ondrop = null;
      window.ondragover = null;
    }
  },[])


  const handleOnDrap = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      setAnchorVisible(false);
      const targetPanel = ev.dataTransfer.getData("text");
      if(targetPanel === ""){
        return;
      }
      const findTarget = (tree:TreeConfig,view:ParentPosition,target:string):{target:TreeConfig,view:ParentPosition} | null=>{
          if(tree.key === target){
            return {target:tree,view:tree.getCurrentPosition(view)}
          }else if(tree.child){
            return null;
          }
           const realPosition = tree.getCurrentPosition(view);
          for(const item of tree.children!){
            let result = findTarget(item,realPosition,target);
            if(result){
              return result;
            }
          }

          return null;
      }
      
      if(config && config.target === "root"){
        let tree =  generateTreeConfig(null,{width:width,height:height,left:0,top:0},config,panels[targetPanel](),targetPanel);
        setItems([tree]);
      }else if(config){
        const result = findTarget(items[0],{width:width,height:height,left:0,top:0},config.target)
        if(result){
          generateTreeConfig(result.target,result.view,config,panels[targetPanel](),targetPanel);
          setItems([...items])
        }
        console.log(items[0])
      }
      ev.dataTransfer.clearData();
    },
    [items, panels, config, width, height]
  );

  const handleDragOver = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      let tempStyle = {...rectStyle};
      let tempItems = [...items];
      if (container.current && ev.dataTransfer.effectAllowed === "copy") {
        const rect = container.current.getBoundingClientRect();
        const { left, top} = rect;
        const x = ev.clientX -left;
        const y = ev.clientY - top;
        if(tempItems.length === 0){
           setConfig({target:"root",layout:"block",left:0,right:width,top:0,bottom:height,position:0})
           tempStyle = {
            ...tempStyle,
            top:"0px",
            left:"0px",
            width:width + "px",
            height:height + "px",
           }
           setRectStyle(tempStyle);
        }else{
          const findTarget = (view:ParentPosition,point:{x:number,y:number}, config:TreeConfig)=>{
            if(config.checkedMoveIn(view,point)){
              const realPosition = config.getCurrentPosition(view);
              if(config.child){
                const leftTop = {x:realPosition.left,y:realPosition.top};
                const rightTop = {x:realPosition.left + realPosition.width,y:realPosition.top};
                const rightBottom = {x:realPosition.left + realPosition.width,y:realPosition.top + realPosition.height};
                const leftBottom = {x:realPosition.left,y:realPosition.top + realPosition.height};
                const middle = {x:realPosition.left + realPosition.width/2,y:realPosition.top + realPosition.height/2};

                if(checkPointInArea(point,[leftTop,middle,leftBottom])){
                  setRectStyle({
                    ...rectStyle,
                    top:realPosition.top + "px",
                    left:realPosition.left + "px",
                    width:realPosition.width/2 + "px",
                    height:realPosition.height + "px",
                   })
                   setConfig({target:config.key,left:0,top:0,right:realPosition.width/2,bottom:realPosition.height,layout:"row",position:0})
                }else if(checkPointInArea(point,[leftTop,rightTop,middle])){
                  setRectStyle({
                    ...rectStyle,
                    top:realPosition.top + "px",
                    left:realPosition.left + "px",
                    width:realPosition.width + "px",
                    height:realPosition.height/2 + "px",
                   })
                   setConfig({target:config.key,left:0,top:0,right:realPosition.width,bottom:realPosition.height/2,layout:"column",position:0})
                }else if(checkPointInArea(point,[rightTop,rightBottom,middle])){
                  setRectStyle({
                    ...rectStyle,
                    top:realPosition.top + "px",
                    left:realPosition.left + realPosition.width/2 + "px",
                    width:realPosition.width/2 + "px",
                    height:realPosition.height + "px",
                   })
                   setConfig({target:config.key,left:realPosition.width/2,top:0,right:realPosition.width,bottom:realPosition.height,layout:"row",position:1})
                }else if(checkPointInArea(point,[rightBottom,middle,leftBottom])){
                  setRectStyle({
                    ...rectStyle,
                    top:realPosition.top + realPosition.height/2 + "px",
                    left:realPosition.left + "px",
                    width:realPosition.width + "px",
                    height:realPosition.height/2 + "px",
                   })
                   setConfig({target:config.key,left:0,top:realPosition.height/2,right:realPosition.width,bottom:realPosition.height,layout:"column",position:1})
                }
              }else{
                 for(const item of config.children!){
                  findTarget(realPosition,point,item);
                 }
              }
            }
           }
        
          for(const config of items){
           findTarget({left:0,top:0,width:width,height:height},{x,y},config);
          }
        }
        setAnchorVisible(true);
      }
    },
    [container, rectStyle, items, height, width]
  );

 
  const handleDragLeave = useCallback((ev:React.DragEvent) => {
    setAnchorVisible(false);
    ev.dataTransfer.clearData();
  }, []);


  const generateTree =( tree: Array<TreeConfig>)=>{
    const components:Array<React.ReactElement> = [];    
    tree.forEach((config,index)=>{
      components.push(gengerateTreeChildren(config,config.getCurrentPosition({width:width,height:height,left:0,top:0}),index === 0,index === tree.length-1,"column"))
     })
      return components;
  }

  const updateSize = (config:TreeConfig,view:ParentPosition,scaleHeight:number,scaleWidth:number)=>{
    console.log("scaleHeight",scaleHeight,"scaleWidth",scaleWidth)
    const parent = config.parent;
    if(!parent || !parent.children){
      return;
    }
    
    const index = parent.children!.findIndex((item)=>item.key === config.key);
    if(index === 0){
      parent.children[0].bottom = parent.children[0].bottom + scaleHeight / view.height;
      parent.children[0].right = parent.children[0].right + scaleWidth / view.width;
      parent.children[1].top = parent.children[1].top + scaleHeight / view.height;
      parent.children[1].left = parent.children[1].left + scaleWidth / view.width;
    }else{
      parent.children[0].bottom = parent.children[0].bottom +scaleHeight / view.height;
      parent.children[0].right = parent.children[0].right + scaleWidth / view.width;
      parent.children[1].top = parent.children[1].top +scaleHeight / view.height;
      parent.children[1].left = parent.children[1].left + scaleWidth / view.width;
    }
    setItems([...items]);
  }

  const gengerateTreeChildren = (config:TreeConfig,view:ParentPosition,isFirst:boolean,isLast:boolean,parentLayout:"row" | "column" | "block")=>{
    let mode:"horizontal" | "vertical" | "left" | "top" | "bottom" | "right" | "none" = "none";
    if(isFirst && isLast){
        mode = "none";
    }else if(isFirst){
      switch(parentLayout){
        case "row":mode = "right";break;
        case "column":mode = "bottom";break;
      }
    }else if(isLast){
      switch(parentLayout){
        case "row":mode = "left";break;
        case "column":mode = "top";break;
      }
    }else{
      switch(parentLayout){
        case "row":mode = "horizontal";break;
        case "column":mode = "vertical";break;
      }
    }
    switch(config.layout){
     case "block":{
       return <ResizeBox
        key={config.key}
        resizeMode={mode}
        maxHeight={config.getMaxHeight(view.height)}
        minHeight={config.getMinHeight(view.height)}
        height={config.getHeight(view.height)}
        width={config.getWidth(view.width)}
        minWidth={config.getMinWidth(view.width)}
        maxWidth={config.getMaxWidth(view.width)}
        onResize={({scaleHeight,scaleWidth})=>{
          updateSize(config,view,scaleHeight,scaleWidth);
        }}
        >{config.child!.component}</ResizeBox>
     }
     case "column":{
      const children:Array<React.ReactElement> = config.children!.map((item,index)=>gengerateTreeChildren(item,config.getCurrentPosition(view),index === 0,index === config.children!.length-1,config.layout))
      return <ResizeBox key={config.key} resizeMode={mode}
      maxHeight={config.getMaxHeight(view.height)}
      minHeight={config.getMinHeight(view.height)}
      height={config.getHeight(view.height)}
      width={config.getWidth(view.width)}
      minWidth={config.getMinWidth(view.width)}
      maxWidth={config.getMaxWidth(view.width)}
      display="column"
      onResize={({scaleHeight,scaleWidth})=>{
        updateSize(config,view,scaleHeight,scaleWidth);
      }}
      >{...children}</ResizeBox>
     }
     case 'row':{
      const children:Array<React.ReactElement> = config.children!.map((item,index)=>gengerateTreeChildren(item,config.getCurrentPosition(view),index === 0,index === config.children!.length-1,config.layout))
      return <ResizeBox key={config.key} resizeMode={mode}
      maxHeight={config.getMaxHeight(view.height)}
      minHeight={config.getMinHeight(view.height)}
      height={config.getHeight(view.height)}
      width={config.getWidth(view.width)}
      minWidth={config.getMinWidth(view.width)}
      maxWidth={config.getMaxWidth(view.width)}
      display="row"
      onResize={({scaleHeight,scaleWidth})=>{
        updateSize(config,view,scaleHeight,scaleWidth);
      }}
      >{...children}</ResizeBox>
     }
    }
    return <div></div>
  }

  return (
    <div
      ref={container}
      className="workspace"
      draggable={false}
      onDrop={handleOnDrap}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {generateTree(items)}
      {anchorVisible && (
        <div style={rectStyle} draggable={false} className="anchor"></div>
      )}
    </div>
  );
}

import React, { useCallback, useState, useRef, useEffect } from "react";
import "./index.css";
import ResizeBox from "../resize-box";
import { useResize } from "../../hooks";
import {TreeConfig,ComponentConfig, generateTreeConfig, ParentPosition} from "./type";
import { checkPointInArea, Point } from "./util";

type GenerateComponent = () => React.ReactElement;

export default function Workspace({
  panels,
}: {
  name: string;
  panels: { [key: string]: GenerateComponent };
}) {
  const [items, setItems] = useState<Array<TreeConfig>>([]);
  const container = useRef<HTMLDivElement | null>(null);
  const [rectStyle, setRectStyle] = useState<{[key:string]:string}>({position: "absolute"});
  const [config, setConfig] = useState<ComponentConfig | null>(null);
  const { width, height } = useResize(container);
  const [lastPosition,setLastPosition] = useState<Array<Point> | null>(null);
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
      setLastPosition(null);
      setRectStyle({...rectStyle,opacity:"0"});
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
        let tree =  generateTreeConfig(null,{width:width,height:height,left:0,top:0,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0},config,panels[targetPanel](),targetPanel);
        setItems([tree]);
      }else if(config){
        const result = findTarget(items[0],{width:width,height:height,left:0,top:0,paddingBottom:0,paddingTop:0,paddingLeft:0,paddingRight:0},config.target)
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
      let tempStyle:{[key:string]:string} = {...rectStyle,opacity:"1"};
      let tempItems = [...items];
      if (container.current && ev.dataTransfer.effectAllowed === "copy") {
        const rect = container.current.getBoundingClientRect();
        const { left, top} = rect;
        const x = ev.clientX -left;
        const y = ev.clientY - top;
        if(lastPosition && lastPosition.length >= 3){
          if(checkPointInArea({x,y},lastPosition)){
            return;
          }
        }
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
            const realPosition = config.getCurrentPosition(view);
            const leftTop = {x:realPosition.left,y:realPosition.top};
            const rightTop = {x:realPosition.left + realPosition.width,y:realPosition.top};
            const rightBottom = {x:realPosition.left + realPosition.width,y:realPosition.top + realPosition.height};
            const leftBottom = {x:realPosition.left,y:realPosition.top + realPosition.height};
            const middle = {x:realPosition.left + realPosition.width/2,y:realPosition.top + realPosition.height/2};
            if(checkPointInArea(point,[leftTop,rightTop,rightBottom,leftBottom])){
              if(config.child){
                if(checkPointInArea(point,[leftTop,middle,leftBottom])){
                  //Left
                  const style = {
                    ...tempStyle,
                    top:realPosition.top +realPosition.paddingTop + "px",
                    left:realPosition.left + realPosition.paddingLeft + "px",
                    width:(realPosition.width - realPosition.paddingLeft - realPosition.paddingRight)/2 + "px",
                    height:realPosition.height - realPosition.paddingTop - realPosition.paddingBottom + "px",
                   }
                   console.log("key",config.key,style)
                  setRectStyle(style)
                   setConfig({target:config.key,
                    left:realPosition.paddingLeft,
                    top:realPosition.paddingTop,
                    right:(realPosition.width - realPosition.paddingLeft - realPosition.paddingRight)/2 + realPosition.paddingLeft,
                    bottom:realPosition.height- realPosition.paddingBottom,
                    layout:"row",position:0})
                   setLastPosition([leftTop,middle,leftBottom])
                }else if(checkPointInArea(point,[leftTop,rightTop,middle])){
                  //Top
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top + realPosition.paddingTop + "px",
                    left:realPosition.left +realPosition.paddingLeft + "px",
                    width:realPosition.width - realPosition.paddingLeft - realPosition.paddingRight + "px",
                    height:(realPosition.height - realPosition.paddingTop - realPosition.paddingBottom)/2 + "px",
                   })
                   setConfig({target:config.key,
                    left:0 +realPosition.paddingLeft,
                    top:0 + realPosition.paddingTop,
                    right:realPosition.width - realPosition.paddingRight,
                    bottom:realPosition.paddingTop + (realPosition.height - realPosition.paddingTop - realPosition.paddingBottom)/2,
                    layout:"column",position:0})
                   setLastPosition([leftTop,rightTop,middle])
                }else if(checkPointInArea(point,[rightTop,rightBottom,middle])){
                  //Right
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top +realPosition.paddingTop + "px",
                    left:realPosition.left + realPosition.paddingLeft + (realPosition.width - realPosition.paddingLeft - realPosition.paddingRight)/2 + "px",
                    width:(realPosition.width - realPosition.paddingLeft - realPosition.paddingRight)/2 + "px",
                    height:realPosition.height - realPosition.paddingTop - realPosition.paddingBottom + "px",
                   })
                   setConfig({target:config.key,left:realPosition.paddingLeft + (realPosition.width - realPosition.paddingLeft - realPosition.paddingRight)/2,top:realPosition.paddingTop,right:realPosition.width - realPosition.paddingRight,bottom:realPosition.height - realPosition.paddingBottom,layout:"row",position:1})
                   setLastPosition([rightTop,rightBottom,middle])
                }else if(checkPointInArea(point,[rightBottom,middle,leftBottom])){
                  //Bottom
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top + realPosition.paddingTop + (realPosition.height - realPosition.paddingTop - realPosition.paddingBottom)/2 + "px",
                    left:realPosition.left + realPosition.paddingLeft + "px",
                    width:realPosition.width - realPosition.paddingLeft - realPosition.paddingRight + "px",
                    height:(realPosition.height - realPosition.paddingTop - realPosition.paddingBottom)/2 + "px",
                   })
                   setConfig({target:config.key,left:0 + realPosition.paddingLeft,top:realPosition.paddingTop + (realPosition.height - realPosition.paddingTop - realPosition.paddingBottom)/2,right:realPosition.width - realPosition.paddingRight,bottom:realPosition.height - realPosition.paddingBottom,layout:"column",position:1})
                   setLastPosition([rightBottom,middle,leftBottom])
                }
              }else{
                 for(const item of config.children!){
                  findTarget(realPosition,point,item);
                 }
              }
            }
           }
           setLastPosition(null);
          for(const config of items){
           findTarget({left:0,top:0,width:width,height:height,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0},{x,y},config);
          }
        }
      }
    },
    [container, rectStyle, items, height, width,lastPosition]
  );

 
  const handleDragLeave = useCallback((ev:React.DragEvent) => {
    setLastPosition(null);
    setRectStyle({...rectStyle,opacity:"0"});
    ev.dataTransfer.clearData();
  }, [rectStyle]);


  const generateTree =( tree: Array<TreeConfig>)=>{
    const components:Array<React.ReactElement> = [];    
    tree.forEach((config,index)=>{
      components.push(gengerateTreeChildren(config,config.getCurrentPosition({width:width,height:height,left:0,top:0,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0}),index === 0,index === tree.length-1,"column"))
     })
      return components;
  }

  const updateSize = (config:TreeConfig,view:ParentPosition,scaleHeight:number,scaleWidth:number)=>{
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
      ><>{children}</></ResizeBox>
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
      ><>{children}</></ResizeBox>
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
       <div style={rectStyle} draggable={false} className="anchor"></div>
    </div>
  );
}

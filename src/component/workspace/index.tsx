import React, { useCallback, useState, useRef, useEffect } from "react";
import "./index.css";
import ResizeBox from "../resize-box";
import { useResize } from "../../hooks";
import {TreeConfig,ComponentConfig, generateTreeConfig, ParentPosition, Padding} from "./type";
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
  const handleOnDrap = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      setLastPosition(null);
      setRectStyle({...rectStyle,opacity:"0"});
      const targetPanel = ev.dataTransfer.getData("text");
      if(targetPanel === ""){
        return;
      }
     
      
      if(config && config.target === "root"){
        let tree =  generateTreeConfig(null,{width:width,height:height,left:0,top:0,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0,innerHeight:height,innerWidth:width},config,panels[targetPanel](),targetPanel);
        setItems([tree]);
      }else if(config){
        const result = findTarget(items[0],{width:width,height:height,left:0,top:0,paddingBottom:0,paddingTop:0,paddingLeft:0,paddingRight:0,innerHeight:height,innerWidth:width},config.target)
        if(result){
          generateTreeConfig(result.target,result.view,config,panels[targetPanel](),targetPanel);
          setItems([...items])
        }
        
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
                    width:(realPosition.innerWidth!)/2 + "px",
                    height:realPosition.innerHeight! + "px",
                   }
                  setRectStyle(style)
                   setConfig({target:config.key,
                    left:0,
                    top:0,
                    right:(realPosition.innerWidth! - Padding)/2 + Padding,
                    bottom:realPosition.innerHeight,
                    layout:"row",position:0})
                   setLastPosition([leftTop,middle,leftBottom])
                }else if(checkPointInArea(point,[leftTop,rightTop,middle])){
                  //Top
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top + realPosition.paddingTop + "px",
                    left:realPosition.left +realPosition.paddingLeft + "px",
                    width:realPosition.innerWidth! + "px",
                    height:(realPosition.innerHeight! - Padding)/2 + Padding + "px",
                   })
                   
                   setConfig({
                    target:config.key,
                    left:0,
                    top:0,
                    right:realPosition.innerWidth,
                    bottom:(realPosition.innerHeight! - Padding)/2 + Padding,
                    layout:"column",
                    position:0})
                   setLastPosition([leftTop,rightTop,middle])
                }else if(checkPointInArea(point,[rightTop,rightBottom,middle])){
                  //Right
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top +realPosition.paddingTop + "px",
                    left:realPosition.left + realPosition.paddingLeft + (realPosition.innerWidth!)/2 + "px",
                    width:(realPosition.innerWidth!)/2 + "px",
                    height:realPosition.innerHeight! + "px",
                   })
                   setConfig({target:config.key,
                    left:realPosition.innerWidth - (realPosition.innerWidth! - Padding)/2,
                    top:0,
                    right:realPosition.innerWidth,
                    bottom:realPosition.innerHeight,layout:"row",position:1})
                   setLastPosition([rightTop,rightBottom,middle])
                }else if(checkPointInArea(point,[rightBottom,middle,leftBottom])){
                  //Bottom
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top + realPosition.paddingTop + realPosition.innerHeight!/2 + "px",
                    left:realPosition.left + realPosition.paddingLeft + "px",
                    width:realPosition.innerWidth! + "px",
                    height:(realPosition.innerHeight!)/2 + "px",
                   })
                   setConfig({target:config.key,
                    left:0,
                    top:realPosition.innerHeight - (realPosition.innerHeight! - Padding)/2,
                    right:realPosition.innerWidth,
                    bottom:realPosition.innerHeight,
                    layout:"column",position:1})
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
           findTarget({left:0,top:0,width:width,height:height,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0,innerHeight:height,innerWidth:width},{x,y},config);
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
      components.push(gengerateTreeChildren(config,config.getCurrentPosition({width:width,height:height,left:0,top:0,paddingBottom:0,paddingLeft:0,paddingRight:0,paddingTop:0,innerHeight:height,innerWidth:width}),index === 0,index === tree.length-1,"column"))
     })
      return components;
  }

  const updateSize = (config:TreeConfig,view:ParentPosition,scaleHeight:number,scaleWidth:number)=>{
    const parent = config.parent;
    if(!parent || !parent.children){
      return;
    }
    
    if(scaleHeight === 0 && scaleWidth === 0){
      return;
    }
    if(scaleWidth !== 0){
      parent.children[0].right = parent.children[0].right + scaleWidth / view.innerWidth!;
      parent.children[1].left = parent.children[0].right;
    }else{
      parent.children[0].bottom = parent.children[0].bottom + scaleHeight / view.innerHeight!;
      parent.children[1].top = parent.children[0].bottom;
    }
    updateChildrenSize(parent.children![0],view)
    updateChildrenSize(parent.children![1],view)
    setItems([...items]);  
    
  }


  const updateChildrenSize = (tree:TreeConfig,view:ParentPosition)=>{
    const realPosition = tree.getCurrentPosition(view);   
    if(tree.layout === "row"){
             let firstMinWidth = tree.children![0].getMinWidth();
             let lastMinWidth = tree.children![1].getMinWidth();
             console.log("key",tree.key,firstMinWidth)
             if(tree.children![0].getWidth(realPosition.innerWidth) < firstMinWidth){
              tree.children![0].right = (firstMinWidth/realPosition.innerWidth)
              tree.children![1].left = tree.children![0].right;
             }else if(tree.children![1].getWidth(realPosition.innerWidth) < lastMinWidth){
              tree.children![0].right =1- (lastMinWidth/realPosition.innerWidth);
              tree.children![1].left = tree.children![0].right;
             }
             tree.children!.forEach((item)=>updateChildrenSize(item,realPosition))
       }else if(tree.layout === "column"){
            let firstMinHeight = tree.children![0].getMinHeight();
            let lastMinHeight = tree.children![1].getMinHeight();
            if(tree.children![0].getHeight(realPosition.innerHeight) < firstMinHeight){
            tree.children![0].bottom = (firstMinHeight/realPosition.innerHeight)
            tree.children![1].top = tree.children![0].bottom;
            }else if(tree.children![1].getHeight(realPosition.innerHeight) < lastMinHeight){
            tree.children![0].bottom = 1- (lastMinHeight/realPosition.innerHeight)
            tree.children![1].top = tree.children![0].bottom;
            }
            tree.children!.forEach((item)=>updateChildrenSize(item,realPosition))
       }
     
  }

  const getMaxWidth = (target:TreeConfig,view:ParentPosition)=>{
    if(!target.parent){
      return view.innerWidth;
    }

    return view.innerWidth - target.parent.children!.filter((item)=>item.key != target.key)[0].getMinWidth();
  }

  const getMaxHeight = (target:TreeConfig,view:ParentPosition)=>{
    if(!target.parent){
      return view.innerHeight;
    }

    return view.innerHeight - target.parent.children!.filter((item)=>item.key != target.key)[0].getMinHeight();
  }

  


  const gengerateTreeChildren = (config:TreeConfig,view:ParentPosition,isFirst:boolean,isLast:boolean,parentLayout:"row" | "column" | "block")=>{
    let mode: "bottom" | "right" | "none" = "none";
    if(isFirst && isLast){
        mode = "none";
    }else if(isFirst){
      switch(parentLayout){
        case "row":mode = "right";break;
        case "column":mode = "bottom";break;
      }
    }
    console.log("key",config.key,"MinWidth",config.getMinWidth());
    console.log(items[0])
    switch(config.layout){
     case "block":{
       return <ResizeBox
        k={config.key}
        key={config.key}
        resizeMode={mode}
        maxHeight={getMaxHeight(config,view)}
        minHeight={config.getMinHeight()}
        height={config.getHeight(view.innerHeight)}
        width={config.getWidth(view.innerWidth)}
        minWidth={config.getMinWidth()}
        maxWidth={getMaxWidth(config,view)}
        onResize={({scaleHeight,scaleWidth})=>{
          updateSize(config,view,scaleHeight,scaleWidth);
        }}
        ><>
        <div style={{width:"100%",height:"100px",backgroundColor:"black"}}>
          <button onClick={()=>{
            if(!config.parent){
              setItems([]);
            }else{
             config.delete();
             setItems([...items]);
            }
          }}>delete</button>
          {config.key}
        </div>
        {config.child!.component}
        </></ResizeBox>
     }
     case "column":{
      const children:Array<React.ReactElement> = config.children!.map((item,index)=>gengerateTreeChildren(item,config.getCurrentPosition(view),index === 0,index === config.children!.length-1,config.layout))
      return <ResizeBox
      k={config.key}
      key={config.key}
      resizeMode={mode}
      maxHeight={getMaxHeight(config, view)}
      minHeight={config.getMinHeight()}
      height={config.getHeight(view.innerHeight)}
      width={config.getWidth(view.innerWidth)}
      minWidth={config.getMinWidth()}
      maxWidth={getMaxWidth(config,view)}
      display="column"
      onResize={({scaleHeight,scaleWidth})=>{
        updateSize(config,view,scaleHeight,scaleWidth);
      }}
      ><>{children}</></ResizeBox>
     }
     case 'row':{
      const children:Array<React.ReactElement> = config.children!.map((item,index)=>gengerateTreeChildren(item,config.getCurrentPosition(view),index === 0,index === config.children!.length-1,config.layout))
      return <ResizeBox
       key={config.key}
       k={config.key}
       resizeMode={mode}
      maxHeight={getMaxHeight(config,view)}
      minHeight={config.getMinHeight()}
      height={config.getHeight(view.innerHeight)}
      width={config.getWidth(view.innerWidth)}
      minWidth={config.getMinWidth()}
      maxWidth={getMaxWidth(config,view)}
      display="row"
      onResize={({scaleHeight,scaleWidth})=>{
        updateSize(config,view,scaleHeight,scaleWidth);
      }}
      ><>{children}</></ResizeBox>
     }
    }
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

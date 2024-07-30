import React, { useCallback, useState, useRef, useEffect } from "react";
import "./index.css";
import ResizeBox from "../resize-box";
import { useResize } from "../../hooks";

type GenerateComponent = () => React.ReactElement;
type ComponentConfig = {
  row: number;
  column: number;
};

type TreeConfig = Array<RowConfig>;

type RowConfig = {
  height: number;
  minHeight: number;
  maxHeight: number;
  children: Array<ChildConfig>;
};

type ChildConfig = {
  height: number;
  minHeight: number;
  maxHeight: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  child: React.ReactElement;
};

const rowMinHeight = 100;
const columnMinWidth = 100;
/// left,right,top,bottom based on parent;
class TreeConfig {
  left:number;
  right:number;
  top:number;
  bottom:number;
  minWidth:number;
  maxWidth:number;
  maxHeight:number;
  minHeight:number;
  children?:Array<TreeConfig>;
  child?:TreeConfig;

  constructor(left:number,right:number,top:number,bottom:number,minWidth:number,maxWidth:number,maxHeight:number,minHeight:number,option?:{children?:Array<TreeConfig>,child?:TreeConfig}){
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.minWidth = minWidth;
    this.maxWidth = maxWidth;
    this.maxHeight = maxHeight;
    this.minHeight = minHeight;
    this.child = option?.child;
    this.children = option?.children;
  }

  getLeft = (viewWidth:number):number => {
    return this.left * viewWidth;
  }

  getRight = (viewWidth:number):number => {
    return this.right * viewWidth;
  }

  getTop = (viewHeight:number):number => {
    return this.top * viewHeight;
  }

  getBottom = (viewHeight:number):number => {
    return this.bottom * viewHeight
  }

  getWidth = (viewWidth:number):number => {
    return (this.right - this.left) * viewWidth
  }

  getMinWidth = (viewWidth:number):number => {
    return (this.bottom - this.top) * viewWidth
  }

  getMaxWidth = (viewWidth:number):number => {
    return (this.bottom - this.top) * viewWidth
  }

  getHeight = (viewHeight:number):number => {
    return (this.bottom - this.top) * viewHeight
  }

  getMinHeight = (viewHeight:number):number => {
    return (this.bottom - this.top) * viewHeight
  }

  getMaxHeight = (viewHeight:number):number => {
    return (this.bottom - this.top) * viewHeight
  }

}


export default function Workspace({
  panels,
}: {
  name: string;
  panels: { [key: string]: GenerateComponent };
}) {
  const [anchorVisible, setAnchorVisible] = useState<boolean>(false);
  const [items, setItems] = useState<TreeConfig>([]);
  const container = useRef<HTMLDivElement | null>(null);
  const [rectStyle, setRectStyle] = useState<{[key:string]:string}>({
    position: "absolute",
  });
  const [config, setConfig] = useState<ComponentConfig>({ row: 0, column: 0 });
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


  const removeAllDragble = useCallback((ele: HTMLElement) => {
    ele.draggable = false;
    if (ele.children && ele.children.length !== 0) {
      for (const element of ele.children) {
        removeAllDragble(element as HTMLElement);
      }
    }
  }, []);

  const handleOnDrap = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      setAnchorVisible(false);
      let item:RowConfig | null = null;
      const targetPanel = ev.dataTransfer.getData("text");
      console.log(targetPanel);
      let temp:Array<RowConfig> = [...items];
      if(config.row === -1  || config.row >= items.length){
        const totalHeight =items.reduce((pre, current) => pre + current.height, 0) +(items.length - 1) * 10;
        if (height - totalHeight < 10) {
          const perH = (height - temp.length * 10) / (temp.length + 1);
          const maxHeight = height - temp.length * 10 - (temp.length + 1) * rowMinHeight;
          temp.forEach((ele) => {
            ele.height = perH;
            ele.maxHeight =
              height - temp.length * 10 - temp.length * rowMinHeight;
            ele.children.forEach((e) => {
              e.height = perH;
            });
          });
          item = {
            height: perH,
            minHeight: rowMinHeight,
            maxHeight: maxHeight,
            children: [
              {
                height: perH,
                minHeight: rowMinHeight,
                maxHeight: maxHeight,
                width: width,
                minWidth: 100,
                maxWidth: width,
                child: panels[targetPanel](),
              },
            ],
          }
        } else {
          const rowHeight = height - totalHeight - 10;
          console.log(panels[targetPanel])
          item = {
            height: rowHeight,
            minHeight: rowMinHeight,
            maxHeight: height - temp.length * 10 - temp.length * rowMinHeight,
            children: [
              {
                height: rowHeight,
                minHeight: rowMinHeight,
                maxHeight:
                  height - temp.length * 10 - temp.length * rowMinHeight,
                width: width,
                minWidth: 100,
                maxWidth: width,
                child: panels[targetPanel](),
              },
            ],
          };
        }
        if(config.row === -1){
            temp =[item,...temp];
        }else{
            temp = [...temp,item];
        }
        setItems(temp);
      } else {
        const temp = Array.from(items);
        const row = temp[config.row];
        const totalWidth =
          row.children.reduce((pre, current) => pre + current.width, 0) +
          (row.children.length - 1) * 10;
        if (width - totalWidth < 10) {
          const perW =
            (width - row.children.length * 10) / (row.children.length + 1);
          const maxW =
            width -
            row.children.length * 10 -
            columnMinWidth * row.children.length;
          row.children.map((ele) => {
            ele.width = perW;
            ele.maxWidth = maxW;
          });
          if (config.column > row.children.length) {
            row.children.push({
              minHeight: row.minHeight,
              maxHeight: row.maxHeight,
              height: row.height,
              width: perW,
              maxWidth: maxW,
              minWidth: columnMinWidth,
              child: panels[targetPanel](),
            });
          } else {
            row.children = [
              ...row.children.slice(0, config.column),
              ...[
                {
                  minHeight: row.minHeight,
                  maxHeight: row.maxHeight,
                  height: row.height,
                  width: perW,
                  maxWidth: maxW,
                  minWidth: columnMinWidth,
                  child: panels[targetPanel](),
                },
              ],
              ...row.children.slice(config.column),
            ];
          }
        } else {
          const columnWidth = width - totalWidth - 10;
          const maxW =
            width -
            row.children.length * 10 -
            columnMinWidth * row.children.length;
          if (config.column > row.children.length) {
            row.children.push({
              minHeight: row.minHeight,
              maxHeight: row.maxHeight,
              height: row.height,
              width: columnWidth,
              maxWidth: maxW,
              minWidth: columnMinWidth,
              child: panels[targetPanel](),
            });
          } else {
            row.children = [
              ...row.children.slice(0, config.column),
              ...[
                {
                  minHeight: row.minHeight,
                  maxHeight: row.maxHeight,
                  height: row.height,
                  width: columnWidth,
                  maxWidth: maxW,
                  minWidth: columnMinWidth,
                  child: panels[targetPanel](),
                },
              ],
              ...row.children.slice(config.column),
            ];
          }
        }

        temp[config.row] = row;
        setItems(temp);
      }
      ev.dataTransfer.clearData();
      requestAnimationFrame(() => {
        removeAllDragble(container.current as HTMLElement);
      });
    },
    [items, panels, config, removeAllDragble, width, height]
  );

  const handleDragOver = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      console.log(ev);
      let temp = {...rectStyle};
      if (container.current && ev.dataTransfer.effectAllowed === "copy") {
        const { left, top } = container.current.getBoundingClientRect();
        const x = ev.clientX;
        const y = ev.clientY;
        const total = items.reduce((pre, current) => pre + current.height, 0) + (items.length -1) * 10;
        let currentY = 0;
        let currentHeight = 0;
        for (let index = 0; index < items.length; index++) {
          currentHeight = currentHeight + items[index].height + (index > 0 ? 10 : 0);
          if (y < currentHeight + top) {
            break;
          }
          currentY++;
        }
        if (currentY === items.length - 1 && y - top > height * 0.9) {
          temp = {
            ...rectStyle,
            top: height * 0.9 + "px",
            left: "0px",
            height: height * 0.1 + "px",
            width: "100%",
          };
          setConfig({ row: items.length, column: 0 });
        } else if (currentY >= items.length) {
          setConfig({ row: currentY, column: 0 });
           temp = {
            ...rectStyle,
            top: total + "px",
            left: "0px",
            height: height - total + "px",
            width: "100%",
          };
        } else {
          const targetTop = items.slice(0, currentY).reduce((pre, current) => pre + current.height, 0) +currentY * 10;
          let currentX = 0;
          const children = items[currentY].children;
          let currentWidth = 0;
          for (let index = 0; index < children.length; index++) {
            currentWidth =
              currentWidth + children[index].width + (index > 0 ? 10 : 0);
            if (x < currentWidth + left) {
              break;
            }
            currentX++;
          }
          if(children.length === 1 && items.length === 1 && items[0].height === height && items[0].children[0].width === width){
            if(y < top + height/2 ){
                temp = {
                    ...rectStyle,
                    top: 0 + "px",
                    left: 0 + "px",
                    height: items[0].height/2 + "px",
                    width: "100%",
                  };
                  currentY = -1;
                  currentX = 0;
            }else if(y > top + height/2){
                temp = {
                    ...rectStyle,
                    top: items[0].height/2 + "px",
                    left: 0 + "px",
                    height: items[0].height/2 + "px",
                    width: width + "px",
                  };
                  currentY = 1;
                  currentX = 0;
            }else if(x < left + width/2){
                temp = {
                    ...rectStyle,
                    top: 0 + "px",
                    left: 0 + "px",
                    height: items[0].height + "px",
                    width: width/2 + "px",
                  };
                  currentY = 0;
                  currentX = 0;
            }else if(x > left + width/2){
                temp = {
                    ...rectStyle,
                    top: 0 + "px",
                    left: width/2 + "px",
                    height: items[0].height + "px",
                    width: width/2 + "px",
                  };
                  currentY = 0;
                  currentX = 1;
            }
          }else if(items[currentY].children.length === 1 && items[currentY].children[0].width === width && x < left + items[currentY].children[0].width/2){
            temp = {
                ...rectStyle,
                top: targetTop + "px",
                left: 0 + "px",
                height: items[currentY].height + "px",
                width: width /2 + "px",
              };
              currentX = 0
        }else if(items[currentY].children.length === 1 && items[currentY].children[0].width === width && x > left + items[currentY].children[0].width/2){
            temp = {
                ...rectStyle,
                top: targetTop + "px",
                left: items[currentY].children[0].width/2  + "px",
                height: items[currentY].height + "px",
                width: width /2 + "px",
              };
              currentX = 0
        }else if (currentX < children.length) {
            const targetLeft =
              children.slice(0, currentX).reduce((pre, current) => pre + current.width, 0) +currentX * 10;
            temp = {
              ...rectStyle,
              top: targetTop + "px",
              left: targetLeft + "px",
              height: children[currentX].height + "px",
              width: children[currentX].width + "px",
            };
          } else {
            const target =
              children.reduce((pre, current) => pre + current.width, 0) +
              children.length * 10;
            temp = {
              ...rectStyle,
              top: targetTop + "px",
              left: target + "px",
              height: items[currentY].height + "px",
              width: width - target + "px",
            };
          }

          setConfig({ row: currentY, column: currentX });
         
        }
        let pass = true;
        console.log(temp);
        for(let key of Object.keys(temp)){
          if(rectStyle[key] !== temp[key]){
            pass = false;
            break;
          }
        }
        console.log("pass",pass)
        if(!pass){
          setRectStyle(temp);
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

  const calculateWidth = () => {
    if (container.current) {
      return container.current.getBoundingClientRect().width;
    }
    return 0;
  };


  const findTarget = (positionX:number,positionY:number,items:Array<>)=>{}

  return (
    <div
      ref={container}
      className="workspace"
      draggable={false}
      onDrop={handleOnDrap}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {items.map((e, row) => {
        return (
          <ResizeBox
            key={row}
            minHeight={e.minHeight}
            maxHeight={e.maxHeight}
            minWidth={calculateWidth()}
            maxWidth={calculateWidth()}
            width={calculateWidth()}
            height={e.height}
            resizeMode="vertical"
            onResize={({ height }) => {
              const temp = [...items];
              temp[row].height = height;
              temp[row].children.forEach((ele) => {
                ele.height = height;
              });
              setItems(temp);
            }}
            marginBottom={row !== items.length - 1 ? 10 : undefined}
          >
            <div className="row" style={{ backgroundColor: "gray" }}>
              {e.children.map((ele, column) => (
                <ResizeBox
                  key={`${row}-${column}`}
                  minHeight={ele.minHeight}
                  maxHeight={ele.maxHeight}
                  minWidth={ele.minWidth}
                  maxWidth={ele.maxWidth}
                  height={ele.height}
                  width={ele.width}
                  resizeMode="horizontal"
                  onResize={({ width, height }) => {
                    const temp = [...items];
                    temp[row].children[column].height = height;
                    temp[row].children[column].width = width;
                    setItems(temp);
                  }}
                  marginLeft={column !== 0 ? 10 : undefined}
                >
                  {ele.child}
                </ResizeBox>
              ))}
            </div>
          </ResizeBox>
        );
      })}
      {anchorVisible && (
        <div style={rectStyle} draggable={false} className="anchor"></div>
      )}
    </div>
  );
}

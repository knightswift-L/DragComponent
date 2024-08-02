import React, { useCallback, useState, useRef, useEffect } from "react";
import "./index.css";
import ResizeBox from "../resize-box";
import { useResize } from "../../hooks";
import {
  TreeConfig,
  ComponentConfig,
  generateTreeConfig,
  ParentPosition,
  Padding,
} from "./type";
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
  const [rectStyle, setRectStyle] = useState<{ [key: string]: string }>({
    position: "absolute",
    opacity:"0"
  });
  const [config, setConfig] = useState<ComponentConfig | null>(null);
  const { width, height } = useResize(container);
  const [lastPosition, setLastPosition] = useState<Array<Point> | null>(null);
  useEffect(() => {
    window.ondrop = (e) => {
      e.preventDefault();
      return false;
    };

    window.ondragover = (e) => {
      e.preventDefault();
      return false;
    };
    return () => {
      window.ondrop = null;
      window.ondragover = null;
    };
  }, []);

  const findTarget = useCallback(
    (
      tree: TreeConfig,
      view: ParentPosition,
      target: string
    ): { target: TreeConfig; view: ParentPosition } | null => {
      if (tree.key === target) {
        return { target: tree, view: tree.getCurrentPosition(view) };
      } else if (tree.child) {
        return null;
      }
      const realPosition = tree.getCurrentPosition(view);
      for (const item of tree.children!) {
        const result = findTarget(item, realPosition, target);
        if (result) {
          return result;
        }
      }

      return null;
    },
    []
  );
  const handleOnDrap = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      setLastPosition(null);
      setRectStyle({ ...rectStyle, opacity: "0" });
      let targetPanel = ev.dataTransfer.getData("text/plain");
      if (!targetPanel) {
        return;
      }
      let originalKey:string | null = null;
      if(targetPanel.includes("###")){
        const temp = targetPanel.split("###");
        targetPanel = temp[0];
        originalKey = temp[1];
      }


      if(config && config.target === originalKey){
        return ;
      }
      if (config && config.target === "root") {
        const tree = generateTreeConfig(
          null,
          {
            width: width,
            height: height,
            left: 0,
            top: 0,
          },
          config,
          panels[targetPanel](),
          targetPanel
        );
        setItems([tree]);
      } else if (config) {
        const result = findTarget(
          items[0],
          {
            width: width,
            height: height,
            left: 0,
            top: 0,
          },
          config.target
        );
        if (result) {
          generateTreeConfig(
            result.target,
            result.view,
            config,
            panels[targetPanel](),
            targetPanel
          );
          
        }
        if(originalKey){
          const result = findTarget(
            items[0],
            {
              width: width,
              height: height,
              left: 0,
              top: 0,
            },
            originalKey
          );
          result && result.target.delete();
        }
        setItems([...items]);
      }
      ev.dataTransfer.clearData();
    },
    [items, panels, config, width, height, findTarget, rectStyle]
  );

  const handleDragOver = useCallback(
    (ev: React.DragEvent) => {
      ev.preventDefault();
      let tempStyle: { [key: string]: string } = { ...rectStyle, opacity: "1" };
      const tempItems = [...items];
      if (container.current && (ev.dataTransfer.effectAllowed === "copy" || ev.dataTransfer.effectAllowed === "move")) {
        const rect = container.current.getBoundingClientRect();
        const { left, top } = rect;
        const x = ev.clientX - left;
        const y = ev.clientY - top;
        if (lastPosition && lastPosition.length >= 3) {
          if (checkPointInArea({ x, y }, lastPosition)) {
            return;
          }
        }
        if (tempItems.length === 0) {
          setConfig({
            target: "root",
            layout: "block",
            left: 0,
            right: width,
            top: 0,
            bottom: height,
            position: 0,
          });
          tempStyle = {
            ...tempStyle,
            top: "0px",
            left: "0px",
            width: width + "px",
            height: height + "px",
          };
          setRectStyle(tempStyle);
        } else {
          const findTarget = (
            view: ParentPosition,
            point: { x: number; y: number },
            config: TreeConfig
          ) => {
            const realPosition = config.getCurrentPosition(view);
            const leftTop = { x: realPosition.left, y: realPosition.top };
            const rightTop = {
              x: realPosition.left + realPosition.width,
              y: realPosition.top,
            };
            const rightBottom = {
              x: realPosition.left + realPosition.width,
              y: realPosition.top + realPosition.height,
            };
            const leftBottom = {
              x: realPosition.left,
              y: realPosition.top + realPosition.height,
            };
            const middle = {
              x: realPosition.left + realPosition.width / 2,
              y: realPosition.top + realPosition.height / 2,
            };
            if (
              checkPointInArea(point, [
                leftTop,
                rightTop,
                rightBottom,
                leftBottom,
              ])
            ) {
              if (config.child) {
                if (checkPointInArea(point, [leftTop, middle, leftBottom])) {
                  //Left
                  const style = {
                    ...tempStyle,
                    top: realPosition.top + "px",
                    left: realPosition.left + "px",
                    width: realPosition.width! / 2 + "px",
                    height: realPosition.height! + "px",
                  };
                  setRectStyle(style);
                  setConfig({
                    target: config.key,
                    left: 0,
                    top: 0,
                    right:realPosition.width!/ 2,
                    bottom: realPosition.height,
                    layout: "row",
                    position: 0,
                  });
                  setLastPosition([leftTop, middle, leftBottom]);
                } else if (
                  checkPointInArea(point, [leftTop, rightTop, middle])
                ) {
                  //Top
                  setRectStyle({
                    ...tempStyle,
                    top: realPosition.top + "px",
                    left: realPosition.left + "px",
                    width: realPosition.width! + "px",
                    height:realPosition.height! / 2 + "px",
                  });

                  setConfig({
                    target: config.key,
                    left: 0,
                    top: 0,
                    right: realPosition.width,
                    bottom: realPosition.height!/2,
                    layout: "column",
                    position: 0,
                  });
                  setLastPosition([leftTop, rightTop, middle]);
                } else if (
                  checkPointInArea(point, [rightTop, rightBottom, middle])
                ) {
                  //Right
                  setRectStyle({
                    ...tempStyle,
                    top: realPosition.top + "px",
                    left:
                      realPosition.left +
                      realPosition.width! / 2 +
                      "px",
                    width: realPosition.width! / 2 + "px",
                    height: realPosition.height! + "px",
                  });
                  setConfig({
                    target: config.key,
                    left:
                      realPosition.width/2,
                    top: 0,
                    right: realPosition.width,
                    bottom: realPosition.height,
                    layout: "row",
                    position: 1,
                  });
                  setLastPosition([rightTop, rightBottom, middle]);
                } else if (
                  checkPointInArea(point, [rightBottom, middle, leftBottom])
                ) {
                  //Bottom
                  setRectStyle({
                    ...tempStyle,
                    top:realPosition.top + realPosition.height! / 2 +"px",
                    left: realPosition.left  + "px",
                    width: realPosition.width! + "px",
                    height: realPosition.height! / 2 + "px",
                  });
                  setConfig({
                    target: config.key,
                    left: 0,
                    top:realPosition.height/2,
                    right: realPosition.width,
                    bottom: realPosition.height,
                    layout: "column",
                    position: 1,
                  });
                  setLastPosition([rightBottom, middle, leftBottom]);
                }
              } else {
                for (const item of config.children!) {
                  findTarget(realPosition, point, item);
                }
              }
            }
          };
          setLastPosition(null);
          for (const config of items) {
            findTarget(
              {
                left: 0,
                top: 0,
                width: width,
                height: height,
              },
              { x, y },
              config
            );
          }
        }
      }
    },
    [container, rectStyle, items, height, width, lastPosition]
  );

  const handleDragLeave = useCallback(
    (ev:React.DragEvent) => {
      setLastPosition(null);
      setRectStyle({ ...rectStyle, opacity: "0" });
      ev.dataTransfer.clearData();
    },
    [rectStyle]
  );

  const generateTree = (tree: Array<TreeConfig>) => {
    const components: Array<React.ReactElement> = [];
    tree.forEach((config) => {
      components.push(
        gengerateTreeChildren(
          config,
          config.getCurrentPosition({
            width: width,
            height: height,
            left: 0,
            top: 0,
          })
        )
      );
    });
    return components;
  };

  const updateSize = (
    config: TreeConfig,
    view: ParentPosition,
    scaleHeight: number,
    scaleWidth: number
  ) => {
    if (scaleHeight === 0 && scaleWidth === 0) {
      return;
    }
    const realWidth = config.getWidth(view.width);
    const realHeight = config.getHeight(view.height);
    if (scaleWidth !== 0) {
      const lastRight = config.children![0].right;
      config.children![0].right = config.children![0].right + scaleWidth / realWidth;
      config.children![1].left = config.children![0].right;
      if(config.children![0].getWidth(realWidth) < config.children![0].getMinWidth() || config.children![1].getWidth(realWidth) < config.children![1].getMinWidth()){
        config.children![0].right = lastRight;
        config.children![1].left = config.children![0].right;
      }
    } else {
      const lastBottom = config.children![0].bottom;
      config.children![0].bottom = config.children![0].bottom + scaleHeight / realHeight;
      config.children![1].top = config.children![0].bottom;
      if(config.children![0].getHeight(realHeight) < config.children![0].getMinHeight() || config.children![1].getHeight(realHeight) < config.children![1].getMinHeight()){
        config.children![0].bottom = lastBottom;
        config.children![1].top = config.children![0].bottom;
      }
    }
    updateChildrenSize(config.children![0], view);
    updateChildrenSize(config.children![1], view);
    setItems([...items]);
  };

  const updateChildrenSize = (tree: TreeConfig, view: ParentPosition) => {
    const realPosition = tree.getCurrentPosition(view);
    if (tree.layout === "row") {
      const firstMinWidth = tree.children![0].getMinWidth();
      const lastMinWidth = tree.children![1].getMinWidth();
      if (tree.children![0].getWidth(realPosition.width) < firstMinWidth + Padding/2) {
        tree.children![0].right = (firstMinWidth + Padding/2) / realPosition.width;
        tree.children![1].left = tree.children![0].right;
      } else if (
        tree.children![1].getWidth(realPosition.width) < lastMinWidth + Padding/2
      ) {
        tree.children![0].right = 1 - (lastMinWidth + Padding/2) / realPosition.width;
        tree.children![1].left = tree.children![0].right;
      }
      tree.children!.forEach((item) => updateChildrenSize(item, realPosition));
    } else if (tree.layout === "column") {
      const firstMinHeight = tree.children![0].getMinHeight();
      const lastMinHeight = tree.children![1].getMinHeight();
      if (
        tree.children![0].getHeight(realPosition.height) < firstMinHeight + Padding/2
      ) {
        tree.children![0].bottom = (firstMinHeight + Padding/2) / realPosition.height;
        tree.children![1].top = tree.children![0].bottom;
      } else if (
        tree.children![1].getHeight(realPosition.height) < lastMinHeight + Padding/2
      ) {
        tree.children![0].bottom = 1 - (lastMinHeight + Padding/2) / realPosition.height;
        tree.children![1].top = tree.children![0].bottom;
      }
      tree.children!.forEach((item) => updateChildrenSize(item, realPosition));
    }
  };

  const gengerateTreeChildren = (
    config: TreeConfig,
    view: ParentPosition
  ) => {
    let mode: "horizontal" | "vertical" | "none" = "none";
    if(config.layout === "row"){
      mode = "horizontal"
    }else if(config.layout === "column"){
      mode = "vertical";
    }
    switch (config.layout) {
      case "block": {
        return (
          <ResizeBox
            key={config.key}
            resizeMode={mode}
            height={config.getHeight(view.height)}
            width={config.getWidth(view.width)}
            onResize={({ scaleHeight, scaleWidth }) => {
              updateSize(config, view, scaleHeight, scaleWidth);
            }}
            name={`${config.child!.name}###${config.key}`}
          >
            <>
              <div
                style={{
                  width: "100%",
                  height: "100px",
                  backgroundColor: "black",
                }}
              >
                <button
                  onClick={() => {
                    if (!config.parent) {
                      setItems([]);
                    } else {
                      config.delete();
                      setItems([...items]);
                    }
                  }}
                >
                  delete
                </button>
                {config.key}
              </div>
              {config.child!.component}
            </>
          </ResizeBox>
        );
      }
      case "column": {
        const children: Array<React.ReactElement> = config.children!.map(
          (item) =>
            gengerateTreeChildren(
              item,
              config.getCurrentPosition(view)
            )
        );
        return (
          <ResizeBox
            key={config.key}
            resizeMode={mode}
            height={config.getHeight(view.height)}
            width={config.getWidth(view.width)}
            display="column"
            onResize={({ scaleHeight, scaleWidth }) => {
              updateSize(config, view, scaleHeight, scaleWidth);
            }}
            divider={config.children![0].bottom *config.getHeight(view.height)}
          >
            <>{children}</>
          </ResizeBox>
        );
      }
      case "row": {
        const children: Array<React.ReactElement> = config.children!.map(
          (item) =>
            gengerateTreeChildren(
              item,
              config.getCurrentPosition(view)
            )
        );
        return (
          <ResizeBox
            key={config.key}
            resizeMode={mode}
            height={config.getHeight(view.height)}
            width={config.getWidth(view.width)}
            display="row"
            onResize={({ scaleHeight, scaleWidth }) => {
              updateSize(config, view, scaleHeight, scaleWidth);
            }}
            divider={config.children![0].right *config.getWidth(view.width)}
          >
            <>{children}</>
          </ResizeBox>
        );
      }
    }
  };

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
      <img src="/assets/add.svg" style={{width:"0px",height:"0px",position:"absolute",zIndex:-1}}></img>
      <img src="/assets/move.svg" style={{width:"0px",height:"0px",position:"absolute",zIndex:-1}}></img>

    </div>
  );
}

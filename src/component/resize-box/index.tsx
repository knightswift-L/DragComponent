import React, { useCallback, useEffect, useRef, useState } from "react";
import MoveIcon from "@/assets/move.svg";
const distance: number = 30;
type ResizeCallBack = (param: {
  scaleWidth: number;
  scaleHeight: number;
}) => void;
export default function ResizeBox({
  resizeMode,
  width: originalWidth,
  height: originalHeight,
  onResize,
  children,
  display,
  divider,
  name,
  isNotRoot = false,
}: {
  resizeMode: "vertical" | "horizontal" | "none";
  height: number;
  width: number;
  onResize: ResizeCallBack;
  children: React.ReactElement;
  display?: "row" | "column";
  divider?: number;
  name?: string;
  isNotRoot?: boolean;
}) {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const [cursorType, setCursorType] = useState<
    "col-resize" | "row-resize" | "auto"
  >("auto");
  const [width, setWidth] = useState<number>(originalWidth);
  const [height, setHeight] = useState<number>(originalHeight);
  const [allowResize, setAllowResize] = useState<boolean>(false);
  useEffect(() => {
    setHeight(originalHeight);
    setWidth(originalWidth);
  }, [originalHeight, originalWidth]);

  const handleMove = useCallback(
    (event: React.MouseEvent) => {
      if (refContainer.current && allowResize) {
        if (cursorType === "col-resize") {
          onResize({
            scaleWidth: event.movementX,
            scaleHeight: 0,
          });
        } else if (cursorType === "row-resize") {
          onResize({
            scaleWidth: 0,
            scaleHeight: event.movementY,
          });
        }
      } else if (refContainer.current && !allowResize && divider) {
        const { top, left } = refContainer.current.getBoundingClientRect();
        if (
          resizeMode === "vertical" &&
          Math.abs(top + divider! - event.clientY) < distance / 2
        ) {
          setCursorType("row-resize");
        } else if (
          resizeMode === "horizontal" &&
          Math.abs(left + divider! - event.clientX) < distance / 2
        ) {
          setCursorType("col-resize");
        } else {
          setCursorType("auto");
        }
      } else {
        setCursorType("auto");
        setAllowResize(false);
      }
    },
    [refContainer, allowResize, cursorType, resizeMode, onResize, divider]
  );

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (refContainer.current && divider) {
        const { left, top } = refContainer.current.getBoundingClientRect();
        if (
          Math.abs(top + divider! - event.clientY) < distance / 2 ||
          Math.abs(left + divider! - event.clientX) < distance / 2
        ) {
          setAllowResize(true);
        } else {
          setAllowResize(false);
        }
      }
    },
    [divider]
  );
  const handleMouseUp = useCallback(() => {
    setAllowResize(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAllowResize(false);
    console.log("mouseLeave");
    setCursorType("auto");
  }, []);

  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", name!);
      const image = new Image();
      image.src = MoveIcon;
      e.dataTransfer.setDragImage(image, 32, 32);
    },
    [name]
  );
  return (
    <div
      ref={refContainer}
      onMouseDown={resizeMode !== "none" ? handleMouseDown : undefined}
      onMouseUp={resizeMode !== "none" ? handleMouseUp : undefined}
      onMouseLeave={resizeMode !== "none" ? handleMouseLeave : undefined}
      onMouseMove={resizeMode !== "none" ? handleMove : undefined}
      draggable={Boolean(name)}
      onDragStart={name ? handleDrag : undefined}
      style={{
        height: height + "px",
        width: width + "px",
        boxSizing: "border-box",
        flexShrink: 0,
        cursor: cursorType,
        overflow: "hidden",
        pointerEvents: resizeMode === "none" ? "none" : "auto",
        padding: isNotRoot && resizeMode === "none" ? "12px" : "0px",
        backgroundColor:resizeMode === "none" ? "purple":"transparent",
        borderRadius:resizeMode === "none" ? "6px":"0px"
      }}
    >
      <div
        style={{
          height: "100%",
          width: "100%",
          flexDirection: display ?? "column",
          display: "flex",
          justifyContent: "space-between",
          pointerEvents:"auto"
        }}
      >
        {children}
      </div>
    </div>
  );
}

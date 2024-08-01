import React, { useCallback, useEffect, useRef, useState } from "react";
const distance: number = 20;
type ResizeCallBack = (param: {
  width: number;
  height: number;
  scaleWidth: number;
  scaleHeight: number;
}) => void;
export default function ResizeBox({
  resizeMode,
  width: originalWidth,
  height: originalHeight,
  minHeight,
  minWidth,
  maxHeight,
  maxWidth,
  onResize,
  children,
  display,
  k
}: {
  resizeMode: "bottom" | "right" | "none";
  minHeight: number;
  maxHeight: number;
  minWidth: number;
  maxWidth: number;
  height: number;
  width: number;
  onResize: ResizeCallBack;
  children: React.ReactElement;
  marginLeft?: number;
  marginBottom?: number;
  display?: "row" | "column",
  k:string
}) {
  const refContainer = useRef<HTMLDivElement | null>(null);
  const [cursorType, setCursorType] = useState<
    "col-resize" | "row-resize" | "auto"
  >("auto");
  const [width, setWidth] = useState<number>(originalWidth);
  const [height, setHeight] = useState<number>(originalHeight);
  const [allowResize, setAllowResize] = useState<boolean>(false);
  const [resizeStart, setResizeStart] = useState<"start" | "end" | "none">(
    "none"
  );
  useEffect(() => {
    setHeight(originalHeight);
    setWidth(originalWidth);
  }, [originalHeight, originalWidth]);

  const handleMove = useCallback(
    (event: React.MouseEvent) => {
      if (refContainer.current && allowResize) {
        if (cursorType === "col-resize") {
          let tempWidth = width + event.movementX;
          onResize({
            width: tempWidth > maxWidth  ? maxWidth : (tempWidth < minWidth ? minWidth : tempWidth),
            height: height,
            scaleWidth: (tempWidth > maxWidth && tempWidth < width) || (tempWidth < minWidth && tempWidth > width) || (tempWidth < maxWidth && tempWidth > minWidth) ? event.movementX : 0,
            scaleHeight: 0,
          });
        } else if (cursorType === "row-resize") {
          let tempHeight = height + event.movementY;
          onResize({
            width: width,
            height: tempHeight > maxHeight ? maxHeight : (tempHeight < minHeight ? minHeight : tempHeight),
            scaleWidth: 0,
            scaleHeight: (tempHeight > maxHeight && tempHeight < height) || (tempHeight < minHeight && tempHeight > height) || (tempHeight > minHeight && tempHeight < maxHeight) ? event.movementY : 0
          });
        }
      } else if (refContainer.current && !allowResize) {
        const {right, bottom } =
          refContainer.current.getBoundingClientRect();
        if (resizeMode === "bottom" && (bottom - event.clientY < distance && bottom - event.clientY > 0)) {
          setCursorType("row-resize");
          setResizeStart("end");
        }else if (resizeMode === "right" && (right - event.clientX < distance && right - event.clientX > 0)) {
          setCursorType("col-resize");
          setResizeStart("end")
        } else {
          setCursorType("auto");
          setResizeStart("none");
        }
      } else {
        setCursorType("auto");
        setAllowResize(false);
      }
    },
    [
      refContainer,
      width,
      allowResize,
      cursorType,
      height,
      resizeMode,
      maxHeight,
      maxWidth,
      minHeight,
      minWidth,
      resizeStart,
      onResize,
      k
    ]
  );



  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (refContainer.current) {
      const { left, right, top, bottom } =
        refContainer.current.getBoundingClientRect();
      if (
        (event.clientX - left < 10 && event.clientX - left > 0) ||
        (right - event.clientX < 10 && right - event.clientX > 0) ||
        (event.clientY - top < distance && event.clientY - top > 0) ||
        (bottom - event.clientY < distance && bottom - event.clientY > 0)
      ) {
        setAllowResize(true);
      } else {
        setAllowResize(false);
      }
    }
  }, []);
  const handleMouseUp = useCallback(() => {
    setAllowResize(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setAllowResize(false);
    setCursorType("auto");
  }, []);


  const getPadding = () => {
    switch (resizeMode) {
      case "bottom": return "0px 0px 10px 0px";
      case "right": return "0px 10px 0px 0px";
      case "none": return "0px";
    }
  }
  return (
    <div
      ref={refContainer}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMove}
      draggable={false}
      style={{
        height:height + "px",
        width:width + "px",
        cursor: cursorType,
        padding: getPadding(),
        boxSizing: "border-box",
        display: 'flex',
        flexDirection: display ?? "column",
        flexShrink: "0",
        overflow: "clip"
      }}
    >
      {children}
    </div>
  );
}

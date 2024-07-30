import React, { useCallback, useEffect, useRef, useState } from "react";
const distance: number = 10;
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
  marginLeft: ml,
  marginBottom: mb,
}: {
  resizeMode: "horizontal" | "vertical";
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
      console.log("=================>handleMove",event);
      if (refContainer.current && allowResize) {
        if (cursorType === "col-resize") {
          let tempWidth = width + event.movementX;
          if (resizeStart === "start") {
            tempWidth = width - event.movementX;
          }
          tempWidth =tempWidth > maxWidth? maxWidth: tempWidth < minWidth? minWidth: tempWidth;
          setWidth(tempWidth);
          onResize({
            width: tempWidth,
            height: height,
            scaleWidth:resizeStart === "start" ? -event.movementX : event.movementX,
            scaleHeight: 0,
          });
        } else if (cursorType === "row-resize") {
          let tempHeight = height + event.movementY;
          if (resizeStart === "start") {
            tempHeight = height - event.movementY;
          }
          tempHeight =
            tempHeight > maxHeight
              ? maxHeight
              : tempHeight < minHeight
              ? minHeight
              : tempHeight;
          setHeight(tempHeight);
          onResize({
            width: width,
            height: tempHeight,
            scaleWidth:
              resizeStart === "start" ? -event.movementY : event.movementX,
            scaleHeight: 0,
          });
        }
      } else if (refContainer.current && !allowResize) {
        const { left, right, top, bottom } =
          refContainer.current.getBoundingClientRect();
        if (
          resizeMode === "horizontal" &&
          ((event.clientX - left < distance && event.clientX - left > 0) ||
            (right - event.clientX < distance && right - event.clientX > 0))
        ) {
          setCursorType("col-resize");
          if (event.clientX - left < distance && event.clientX - left > 0) {
            setResizeStart("start");
          } else {
            setResizeStart("end");
          }
        } else if (
          resizeMode === "vertical" &&
          ((event.clientY - top < distance && event.clientY - top > 0) ||
            (bottom - event.clientY < distance && bottom - event.clientY > 0))
        ) {
          setCursorType("row-resize");
          if (event.clientY - top < distance && event.clientY - top > 0) {
            setResizeStart("start");
          } else {
            setResizeStart("end");
          }
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
  return (
    <div
      ref={refContainer}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMove}
      draggable={false}
      style={{
        height: height + "px",
        width: width + "px",
        cursor: cursorType,
        padding: resizeMode === "horizontal" ? "0px 5px" : "5px 0px",
        marginBottom: mb ? mb + "px" : undefined,
        marginLeft: ml ? ml + "px" : undefined,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

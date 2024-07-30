import React, { useCallback } from "react";

export default function WorkItem({
  target,
  targetPanel,
  children,
}: {
  target: string;
  children: React.ReactElement;
  targetPanel: string
}) {
  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text", targetPanel);
    },
    [target, targetPanel]
  );

  return (
    <div draggable="true" onDragStart={handleDrag} style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", height: "50px", fontSize: "24px", color: "red", backgroundColor: "black", marginBottom: "20px" }}>
      {children}
    </div>
  );
}

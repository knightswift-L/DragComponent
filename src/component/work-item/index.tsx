import React, { useCallback } from "react";
export default function WorkItem({
  targetPanel,
  children,
}: {
  children: React.ReactElement;
  targetPanel: string
}) {
  const handleDrag = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", targetPanel);
      const image = new Image();
      image.src = "/assets/add.svg";
      e.dataTransfer.setDragImage(image,32,32);
    },
    [targetPanel]
  );

  return (
    <div draggable="true" onDragStart={handleDrag} style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", height: "50px", fontSize: "24px", color: "red", backgroundColor: "black", marginBottom: "20px" }}>
      {children}
    </div>
  );
}

import { RefObject,useEffect,useState } from "react";
export function useResize(ref:RefObject<HTMLElement | null>){
      const [width,setWidth] = useState<number>(0);
      const [height,setHeight] = useState<number>(0);

      useEffect(()=>{
       const handleResize = ()=>{
        if(ref.current){
            const {width,height} = ref.current!.getBoundingClientRect();
            setHeight(height);
            setWidth(width);
        }
       }

        window.addEventListener("resize",handleResize);
        handleResize();
        return ()=>{
            window.removeEventListener("resize",handleResize);
        }
      },[ref]);

      return {width,height};
}

import WorkItem from "../../component/work-item";
import Workspace from "../../component/workspace";
import "./index.css";
export default function HomePage() {
    const panels = {
        "div":()=><div style={{width:"100%",height:"100%",backgroundColor:"blue"}}><p>test</p></div>,
        "divr":()=><div style={{width:"100%",height:"100%",backgroundColor:"red"}}></div>,
        "divo":()=><div style={{width:"100%",height:"100%",backgroundColor:"orange"}}></div>
    }
  return (
    <div className="pageContainer">
      <div className="navigationBar">
        {Object.keys(panels).map((e)=><WorkItem key={e} targetPanel={e}>
         <p>{e}</p>
        </WorkItem>)}
      </div>
      <Workspace name="wokspace" panels={panels}/>
    </div>
  );
}

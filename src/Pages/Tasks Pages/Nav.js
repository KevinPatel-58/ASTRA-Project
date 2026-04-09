import { NavLink } from "react-router-dom";

export default function Nav(){
    return(
        <div className="nav">
            <NavLink to='/taskMenu' className='navlink' style={{color:"fuchsia"}}>Tasks</NavLink>
            <NavLink to='/taskMenu/reports' className='navlink' style={{color:"fuchsia"}}>Reports</NavLink>
        </div>
    )
}
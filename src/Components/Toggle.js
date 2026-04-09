import { useState } from "react";
import "./Toggle.scss";

function Toggle({ label,subLabel,checked,onChange }) {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="toggle-container">
      <div className="toggler">
        <span className="toggle-text">{label}</span>
        <div className="toggle-subLabel">{subLabel}</div>
      </div>

      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}

export default Toggle;
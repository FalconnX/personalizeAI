import React from "react";
import "./App.css";
import { Link } from "react-router-dom";

function Navigator() {
  return (
    <div className="Navigator">
      <nav className="navbar navbar-dark bg-dark">
        <ul className="nvlink" style={{ color: "white" }}>
          <Link to="/">
            <li>ObjectClassification</li>
          </Link>
          <Link to="/TextClassification">
            <li>TextClassification</li>
          </Link>
        </ul>
      </nav>
    </div>
  );
}

export default Navigator;

{
  /* <Link to="/">
<li>Home</li>
</Link> */
}

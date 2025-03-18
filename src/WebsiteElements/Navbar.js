import React from "react";
import PropTypes from "prop-types";
import HelpButton from "./HelpButton";
import logoImage from "../Images/CDProRunVis1.0.png";
import "../Css/App.css";

export default function Navbar() {
  return (
    <nav className="nav">
      <img
        src={logoImage}
        className="nav--icon"
        alt="A debugger logo"
      />
      <h3 className="nav--logo_text">Visualize your flow</h3>

      {/* Add New Project Button here */}
      <button
        className="nav--new-project-button"
        onClick={() => window.open('/new-project', '_blank')}
      >
        New Project
      </button>

      <HelpButton />
    </nav>
  );
}
import React from "react";
import PropTypes from "prop-types";
import HelpButton from "./HelpButton";
import logoImage from "../Images/CDProRunVis.png";
import "../Css/App.css";
/**
 * Represents the navigation bar at the top of the application.
 * It displays a logo, the title "Visualize your flow", a field for
 * displaying/editing the current project ID, and a HelpButton.
 *
 * Props:
 * - projectId (string): The current project ID.
 * - onProjectIdChange (function): Callback function called when the project ID changes.
 */
export default function Navbar({ projectId, onProjectIdChange }) {
  return (
    <nav className="nav">
      <img
        src={logoImage}
        className="nav--icon"
        alt="A debugger logo"
      />
      <h3 className="nav--logo_text">Visualize your flow</h3>
      {/* Project ID field */}
      <div className="nav--project-id">
        <label htmlFor="project-id-input">Project ID: </label>
        <input
          type="text"
          id="project-id-input"
          value={projectId}
          onChange={(e) => onProjectIdChange(e.target.value)}
          placeholder="Enter project ID"
        />
      </div>
      <HelpButton />
    </nav>
  );
}
Navbar.propTypes = {
  projectId: PropTypes.string.isRequired,
  onProjectIdChange: PropTypes.func.isRequired,
};

// Create a new file: WelcomeScreen.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./Css/WelcomeScreen.css";
import logoImage from "./Images/CDProRunVis.png";

function WelcomeScreen() {
  const navigate = useNavigate();

  const openProject = () => {
    navigate('/project');
  };

  const createNewProject = () => {
    window.open('/new-project', '_blank');
  };

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <img src={logoImage} alt="ProRunVis Logo" className="welcome-logo" />
        <h1>Welcome to ProRunVis</h1>
        <p>A visualization tool for understanding program control flow</p>

        <div className="welcome-buttons">
          <button className="open-button" onClick={openProject}>
            Open Project
          </button>
          <button className="new-button" onClick={createNewProject}>
            Create New Project
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeScreen;
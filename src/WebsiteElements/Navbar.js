// src/WelcomeScreen.js
import React, { useState } from "react";

export default function WelcomeScreen() {
  // For typed project ID
  const [typedProjectId, setTypedProjectId] = useState("");

  // Called when user clicks "Open Project"
  const handleOpenProject = () => {
    if (!typedProjectId) {
      alert("Please enter a project ID or choose 'New Project' instead.");
      return;
    }
    // Navigate to /?projectId=theTypedValue, same tab
    window.location.href = `/?projectId=${encodeURIComponent(typedProjectId)}`;
  };

  // Called when user clicks "New Project"
  const handleNewProject = async () => {
    // Option A: Just go to /new-project in the same tab
    // window.location.href = "/new-project";

    // Option B: Call an API to create a brand new ID, then redirect
    try {
      const resp = await fetch("/api/new-project", { method: "POST" });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }
      const data = await resp.json();
      const newId = data.projectId; // e.g. "some-uuid"
      window.location.href = `/?projectId=${encodeURIComponent(newId)}`;
    } catch (error) {
      alert("Failed to create a new project: " + error.message);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h1 style={{ marginBottom: "1rem" }}>Welcome to ProRunVis!</h1>
      <p style={{ marginBottom: "2rem" }}>
        Your code visualization tool. Please open an existing project or create a new one.
      </p>

      <div style={{ marginBottom: "1.5rem" }}>
        <input
          type="text"
          placeholder="Enter existing Project ID"
          value={typedProjectId}
          onChange={(e) => setTypedProjectId(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "16px",
            borderRadius: "4px",
            border: "1px solid #444",
            marginRight: "8px",
          }}
        />
        <button
          onClick={handleOpenProject}
          style={{
            padding: "8px 16px",
            fontSize: "16px",
            backgroundColor: "#00ffd1",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Open Project
        </button>
      </div>

      <button
        onClick={handleNewProject}
        style={{
          padding: "8px 24px",
          fontSize: "16px",
          backgroundColor: "#4CAF50",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        New Project
      </button>
    </div>
  );
}
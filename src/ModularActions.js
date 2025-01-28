import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ModularActions({ setJsonManager, projectName, onVisualize }) {
  // Instead of numeric DB IDs, we track string-based local identifiers/paths:
  const [instrumentId, setInstrumentId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [processedTracePath, setProcessedTracePath] = useState("");
  const [visualizationJson, setVisualizationJson] = useState(null);

  // 1) INSTRUMENT
  const handleInstrument = async () => {
    try {
      const response = await fetch(
        `/api/instrument?projectName=${encodeURIComponent(projectName)}&inputDir=resources/in`,
        { method: "POST" }
      );
      const idText = await response.text(); // now returns a string ID/path
      alert("Instrument ID (local): " + idText);
      setInstrumentId(idText.trim());
    } catch (error) {
      console.error("Error instrumenting project:", error);
      alert("Instrumentation failed.");
    }
  };

  // 2) TRACE
  const handleTrace = async () => {
    if (!instrumentId) return alert("No instrumentId set!");
    try {
      const response = await fetch(`/api/trace?instrumentId=${instrumentId}`, {
        method: "POST"
      });
      const idText = await response.text(); // e.g., a path to Trace.tr
      alert("Trace ID (local): " + idText);
      setTraceId(idText.trim());
    } catch (error) {
      console.error("Error running trace:", error);
      alert("Trace run failed.");
    }
  };

  // 3) PROCESS
  const handleProcess = async () => {
    if (!traceId) return alert("No traceId set!");
    try {
      const response = await fetch(`/api/process?traceId=${traceId}`, {
        method: "POST"
      });
      // The server returns the short ID (same as the traceId) if everything is OK
      const resultText = await response.text();
      alert("Processed trace stored locally under ID: " + resultText);
      // We'll store that ID in processedTracePath
      setProcessedTracePath(resultText.trim());
    } catch (error) {
      console.error("Error processing trace:", error);
      alert("Processing failed.");
    }
  };

  // 4) VISUALIZE
  const handleVisualize = async () => {
    if (!processedTracePath) {
      return alert("No processedTrace path (local ID) set!");
    }
    try {
      // Use processedTracePath as {localId}
      const localId = processedTracePath;
      const resp = await fetch(`/api/visualize/${localId}`);
      if (!resp.ok) {
        throw new Error("Failed to fetch processed trace");
      }
      const data = await resp.json(); // parse the JSON
      console.log("Parsed JSON data:", data);

      // 4A) Save to local state so we can display
      setVisualizationJson(data);

      // 4B) If the parent wants a callback
      if (onVisualize) {
        onVisualize(data);
      }

      // 4C) Dynamically import the JsonManager and load the data
      const { default: JsonManager } = await import("./Editor/JsonManager.js");
      setJsonManager(new JsonManager(data));
    } catch (error) {
      console.error("Error visualizing trace JSON:", error);
      alert("Visualization failed.");
    }
  };

  // Allows user to download the visualization JSON
  const handleDownloadJson = () => {
    if (!visualizationJson) return;
    const jsonStr = JSON.stringify(visualizationJson, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = "visualization.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "10px", backgroundColor: "#333", color: "white" }}>
      <h3>Modular Actions (Local Storage Flow)</h3>

      {/* Instrument */}
      <div>
        <button onClick={handleInstrument}>Instrument</button><br />
        Instrument ID:{" "}
        <input
          value={instrumentId}
          onChange={e => setInstrumentId(e.target.value)}
        />
      </div>

      {/* Trace */}
      <div>
        <button onClick={handleTrace}>Trace</button><br />
        Trace ID (local path):{" "}
        <input
          value={traceId}
          onChange={e => setTraceId(e.target.value)}
        />
      </div>

      {/* Process */}
      <div>
        <button onClick={handleProcess}>Process</button><br />
        Processed Trace Path (local ID):{" "}
        <input
          value={processedTracePath}
          onChange={e => setProcessedTracePath(e.target.value)}
        />
      </div>

      {/* Visualize */}
      <div>
        <button onClick={handleVisualize}>Visualize</button><br />
      </div>
    </div>
  );
}

ModularActions.propTypes = {
  setJsonManager: PropTypes.func.isRequired,
  projectName: PropTypes.string.isRequired,
  onVisualize: PropTypes.func // Not strictly required, but recommended
};

export default ModularActions;
import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ModularActions({ setJsonManager, projectName, onVisualize }) {
  // State variables
  const [instrumentId, setInstrumentId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [processedTracePath, setProcessedTracePath] = useState("");
  const [visualizationJson, setVisualizationJson] = useState(null);
  const [jbmcMethodSig, setJbmcMethodSig] = useState("SnowWhite.indexMax:([I)I");
  const [jbmcUnwind, setJbmcUnwind] = useState(5);
  const [jbmcArrayLength, setJbmcArrayLength] = useState(5);

  // 1) INSTRUMENT
  const handleInstrument = async () => {
    try {
      const response = await fetch(
        `/api/instrument?projectName=${encodeURIComponent(projectName)}&inputDir=resources/in`,
        { method: "POST" }
      );
      const idText = await response.text(); // returns a string ID/path
      alert("Instrument ID (local): " + idText);
      setInstrumentId(idText.trim());
    } catch (error) {
      console.error("Error instrumenting project:", error);
      alert("Instrumentation failed.");
    }
  };

  // 2) TRACE
  const handleTrace = async () => {
    if (!instrumentId) {
      alert("No instrumentId set!");
      return;
    }
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
    if (!traceId) {
      alert("No traceId set!");
      return;
    }
    try {
      const response = await fetch(`/api/process?traceId=${traceId}`, {
        method: "POST"
      });
      const resultText = await response.text();
      alert("Processed trace stored locally under ID: " + resultText);
      setProcessedTracePath(resultText.trim());
    } catch (error) {
      console.error("Error processing trace:", error);
      alert("Processing failed.");
    }
  };

  // 4) VISUALIZE
  const handleVisualize = async () => {
    if (!processedTracePath) {
      alert("No processedTrace path (local ID) set!");
      return;
    }
    try {
      const localId = processedTracePath;
      const resp = await fetch(`/api/visualize/${localId}`);
      if (!resp.ok) {
        throw new Error("Failed to fetch processed trace");
      }
      const data = await resp.json();
      console.log("Parsed JSON data:", data);

      // Save to local state
      setVisualizationJson(data);

      // Execute parent callback if provided
      if (onVisualize) {
        onVisualize(data);
      }

      // Dynamically import the JsonManager and load the data
      const { default: JsonManager } = await import("./Editor/JsonManager.js");
      setJsonManager(new JsonManager(data));
    } catch (error) {
      console.error("Error visualizing trace JSON:", error);
      alert("Visualization failed.");
    }
  };

  // JBMC: Run JBMC with the provided parameters
  const handleRunJBMC = async () => {
    if (!instrumentId) {
      alert("You must have an instrumentId set (the same as used for trace).");
      return;
    }
    try {
      const params = new URLSearchParams({
        instrumentId,
        methodSignature: jbmcMethodSig,
        unwind: jbmcUnwind,
        maxArray: jbmcArrayLength
      });
      const resp = await fetch(`/api/jbmc/run?${params.toString()}`, { method: 'POST' });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`JBMC run failed: ${errText}`);
      }
      alert("JBMC run succeeded! Check /api/jbmc/result/<instrumentId> or the UI below.");
    } catch (error) {
      console.error("Error running JBMC:", error);
      alert("JBMC error: " + error.message);
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

      {/* Instrument Section */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleInstrument}>Instrument</button>
        <br />
        <label>
          Instrument ID:{" "}
          <input
            type="text"
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
          />
        </label>
      </div>

      {/* JBMC Section */}
      <div style={{ marginBottom: "1rem" }}>
        <h4>JBMC</h4>
        <label>
          Instrument ID:{" "}
          <input
            type="text"
            value={instrumentId}
            onChange={(e) => setInstrumentId(e.target.value)}
            placeholder="e.g. 1234-uuid from instrumentation"
          />
        </label>
        <br />
        <label>
          Method Signature:{" "}
          <input
            type="text"
            value={jbmcMethodSig}
            onChange={(e) => setJbmcMethodSig(e.target.value)}
          />
        </label>
        <br />
        <label>
          Unwind:{" "}
          <input
            type="number"
            value={jbmcUnwind}
            onChange={(e) => setJbmcUnwind(Number(e.target.value))}
          />
        </label>
        <br />
        <label>
          Max Array Length:{" "}
          <input
            type="number"
            value={jbmcArrayLength}
            onChange={(e) => setJbmcArrayLength(Number(e.target.value))}
          />
        </label>
        <br />
        <button onClick={handleRunJBMC}>Run JBMC</button>
      </div>

      {/* Trace Section */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleTrace}>Trace</button>
        <br />
        <label>
          Trace ID (local path):{" "}
          <input
            type="text"
            value={traceId}
            onChange={(e) => setTraceId(e.target.value)}
          />
        </label>
      </div>

      {/* Process Section */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleProcess}>Process</button>
        <br />
        <label>
          Processed Trace Path (local ID):{" "}
          <input
            type="text"
            value={processedTracePath}
            onChange={(e) => setProcessedTracePath(e.target.value)}
          />
        </label>
      </div>

      {/* Visualize Section */}
      <div style={{ marginBottom: "1rem" }}>
        <button onClick={handleVisualize}>Visualize</button>
      </div>

      {/* Download Visualization JSON */}
      {visualizationJson && (
        <div style={{ marginBottom: "1rem" }}>
          <button onClick={handleDownloadJson}>Download Visualization JSON</button>
        </div>
      )}
    </div>
  );
}

ModularActions.propTypes = {
  projectName: PropTypes.string.isRequired,
  setJsonManager: PropTypes.func.isRequired,
  onVisualize: PropTypes.func,
  uploadedFiles: PropTypes.array
};

export default ModularActions;

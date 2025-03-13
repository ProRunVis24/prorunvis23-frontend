import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './WebsiteElements/CollapsibleSection';

function ModularActions({ setJsonManager, projectName, onVisualize }) {
  // State variables
  const [instrumentId, setInstrumentId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [processedTracePath, setProcessedTracePath] = useState("");
  const [visualizationJson, setVisualizationJson] = useState(null);
  const [jbmcMethodSig, setJbmcMethodSig] = useState("SnowWhite.indexMax:([I)I");
  const [jbmcUnwind, setJbmcUnwind] = useState(5);
  const [jbmcArrayLength, setJbmcArrayLength] = useState(5);

  // All your existing handler functions remain the same
  const handleInstrument = async () => {
    try {
      const response = await fetch(
        `/api/instrument?projectName=${encodeURIComponent(projectName)}&inputDir=resources/in`,
        { method: "POST" }
      );
      const idText = await response.text();
      alert("Instrument ID (local): " + idText);
      setInstrumentId(idText.trim());
    } catch (error) {
      console.error("Error instrumenting project:", error);
      alert("Instrumentation failed.");
    }
  };

  const handleTrace = async () => {
    if (!instrumentId) {
      alert("No instrumentId set!");
      return;
    }
    try {
      const response = await fetch(`/api/trace?instrumentId=${instrumentId}`, {
        method: "POST"
      });
      const idText = await response.text();
      alert("Trace ID (local): " + idText);
      setTraceId(idText.trim());
    } catch (error) {
      console.error("Error running trace:", error);
      alert("Trace run failed.");
    }
  };

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

      setVisualizationJson(data);

      if (onVisualize) {
        onVisualize(data);
      }

      const { default: JsonManager } = await import("./Editor/JsonManager.js");
      setJsonManager(new JsonManager(data));
    } catch (error) {
      console.error("Error visualizing trace JSON:", error);
      alert("Visualization failed.");
    }
  };

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
    <div className="modular-actions-container">
      {/* Instrument Section */}
      <CollapsibleSection title="Instrument & Trace" defaultOpen={true}>
        <div className="action-group">
          <button onClick={handleInstrument}>Instrument</button>
          <div className="form-group">
            <label>
              Instrument ID:{" "}
              <input
                type="text"
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="input-field"
              />
            </label>
          </div>

          <button onClick={handleTrace}>Trace</button>
          <div className="form-group">
            <label>
              Trace ID (local path):{" "}
              <input
                type="text"
                value={traceId}
                onChange={(e) => setTraceId(e.target.value)}
                className="input-field"
              />
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* JBMC Subsection */}
      <CollapsibleSection title="JBMC Parameters" defaultOpen={false}>
        <div className="action-group">
          <div className="form-group">
            <label>
              Instrument ID:{" "}
              <input
                type="text"
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                placeholder="e.g. 1234-uuid from instrumentation"
                className="input-field"
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Method Signature:{" "}
              <input
                type="text"
                value={jbmcMethodSig}
                onChange={(e) => setJbmcMethodSig(e.target.value)}
                className="input-field"
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Unwind:{" "}
              <input
                type="number"
                value={jbmcUnwind}
                onChange={(e) => setJbmcUnwind(Number(e.target.value))}
                className="input-field"
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Max Array Length:{" "}
              <input
                type="number"
                value={jbmcArrayLength}
                onChange={(e) => setJbmcArrayLength(Number(e.target.value))}
                className="input-field"
              />
            </label>
          </div>
          <button onClick={handleRunJBMC}>Run JBMC</button>
        </div>
      </CollapsibleSection>

      {/* Process & Visualize Section */}
      <CollapsibleSection title="Process & Visualize" defaultOpen={true}>
        <div className="action-group">
          <button onClick={handleProcess}>Process</button>
          <div className="form-group">
            <label>
              Processed Trace Path (local ID):{" "}
              <input
                type="text"
                value={processedTracePath}
                onChange={(e) => setProcessedTracePath(e.target.value)}
                className="input-field"
              />
            </label>
          </div>

          <button onClick={handleVisualize}>Visualize</button>

          {visualizationJson && (
            <button onClick={handleDownloadJson} className="download-button">
              Download Visualization JSON
            </button>
          )}
        </div>
      </CollapsibleSection>
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
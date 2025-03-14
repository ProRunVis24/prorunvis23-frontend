import React, { useState } from 'react';
import PropTypes from 'prop-types';

function ModularActions({ setJsonManager, projectName, onVisualize }) {
  // Local state variables, including the sole source for project ID
  const [localProjectId, setLocalProjectId] = useState("");
  const [instrumentId, setInstrumentId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [processedTracePath, setProcessedTracePath] = useState("");
  const [visualizationJson, setVisualizationJson] = useState(null);
  const [jbmcMethodSig, setJbmcMethodSig] = useState("SnowWhite.indexMax:([I)I");
  const [jbmcUnwind, setJbmcUnwind] = useState(5);
  const [jbmcArrayLength, setJbmcArrayLength] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

<<<<<<< HEAD
  // Project ID is now solely managed via local state based on user input.
  const handleProjectIdChange = (e) => {
    setLocalProjectId(e.target.value);
  };

  // Instrument: Uses the project ID from the input field.
=======
  // 1) INSTRUMENT
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleInstrument = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before instrumenting");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/instrument?projectName=${encodeURIComponent(projectName)}&projectId=${encodeURIComponent(localProjectId)}`,
        { method: "POST" }
      );
<<<<<<< HEAD
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Instrumentation failed: ${errorText}`);
      }
      const idText = await response.text();
=======
      const idText = await response.text(); // returns a string ID/path
      alert("Instrument ID (local): " + idText);
>>>>>>> parent of edf9068 (Collapsible sections optimized)
      setInstrumentId(idText.trim());
      alert("Instrument ID: " + idText);
    } catch (error) {
      alert("Instrumentation failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Trace: Reads the project ID from the local input.
=======
  // 2) TRACE
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleTrace = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before tracing");
      return;
    }
    if (!instrumentId) {
      alert("No instrumentId set! Please instrument first or enter an ID manually.");
      return;
    }
    setIsLoading(true);
    try {
<<<<<<< HEAD
      const response = await fetch(
        `/api/trace?instrumentId=${encodeURIComponent(instrumentId)}&projectId=${encodeURIComponent(localProjectId)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Trace run failed: ${errorText}`);
      }
      const idText = await response.text();
=======
      const response = await fetch(`/api/trace?instrumentId=${instrumentId}`, {
        method: "POST"
      });
      const idText = await response.text(); // e.g., a path to Trace.tr
      alert("Trace ID (local): " + idText);
>>>>>>> parent of edf9068 (Collapsible sections optimized)
      setTraceId(idText.trim());
      alert("Trace ID: " + idText);
    } catch (error) {
      alert("Trace run failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Process: Uses the same local project ID.
=======
  // 3) PROCESS
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleProcess = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before processing");
      return;
    }
    if (!traceId) {
      alert("No traceId set! Please run trace first or enter an ID manually.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/process?traceId=${encodeURIComponent(traceId)}&projectId=${encodeURIComponent(localProjectId)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed: ${errorText}`);
      }
      const resultText = await response.text();
      setProcessedTracePath(resultText.trim());
      alert("Processed trace stored locally under ID: " + resultText);
    } catch (error) {
      alert("Processing failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Visualize: Again, the request uses the project ID from the input.
=======
  // 4) VISUALIZE
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleVisualize = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before visualizing");
      return;
    }
    if (!processedTracePath) {
      alert("No processedTrace path (local ID) set! Please process first or enter an ID manually.");
      return;
    }
    setIsLoading(true);
    try {
      const resp = await fetch(
        `/api/visualize/${encodeURIComponent(processedTracePath)}?projectId=${encodeURIComponent(localProjectId)}`
      );
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Visualization failed: ${errorText}`);
      }
      const data = await resp.json();
<<<<<<< HEAD
      setVisualizationJson(data);
      if (onVisualize) {
        onVisualize(data);
      }
=======
      console.log("Parsed JSON data:", data);

      // Save to local state
      setVisualizationJson(data);

      // Execute parent callback if provided
      if (onVisualize) {
        onVisualize(data);
      }

      // Dynamically import the JsonManager and load the data
>>>>>>> parent of edf9068 (Collapsible sections optimized)
      const { default: JsonManager } = await import("./Editor/JsonManager.js");
      setJsonManager(new JsonManager(data));
    } catch (error) {
      alert("Visualization failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Run JBMC: Uses the project ID from the input field.
=======
  // JBMC: Run JBMC with the provided parameters
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleRunJBMC = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before running JBMC");
      return;
    }
    if (!instrumentId) {
      alert("You must have an instrumentId set (the same as used for trace).");
      return;
    }
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        instrumentId: instrumentId,
        methodSignature: jbmcMethodSig,
        unwind: jbmcUnwind,
        maxArray: jbmcArrayLength,
        projectId: localProjectId
      });
      const resp = await fetch(`/api/jbmc/run?${params.toString()}`, { method: 'POST' });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`JBMC run failed: ${errText}`);
      }
      alert("JBMC run succeeded! Check /api/jbmc/result/<instrumentId> or the UI below.");
    } catch (error) {
      alert("JBMC error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

<<<<<<< HEAD
  // Download visualization JSON
=======
  // Allows user to download the visualization JSON
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  const handleDownloadJson = () => {
    if (!visualizationJson) return;
    const jsonStr = JSON.stringify(visualizationJson, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visualization-project-${localProjectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
<<<<<<< HEAD
    <div className="modular-actions-container">
      {/* Project ID input field */}
      <div className="form-group project-id-form-group">
        <label>
          Project ID:
          <input
            type="text"
            value={localProjectId}
            onChange={handleProjectIdChange}
            placeholder="Enter project ID"
            className="input-field project-id-field"
            disabled={isLoading}
          />
        </label>
        <button
          onClick={() => window.open('/new-project', '_blank')}
          className="small-button"
          disabled={isLoading}
        >
          New Project
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="loading-indicator">
          Processing request...
        </div>
      )}

      {/* Instrument & Trace Section */}
      <CollapsibleSection title="Instrument & Trace" defaultOpen={false}>
        <div className="action-group">
          <button onClick={handleInstrument} disabled={isLoading}>Instrument</button>
          <div className="form-group">
            <label>
              Instrument ID:
              <input
                type="text"
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <button onClick={handleTrace} disabled={isLoading}>Trace</button>
          <div className="form-group">
            <label>
              Trace ID (local path):
              <input
                type="text"
                value={traceId}
                onChange={(e) => setTraceId(e.target.value)}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
        </div>
      </CollapsibleSection>

      {/* JBMC Parameters Section */}
      <CollapsibleSection title="JBMC Parameters" defaultOpen={false}>
        <div className="action-group">
          <div className="form-group">
            <label>
              Instrument ID:
              <input
                type="text"
                value={instrumentId}
                onChange={(e) => setInstrumentId(e.target.value)}
                placeholder="e.g. 1234-uuid from instrumentation"
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Method Signature:
              <input
                type="text"
                value={jbmcMethodSig}
                onChange={(e) => setJbmcMethodSig(e.target.value)}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Unwind:
              <input
                type="number"
                value={jbmcUnwind}
                onChange={(e) => setJbmcUnwind(Number(e.target.value))}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              Max Array Length:
              <input
                type="number"
                value={jbmcArrayLength}
                onChange={(e) => setJbmcArrayLength(Number(e.target.value))}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <button onClick={handleRunJBMC} disabled={isLoading}>Run JBMC</button>
        </div>
      </CollapsibleSection>

      {/* Process & Visualize Section */}
      <CollapsibleSection title="Process & Visualize" defaultOpen={false}>
        <div className="action-group">
          <button onClick={handleProcess} disabled={isLoading}>Process</button>
          <div className="form-group">
            <label>
              Processed Trace Path (local ID):
              <input
                type="text"
                value={processedTracePath}
                onChange={(e) => setProcessedTracePath(e.target.value)}
                className="input-field"
                disabled={isLoading}
              />
            </label>
          </div>
          <button onClick={handleVisualize} disabled={isLoading}>Visualize</button>
          {visualizationJson && (
            <button onClick={handleDownloadJson} className="download-button" disabled={isLoading}>
              Download Visualization JSON
            </button>
          )}
        </div>
      </CollapsibleSection>
=======
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
>>>>>>> parent of edf9068 (Collapsible sections optimized)
    </div>
  );
}

ModularActions.propTypes = {
  projectName: PropTypes.string.isRequired,
  setJsonManager: PropTypes.func.isRequired,
  onVisualize: PropTypes.func,
};

export default ModularActions;

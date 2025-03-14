import React, { useState } from 'react';
import PropTypes from 'prop-types';
import CollapsibleSection from './WebsiteElements/CollapsibleSection';
function ModularActions({ setJsonManager, projectName, projectId, setProjectId, onVisualize, uploadedFiles }) {
  // State variables
  const [instrumentId, setInstrumentId] = useState("");
  const [traceId, setTraceId] = useState("");
  const [processedTracePath, setProcessedTracePath] = useState("");
  const [visualizationJson, setVisualizationJson] = useState(null);
  const [jbmcMethodSig, setJbmcMethodSig] = useState("SnowWhite.indexMax:([I)I");
  const [jbmcUnwind, setJbmcUnwind] = useState(5);
  const [jbmcArrayLength, setJbmcArrayLength] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  // Project ID can be updated directly in ModularActions too
  const [localProjectId, setLocalProjectId] = useState(projectId);
  // Update local state when parent prop changes
  React.useEffect(() => {
    setLocalProjectId(projectId);
  }, [projectId]);
  // Update parent when local state changes
  const handleProjectIdChange = (e) => {
    const newProjectId = e.target.value;
    setLocalProjectId(newProjectId);
    if (setProjectId) {
      setProjectId(newProjectId);
    }
  };
  // Instrument code with project ID support
  const handleInstrument = async () => {
    if (!localProjectId) {
      alert("Please enter a Project ID before instrumenting");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/instrument?projectName=${encodeURIComponent(projectName)}&projectId=${localProjectId}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Instrumentation failed: ${errorText}`);
      }
      const idText = await response.text();
      console.log(`Instrumentation successful for project ${localProjectId}, received ID: ${idText}`);
      setInstrumentId(idText.trim());
      alert("Instrument ID: " + idText);
    } catch (error) {
      console.error("Error instrumenting project:", error);
      alert("Instrumentation failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Trace code with project ID support
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
      const response = await fetch(`/api/trace?instrumentId=${instrumentId}&projectId=${localProjectId}`, {
        method: "POST"
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Trace run failed: ${errorText}`);
      }
      const idText = await response.text();
      console.log(`Trace successful for project ${localProjectId}, received ID: ${idText}`);
      setTraceId(idText.trim());
      alert("Trace ID: " + idText);
    } catch (error) {
      console.error("Error running trace:", error);
      alert("Trace run failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Process trace with project ID support
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
      const response = await fetch(`/api/process?traceId=${traceId}&projectId=${localProjectId}`, {
        method: "POST"
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Processing failed: ${errorText}`);
      }
      const resultText = await response.text();
      console.log(`Processing successful for project ${localProjectId}, received ID: ${resultText}`);
      setProcessedTracePath(resultText.trim());
      alert("Processed trace stored locally under ID: " + resultText);
    } catch (error) {
      console.error("Error processing trace:", error);
      alert("Processing failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Visualize trace with project ID support
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
      const localId = processedTracePath;
      const resp = await fetch(`/api/visualize/${localId}?projectId=${localProjectId}`);
      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Visualization failed: ${errorText}`);
      }
      const data = await resp.json();
      console.log(`Visualization successful for project ${localProjectId}, received data:`, data);
      setVisualizationJson(data);
      if (onVisualize) {
        onVisualize(data);
      }
      const { default: JsonManager } = await import("./Editor/JsonManager.js");
      setJsonManager(new JsonManager(data));
    } catch (error) {
      console.error("Error visualizing trace JSON:", error);
      alert("Visualization failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Run JBMC with project ID support
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
        instrumentId,
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
      console.log(`JBMC run successful for project ${localProjectId}`);
      alert("JBMC run succeeded! Check /api/jbmc/result/<instrumentId> or the UI below.");
    } catch (error) {
      console.error("Error running JBMC:", error);
      alert("JBMC error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };
  // Download visualization JSON
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
      {/* Instrument Section */}
      <CollapsibleSection title="Instrument & Trace" defaultOpen={true}>
        <div className="action-group">
          <button onClick={handleInstrument} disabled={isLoading}>Instrument</button>
          <div className="form-group">
            <label>
              Instrument ID:{" "}
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
              Trace ID (local path):{" "}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </label>
          </div>
          <button onClick={handleRunJBMC} disabled={isLoading}>Run JBMC</button>
        </div>
      </CollapsibleSection>
      {/* Process & Visualize Section */}
      <CollapsibleSection title="Process & Visualize" defaultOpen={true}>
        <div className="action-group">
          <button onClick={handleProcess} disabled={isLoading}>Process</button>
          <div className="form-group">
            <label>
              Processed Trace Path (local ID):{" "}
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
    </div>
  );
}
ModularActions.propTypes = {
  projectName: PropTypes.string.isRequired,
  projectId: PropTypes.string,
  setProjectId: PropTypes.func,
  setJsonManager: PropTypes.func.isRequired,
  onVisualize: PropTypes.func,
  uploadedFiles: PropTypes.array
};
export default ModularActions;

// src/WebsiteContainer.jsx
import React, { useState } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodTreeView from "./WebsiteElements/MethodTreeView";
import JBMCResultTable from "./WebsiteElements/JBMCResultTable";
import "./Css/App.css";

function WebsiteContainer() {
  // Basic states for file management, JSON data and visualization
  const [displayedFile, setDisplayedFile] = useState(null);
  const [activeFile, setActiveFile] = useState(null);
  const [jsonManager, setJsonManager] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [visualizationJson, setVisualizationJson] = useState(null);
  const [staticMethodsJson, setStaticMethodsJson] = useState(null);
  const [activeFunctionIndex, setActiveFunctionIndex] = useState(1);
  const [viewerMode, setViewerMode] = useState("JSON");
  const [traceNodeToHighlight, setTraceNodeToHighlight] = useState(null);
  const [hoveredTraceId, setHoveredTraceId] = useState(null);
  const [activeIterationIndices, setActiveIterationIndices] = useState([]);

  // Additional states for JBMC integration
  const [jbmcJson, setJbmcJson] = useState(null);
  const [instrumentId, setInstrumentId] = useState("");

  // Sets both 'displayedFile' and 'activeFile' based on file path
  function setActiveAndDisplayed(path) {
    uploadedFiles.forEach((uploadedFile) => {
      if (path === uploadedFile.webkitRelativePath) {
        setDisplayedFile(uploadedFile);
        setActiveFile(uploadedFile);
      }
    });
  }

  function setDisplayedToActive() {
    setDisplayedFile(activeFile);
  }

  function isActiveDisplayed() {
    return activeFile && displayedFile ? activeFile === displayedFile : false;
  }

  async function passOnUploadedFiles(files) {
    setUploadedFiles(files);
    await fetch("/api/upload", {
      method: "POST",
      body: new FormData(document.getElementById("upload-form")),
    });
  }

  function highlightTraceNodeInEditor(node) {
    console.log("Highlighting trace node:", node);
    setTraceNodeToHighlight(node);
  }

  function handleHoverTraceId(traceId) {
    setHoveredTraceId(traceId);
  }

  async function fetchStaticMethods() {
    try {
      const response = await fetch("/api/static-methods");
      const data = await response.json();
      setStaticMethodsJson(data);
    } catch (error) {
      console.error("Error fetching static methods:", error);
    }
  }

  async function handleFetchJBMC() {
    if (!instrumentId) {
      alert("Please enter an instrument ID");
      return;
    }
    try {
      const resp = await fetch(`/api/jbmc/result/${instrumentId}`);
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err);
      }
      const data = await resp.json();
      console.log("Fetched JBMC JSON:", data);
      setJbmcJson(data);
      setViewerMode("JBMC");
    } catch (error) {
      console.error("Error fetching JBMC result:", error);
      alert("Could not fetch JBMC JSON: " + error.message);
    }
  }

  console.log("[WebsiteContainer] viewerMode =", viewerMode);
  console.log("[WebsiteContainer] jsonManager =", jsonManager);
  console.log("[WebsiteContainer] visualizationJson =", visualizationJson);

  return (
    <div className="content">
      {/* LEFT COLUMN: Directory */}
      <div className="left-container">
        <DirectoryBar
          setDisplayedFile={setDisplayedFile}
          setDisplayedToActive={setDisplayedToActive}
          passOnUploadedFiles={passOnUploadedFiles}
          passOnJsonData={(jsonData) => {
            console.log("JSON from DirectoryBar:", jsonData);
            setJsonManager(new JsonManager(jsonData));
          }}
        />
      </div>

      {/* MIDDLE COLUMN: Control Panel */}
      <div className="middle-container">
        {/* JBMC Section */}
        <div className="jbmc-section" style={{ margin: "10px", padding: "10px", backgroundColor: "#333", color: "#fff", borderRadius: "4px", overflowY: "auto", maxHeight: "300px" }}>
          <div>
            <button onClick={() => setViewerMode("JSON")}>Show Normal JSON</button>
            <button onClick={() => setViewerMode("JBMC")}>Show JBMC JSON</button>
            <input
              placeholder="Instrument ID"
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
            />
            <button onClick={handleFetchJBMC}>Fetch JBMC Output</button>
          </div>
          {viewerMode === "JBMC" && (
            <JBMCResultTable instrumentId={instrumentId} />
          )}
        </div>

        {/* Modular Actions Section */}
        <div className="modular-actions-section">
          <ModularActions
            projectName="MyProject"
            setJsonManager={(newManager) => {
              console.log("setJsonManager called:", newManager);
              setJsonManager(newManager);
            }}
            onVisualize={(json) => {
              console.log("Visualization JSON received:", json);
              setVisualizationJson(json);
            }}
            uploadedFiles={uploadedFiles}
          />
        </div>

        {/* JSON Viewer Section with Tabs */}
        <div className="json-viewer-section">
          <div className="tab-buttons" style={{ display: "flex", gap: "10px", margin: "10px" }}>
            <button onClick={() => setViewerMode("JSON")}>JSON</button>
            <button onClick={() => setViewerMode("METHOD")}>Methods</button>
            <button onClick={() => setViewerMode("TRACE")}>Trace</button>
            <button onClick={() => { setViewerMode("STATIC"); fetchStaticMethods(); }}>
              Static Methods
            </button>
          </div>
          {viewerMode === "JSON" && visualizationJson && (
            <JsonViewer
              jsonData={visualizationJson}
              onElementClick={(updated) =>
                console.log("JSON element clicked:", updated)
              }
            />
          )}
          {viewerMode === "METHOD" && jsonManager && (
            <MethodTreeView
              jsonManager={jsonManager}
              onSelectMethod={(nodeIndex) => {
                if (!jsonManager || !jsonManager.nodes[nodeIndex]) return;
                const methodNode = jsonManager.nodes[nodeIndex];
                if (methodNode.link && methodNode.link.file) {
                  setActiveAndDisplayed(methodNode.link.file);
                }
                setActiveFunctionIndex(nodeIndex);
                const initIters = jsonManager.initIterations(nodeIndex, []);
                setActiveIterationIndices(initIters);
              }}
              className="method-view-section"
            />
          )}
          {viewerMode === "TRACE" && jsonManager && (
            <TraceTree
              nodes={jsonManager.nodes}
              onSelectTraceNode={(node) => {
                if (node.link && node.link.file) {
                  setActiveAndDisplayed(node.link.file);
                }
                highlightTraceNodeInEditor(node);
              }}
              hoveredTraceId={hoveredTraceId}
            />
          )}
          {viewerMode === "STATIC" && staticMethodsJson && (
            <JsonViewer
              jsonData={staticMethodsJson}
              onElementClick={(updated) =>
                console.log("Static methods JSON clicked:", updated)
              }
            />
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Editor */}
      <div className="right-container">
        <EditorManager
          displayedFile={displayedFile}
          setActiveAndDisplayed={setActiveAndDisplayed}
          isActiveDisplayed={isActiveDisplayed}
          jsonManager={jsonManager}
          activeFunctionIndex={activeFunctionIndex}
          setActiveFunctionIndex={setActiveFunctionIndex}
          traceNodeToHighlight={traceNodeToHighlight}
          setTraceNodeToHighlight={setTraceNodeToHighlight}
          onHoverTraceId={handleHoverTraceId}
          activeIterationIndices={activeIterationIndices}
          setActiveIterationIndices={setActiveIterationIndices}
        />
      </div>
    </div>
  );
}

export default WebsiteContainer;
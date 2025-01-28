import React, { useState } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodView from "./WebsiteElements/MethodView";
import "./Css/App.css";

function WebsiteContainer() {
  const [displayedFile, setDisplayedFile] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  const [jsonManager, setJsonManager] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [visualizationJson, setVisualizationJson] = useState(null);

  // Keep track of which function index is "active"
  const [activeFunctionIndex, setActiveFunctionIndex] = useState(1);

  // Toggle display among JSON, METHOD, or TRACE
  const [viewerMode, setViewerMode] = useState("JSON");

  // For highlighting a selected node from the trace
  const [traceNodeToHighlight, setTraceNodeToHighlight] = useState(null);

  // For highlighting a hovered node in the trace tree (the "reverse" approach)
  const [hoveredTraceId, setHoveredTraceId] = useState(null);
   const [activeIterationIndices, setActiveIterationIndices] = useState([]);
  /** Sets both 'displayedFile' and 'activeFile' to the file that matches the given path. */
  function setActiveAndDisplayed(path) {
    uploadedFiles.forEach((uploadedFile) => {
      if (path === uploadedFile.webkitRelativePath) {
        setDisplayedFile(uploadedFile);
        setActiveFile(uploadedFile);
      }
    });
  }

  /** Displays the current active file in the editor (if any). */
  function setDisplayedToActive() {
    setDisplayedFile(activeFile);
  }

  /** Checks if the file currently displayed is the same as the 'active' file. */
  function isActiveDisplayed() {
    if (!activeFile || !displayedFile) return false;
    return activeFile === displayedFile;
  }

  /** Receives the files from the folder upload (DirectoryBar), optionally uploads them to the server, and stores them. */
  async function passOnUploadedFiles(files) {
    setUploadedFiles(files);
    // Optional: also upload them to the server
    await fetch("/api/upload", {
      method: "POST",
      body: new FormData(document.getElementById("upload-form")),
    });
  }

  /** Called when user clicks a trace node in TraceTree => highlight in Editor. */
  function highlightTraceNodeInEditor(node) {
    console.log("highlightTraceNodeInEditor called with node:", node);
    setTraceNodeToHighlight(node);
  }

  /** Called from EditorManager when user hovers code => highlight in TraceTree. */
  function handleHoverTraceId(traceId) {
    // E.g. if multiple, pick one or store them all.
    console.log("WebsiteContainer: hovered trace ID in editor =>", traceId);
    setHoveredTraceId(traceId);
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
            console.log("[WebsiteContainer] JSON from DirectoryBar:", jsonData);
            setJsonManager(new JsonManager(jsonData));
          }}
        />
      </div>

      {/* MIDDLE COLUMN: Modular Actions (top) + JSON/Method/Trace (bottom) */}
      <div className="middle-container">
        <div className="modular-actions-section">
          <ModularActions
            projectName="MyProject"
            setJsonManager={(newManager) => {
              console.log("[WebsiteContainer] setJsonManager called:", newManager);
              setJsonManager(newManager);
            }}
            onVisualize={(json) => {
              console.log("[WebsiteContainer] onVisualize - got JSON:", json);
              setVisualizationJson(json);
            }}
            uploadedFiles={uploadedFiles}
          />
        </div>

        <div className="json-viewer-section">
          {/* Tab-like buttons */}
          <div style={{ display: "flex", gap: "10px", margin: "10px" }}>
            <button onClick={() => setViewerMode("JSON")}>JSON</button>
            <button onClick={() => setViewerMode("METHOD")}>Methods</button>
            <button onClick={() => setViewerMode("TRACE")}>Trace</button>
          </div>

          {/* Render JSON viewer if selected */}
          {viewerMode === "JSON" && visualizationJson && (
            <JsonViewer
              jsonData={visualizationJson}
              onElementClick={(updated) => {
                console.log("JSON updated/clicked:", updated);
              }}
            />
          )}

          {/* Render MethodView if selected */}
          {viewerMode === "METHOD" && jsonManager && (
            <MethodView
              jsonManager={jsonManager}
              onSelectMethod={(nodeIndex) => {
                if (!jsonManager || !jsonManager.nodes[nodeIndex]) return;
                const methodNode = jsonManager.nodes[nodeIndex];

                // Switch to file
                setActiveAndDisplayed(methodNode.link.file);
                // Mark this function as active
                setActiveFunctionIndex(nodeIndex);
                console.log("User picked methodNode #", nodeIndex, methodNode);
                // 1) Re-initialize iteration indices for that new method
                  const initIters = jsonManager.initIterations(nodeIndex, []);
                  setActiveIterationIndices(initIters);
              }}
              className="method-view-section"
            />
          )}

          {/* Render TraceTree if selected */}
          {viewerMode === "TRACE" && jsonManager && (
            <TraceTree
              nodes={jsonManager.nodes}
              onSelectTraceNode={(node) => {
                // If the code is in a different file, switch to that file first
                if (node.link && node.link.file) {
                  setActiveAndDisplayed(node.link.file);
                }
                // Then highlight in the editor
                highlightTraceNodeInEditor(node);
              }}
              hoveredTraceId={hoveredTraceId}
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
          // Pass highlight states
          traceNodeToHighlight={traceNodeToHighlight}
          setTraceNodeToHighlight={setTraceNodeToHighlight}
          // Pass in callback for code->trace highlighting
          activeIterationIndices={activeIterationIndices}
          setActiveIterationIndices={setActiveIterationIndices}
          onHoverTraceId={handleHoverTraceId}
        />
      </div>
    </div>
  );
}

export default WebsiteContainer;
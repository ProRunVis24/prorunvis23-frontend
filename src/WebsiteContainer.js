import React, { useState, useEffect } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodTreeView from "./WebsiteElements/MethodTreeView";
import CollapsibleSection from "./WebsiteElements/CollapsibleSection"; // Import the new component
import MergedAssignmentsTable from "./WebsiteElements/MergedAssignmentsTable";
import "./Css/App.css";

function WebsiteContainer() {
  // Existing states remain the same
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
  const [selectedVariable, setSelectedVariable] = useState(null);
  const [jbmcJson, setJbmcJson] = useState(null);
  const [instrumentId, setInstrumentId] = useState("");

  // New state for middle container collapse
  const [isMiddleContainerCollapsed, setIsMiddleContainerCollapsed] = useState(false);

  // All your existing functions remain the same
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
    console.log("highlightTraceNodeInEditor called with node:", node);
    setTraceNodeToHighlight(node);
  }

  function handleHoverTraceId(traceId) {
    console.log("WebsiteContainer: hovered trace ID in editor =>", traceId);
    setHoveredTraceId(traceId);
  }

  function handleLineClick(fileName, line) {
    console.log(`Line clicked: file=${fileName}, line=${line}`);
    fetch(`/api/varMapping?file=${encodeURIComponent(fileName)}&line=${line}`)
      .then((res) => res.json())
      .then((variableNames) => {
        if (variableNames && variableNames.length > 0) {
          setSelectedVariable(variableNames[0]);
          console.log("Selected variable:", variableNames[0]);
        } else {
          setSelectedVariable(null);
          console.log("No variables declared on this line.");
        }
      })
      .catch((err) => {
        console.error("Error fetching variable mapping:", err);
        setSelectedVariable(null);
      });
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

  function handleJsonData(jsonData) {
    try {
      if (!jsonData) {
        console.warn("Received null/undefined JSON data");
        return;
      }
      console.log("Initializing JsonManager with:", jsonData);
      setJsonManager(new JsonManager(jsonData));
    } catch (error) {
      console.error("Error initializing JsonManager:", error);
      alert("Failed to process JSON data: " + error.message);
    }
  }

  async function handleFetchJBMC() {
    if (!instrumentId) {
      alert("Please enter instrument ID");
      return;
    }
    try {
      const resp = await fetch(`/api/jbmc/result/${instrumentId}`);
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err);
      }
      const data = await resp.json();
      setJbmcJson(data);
      setViewerMode("JBMC");
    } catch (error) {
      console.error("Error fetching JBMC result:", error);
      alert("Could not fetch JBMC JSON: " + error.message);
    }
  }

  // Toggle middle container collapsed state
  const toggleMiddleContainer = () => {
    setIsMiddleContainerCollapsed(!isMiddleContainerCollapsed);
  };

  return (
    <div className="content">
      {/* LEFT COLUMN: Directory */}
      <DirectoryBar
        setDisplayedFile={setDisplayedFile}
        setDisplayedToActive={setDisplayedToActive}
        passOnUploadedFiles={passOnUploadedFiles}
        passOnJsonData={(jsonData) => {
          console.log("[WebsiteContainer] JSON from DirectoryBar:", jsonData);
          setJsonManager(new JsonManager(jsonData));
        }}
      />

      {/* MIDDLE COLUMN with collapsible sections */}
      <div className={`middle-container ${isMiddleContainerCollapsed ? 'collapsed' : ''}`}>
        <button
          className="middle-container-toggle"
          onClick={toggleMiddleContainer}
        >
          {isMiddleContainerCollapsed ? '►' : '◄'}
        </button>

        {!isMiddleContainerCollapsed && (
          <>
            {/* JBMC Section as a separate collapsible section */}
            <CollapsibleSection title="JBMC Controls" defaultOpen={false}>
              <div>
                <input
                  placeholder="Instrument ID"
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  className="input-field"
                />
                <button onClick={handleFetchJBMC}>Fetch JBMC Output</button>
                <div className="button-group">
                  <button onClick={() => setViewerMode("JSON")}>Show Normal JSON</button>
                  <button onClick={() => setViewerMode("JBMC")}>Show JBMC JSON</button>
                </div>
              </div>

              {viewerMode === "JBMC" && jbmcJson && (
                <JsonViewer
                  jsonData={jbmcJson}
                  onElementClick={(updated) => console.log("JBMC JSON clicked:", updated)}
                />
              )}

              {instrumentId && (
                <div style={{ marginTop: "10px" }}>
                  <MergedAssignmentsTable
                    traceId={instrumentId}
                    selectedVariable={selectedVariable}
                  />
                </div>
              )}
            </CollapsibleSection>

            {/* Modular Actions Section */}
            <CollapsibleSection title="Modular Actions" defaultOpen={true}>
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
            </CollapsibleSection>

            {/* JSON Viewer Section with Tab Buttons */}
            <CollapsibleSection title="Visualization Output" defaultOpen={true}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button
                  className={viewerMode === "JSON" ? "active-tab" : ""}
                  onClick={() => setViewerMode("JSON")}
                >
                  JSON
                </button>
                <button
                  className={viewerMode === "METHOD" ? "active-tab" : ""}
                  onClick={() => setViewerMode("METHOD")}
                >
                  Methods
                </button>
                <button
                  className={viewerMode === "TRACE" ? "active-tab" : ""}
                  onClick={() => setViewerMode("TRACE")}
                >
                  Trace
                </button>
                <button
                  className={viewerMode === "STATIC" ? "active-tab" : ""}
                  onClick={() => {
                    setViewerMode("STATIC");
                    fetchStaticMethods();
                  }}
                >
                  Static Methods
                </button>
              </div>

              {viewerMode === "JSON" && visualizationJson && (
                <JsonViewer
                  jsonData={visualizationJson}
                  onElementClick={(updated) => console.log("JSON updated/clicked:", updated)}
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
                    console.log("User picked methodNode #", nodeIndex, methodNode);
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
                  onElementClick={(updated) => console.log("Static methods JSON updated/clicked:", updated)}
                />
              )}
            </CollapsibleSection>
          </>
        )}
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
          onLineClick={handleLineClick}
          activeIterationIndices={activeIterationIndices}
          setActiveIterationIndices={setActiveIterationIndices}
        />
      </div>
    </div>
  );
}

export default WebsiteContainer;
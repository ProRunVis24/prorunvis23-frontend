// WebsiteContainer.js
import React, { useState, useEffect } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodTreeView from "./WebsiteElements/MethodTreeView";
<<<<<<< HEAD
import CollapsibleSection from "./WebsiteElements/CollapsibleSection";
import MergedAssignmentsTable from "./WebsiteElements/MergedAssignmentsTable";
import "./Css/App.css";

function WebsiteContainer() {
  // Basic state management
=======

import MergedAssignmentsTable from "./WebsiteElements/MergedAssignmentsTable"; // Our filtered table component
import "./Css/App.css";

function WebsiteContainer() {
  // Basic states for file management, JSON data and visualization
>>>>>>> parent of edf9068 (Collapsible sections optimized)
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

  // New state for the variable selected from the editor
  const [selectedVariable, setSelectedVariable] = useState(null);

  // Additional states for JBMC integration
  const [jbmcJson, setJbmcJson] = useState(null);
  const [instrumentId, setInstrumentId] = useState("");
<<<<<<< HEAD
  const [isMiddleContainerCollapsed, setIsMiddleContainerCollapsed] = useState(false);

  // Project ID state used for file upload and variable mapping in DirectoryBar
  const [projectId, setProjectId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("projectId") || "";
  });

  // On mount, check URL for an existing projectId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get("projectId");
    if (urlProjectId) {
      setProjectId(urlProjectId);
      console.log(`Using Project ID from URL: ${urlProjectId}`);
    }
  }, []);

  // Whenever projectId changes, update the URL for consistency
  useEffect(() => {
    if (projectId) {
      const url = new URL(window.location);
      url.searchParams.set("projectId", projectId);
      window.history.pushState({}, "", url);
    }
  }, [projectId]);

  // Helper: Switch displayed file to match a given path
=======

  /** Sets both 'displayedFile' and 'activeFile' to the file that matches the given path. */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  function setActiveAndDisplayed(path) {
    uploadedFiles.forEach((file) => {
      if (path === file.webkitRelativePath) {
        setDisplayedFile(file);
        setActiveFile(file);
      }
    });
  }
<<<<<<< HEAD
  function setDisplayedToActive() {
    setDisplayedFile(activeFile);
  }
=======

  /** Displays the current active file in the editor (if any). */
  function setDisplayedToActive() {
    setDisplayedFile(activeFile);
  }

  /** Checks if the file currently displayed is the same as the 'active' file. */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  function isActiveDisplayed() {
    return activeFile && displayedFile ? activeFile === displayedFile : false;
  }

<<<<<<< HEAD
  // Called by DirectoryBar after user picks a folder
=======
  /**
   * Receives the files from the folder upload (DirectoryBar) and optionally uploads them.
   */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  async function passOnUploadedFiles(files) {
    setUploadedFiles(files);

    if (!projectId) {
      alert("Please enter a Project ID before uploading files");
      return;
    }
    const formData = new FormData(document.getElementById("upload-form"));
    formData.append("projectId", projectId);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      console.log("Files uploaded successfully for project:", projectId);
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
    }
  }

<<<<<<< HEAD
  // Called if we want to highlight a specific trace node in the editor
=======
  /** Called when the user clicks a trace node in TraceTree to highlight in the editor. */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  function highlightTraceNodeInEditor(node) {
    console.log("Highlighting trace node in editor:", node);
    setTraceNodeToHighlight(node);
  }

<<<<<<< HEAD
  // Hover callback from the Editor
=======
  /** Called from EditorManager when the user hovers code to highlight in the TraceTree. */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  function handleHoverTraceId(traceId) {
    setHoveredTraceId(traceId);
  }

<<<<<<< HEAD
  // If user clicks a line in the Editor, fetch variable mappings from that line
=======
  /**
   * NEW: Called when the user clicks on a line in the editor.
   * It uses the new backend endpoint to fetch variable declarations for that line.
   */
>>>>>>> parent of edf9068 (Collapsible sections optimized)
  function handleLineClick(fileName, line) {
    console.log(`Line clicked => file: ${fileName}, line: ${line}`);
    if (!projectId) {
      console.error("No projectId set for variable mapping!");
      return;
    }
    fetch(`/api/varMapping?file=${encodeURIComponent(fileName)}&line=${line}&projectId=${projectId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Variable mapping failed: ${res.status}`);
        }
        return res.json();
      })
      .then((variableNames) => {
<<<<<<< HEAD
        if (variableNames?.length > 0) {
=======
        if (variableNames && variableNames.length > 0) {
          // For simplicity, pick the first variable (or you could allow the user to choose)
>>>>>>> parent of edf9068 (Collapsible sections optimized)
          setSelectedVariable(variableNames[0]);
          console.log("Selected variable on that line:", variableNames[0]);
        } else {
          setSelectedVariable(null);
          console.log("No variable declared on that line.");
        }
      })
      .catch((err) => {
        console.error("Error fetching varMapping:", err);
        setSelectedVariable(null);
      });
  }

<<<<<<< HEAD
  // Fetch static methods from the server for the "Static Methods" view
  async function fetchStaticMethods() {
    if (!projectId) {
      alert("Please enter a Project ID first");
=======
  /** Fetches static methods JSON from the backend. */
  async function fetchStaticMethods() {
    try {
      const response = await fetch("/api/static-methods");
      const data = await response.json();
      setStaticMethodsJson(data);
    } catch (error) {
      console.error("Error fetching static methods:", error);
    }
  }

  /** Fetch JBMC result for a given instrument ID and switch the viewer to JBMC mode. */
  async function handleFetchJBMC() {
    if (!instrumentId) {
      alert("Please enter instrument ID");
>>>>>>> parent of edf9068 (Collapsible sections optimized)
      return;
    }
    try {
      const resp = await fetch(`/api/static-methods?projectId=${projectId}`);
      if (!resp.ok) {
        throw new Error(`Failed to fetch static methods: ${resp.status}`);
      }
      const data = await resp.json();
      setStaticMethodsJson(data);
    } catch (error) {
      console.error("Error fetching static methods:", error);
      alert(`Error: ${error.message}`);
    }
  }

  // If user uploads a JSON file in DirectoryBar
  function handleJsonData(jsonData) {
    if (!jsonData) return;
    try {
      console.log("Initializing JSON Manager with uploaded JSON data...");
      setJsonManager(new JsonManager(jsonData));
    } catch (err) {
      console.error("JSON parse error:", err);
      alert("Error reading JSON data: " + err.message);
    }
  }

  // JBMC result fetch
  async function handleFetchJBMC() {
    if (!instrumentId) {
      alert("Please enter instrument ID first");
      return;
    }
    if (!projectId) {
      alert("Please enter a Project ID first");
      return;
    }
    try {
      const resp = await fetch(`/api/jbmc/result/${instrumentId}?projectId=${projectId}`);
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(errText);
      }
      const data = await resp.json();
      setJbmcJson(data);
      setViewerMode("JBMC"); // Switch UI to display JBMC JSON
    } catch (error) {
      alert("Could not fetch JBMC JSON: " + error.message);
    }
  }

<<<<<<< HEAD
  // Toggle the middle container's collapsed state
  function toggleMiddleContainer() {
    setIsMiddleContainerCollapsed(!isMiddleContainerCollapsed);
  }

  // Launch a new project in a new tab
  function handleCreateNewProject() {
    window.open("/new-project", "_blank");
  }

  return (
    <div className="content">
      {/* LEFT COLUMN - DirectoryBar */}
      <DirectoryBar
        setDisplayedFile={setDisplayedFile}
        setDisplayedToActive={setDisplayedToActive}
        passOnUploadedFiles={passOnUploadedFiles}
        passOnJsonData={handleJsonData}   // If a user uploads some JSON
        projectId={projectId}            // For file upload and related actions
      />

      {/* MIDDLE COLUMN - collapsible sections */}
      <div className={`middle-container ${isMiddleContainerCollapsed ? "collapsed" : ""}`}>
        <button className="middle-container-toggle" onClick={toggleMiddleContainer}>
          {isMiddleContainerCollapsed ? "►" : "◄"}
        </button>

        {!isMiddleContainerCollapsed && (
          <>
            {/* JBMC Controls Section */}
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

              {instrumentId && projectId && (
                <div style={{ marginTop: "10px" }}>
                  <MergedAssignmentsTable
                    traceId={instrumentId}
                    projectId={projectId}
                    selectedVariable={selectedVariable}
                  />
                </div>
              )}
            </CollapsibleSection>

            {/* Modular Actions Section */}
            <CollapsibleSection title="Modular Actions" defaultOpen={true}>
              {/* Note: ModularActions now manages its own Project ID input.
                  We no longer pass projectId, setProjectId, or uploadedFiles to it. */}
              <ModularActions
                projectName="MyProject"
                setJsonManager={setJsonManager}
                onVisualize={(vizJson) => {
                  console.log("Visualization JSON loaded:", vizJson);
                  setVisualizationJson(vizJson);
                }}
=======
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

      {/* MIDDLE COLUMN: JBMC Section, Modular Actions and JSON Viewer */}
      <div className="middle-container">
        {/* JBMC Section */}
        <div className="jbmc-section" style={{ margin: "10px" }}>
          <div>
            <button onClick={() => setViewerMode("JSON")}>
              Show Normal JSON
            </button>
            <button onClick={() => setViewerMode("JBMC")}>
              Show JBMC JSON
            </button>
            <input
              placeholder="Instrument ID"
              value={instrumentId}
              onChange={(e) => setInstrumentId(e.target.value)}
            />
            <button onClick={handleFetchJBMC}>Fetch JBMC Output</button>
          </div>
          {viewerMode === "JBMC" && jbmcJson && (
            <JsonViewer
              jsonData={jbmcJson}
              onElementClick={(updated) =>
                console.log("JBMC JSON clicked:", updated)
              }
            />
          )}
          {/* Show the JBMC assignments table (filtered by selected variable if any) */}
          {instrumentId && (
            <div style={{ marginTop: "10px" }}>
              <MergedAssignmentsTable
                traceId={instrumentId}
                selectedVariable={selectedVariable}
>>>>>>> parent of edf9068 (Collapsible sections optimized)
              />
            </div>
          )}
        </div>

<<<<<<< HEAD
            {/* Visualization Output Section */}
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
                  onElementClick={(updated) => console.log("JSON viewer clicked:", updated)}
                />
              )}

              {viewerMode === "METHOD" && jsonManager && (
                <MethodTreeView
                  jsonManager={jsonManager}
                  onSelectMethod={(nodeIndex) => {
                    if (!jsonManager.nodes[nodeIndex]) return;
                    const methodNode = jsonManager.nodes[nodeIndex];
                    if (methodNode.link?.file) {
                      setActiveAndDisplayed(methodNode.link.file);
                    }
                    setActiveFunctionIndex(nodeIndex);
                    console.log("Selected method node:", nodeIndex, methodNode);
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
                    if (node.link?.file) {
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
                  onElementClick={(updated) => console.log("Static methods JSON clicked:", updated)}
                />
              )}
            </CollapsibleSection>
          </>
        )}
=======
        {/* Modular Actions Section */}
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

        {/* JSON Viewer Section with Tab Buttons */}
        <div className="json-viewer-section">
          <div style={{ display: "flex", gap: "10px", margin: "10px" }}>
            <button onClick={() => setViewerMode("JSON")}>JSON</button>
            <button onClick={() => setViewerMode("METHOD")}>Methods</button>
            <button onClick={() => setViewerMode("TRACE")}>Trace</button>
            <button
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
              onElementClick={(updated) =>
                console.log("JSON updated/clicked:", updated)
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
              onElementClick={(updated) =>
                console.log("Static methods JSON updated/clicked:", updated)
              }
            />
          )}
        </div>
>>>>>>> parent of edf9068 (Collapsible sections optimized)
      </div>

      {/* RIGHT COLUMN - Editor */}
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
          // NEW: Pass our line-click callback to the EditorManager so that when a user clicks on a line,
          // EditorManager can call it with the current file and line number.
          onLineClick={handleLineClick}
          activeIterationIndices={activeIterationIndices}
          setActiveIterationIndices={setActiveIterationIndices}
        />
      </div>
    </div>
  );
}

export default WebsiteContainer;
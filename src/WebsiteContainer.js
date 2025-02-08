import React, { useState, useEffect } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodTreeView from "./WebsiteElements/MethodTreeView";

import MergedAssignmentsTable from "./WebsiteElements/MergedAssignmentsTable"; // Our filtered table component
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

  // New state for the variable selected from the editor
  const [selectedVariable, setSelectedVariable] = useState(null);

  // Additional states for JBMC integration
  const [jbmcJson, setJbmcJson] = useState(null);
  const [instrumentId, setInstrumentId] = useState("");

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
    return activeFile && displayedFile ? activeFile === displayedFile : false;
  }

  /**
   * Receives the files from the folder upload (DirectoryBar) and optionally uploads them.
   */
  async function passOnUploadedFiles(files) {
    setUploadedFiles(files);
    await fetch("/api/upload", {
      method: "POST",
      body: new FormData(document.getElementById("upload-form")),
    });
  }

  /** Called when the user clicks a trace node in TraceTree to highlight in the editor. */
  function highlightTraceNodeInEditor(node) {
    console.log("highlightTraceNodeInEditor called with node:", node);
    setTraceNodeToHighlight(node);
  }

  /** Called from EditorManager when the user hovers code to highlight in the TraceTree. */
  function handleHoverTraceId(traceId) {
    console.log("WebsiteContainer: hovered trace ID in editor =>", traceId);
    setHoveredTraceId(traceId);
  }

  /**
   * NEW: Called when the user clicks on a line in the editor.
   * It uses the new backend endpoint to fetch variable declarations for that line.
   */
  function handleLineClick(fileName, line) {
    console.log(`Line clicked: file=${fileName}, line=${line}`);
    fetch(`/api/varMapping?file=${encodeURIComponent(fileName)}&line=${line}`)
      .then((res) => res.json())
      .then((variableNames) => {
        if (variableNames && variableNames.length > 0) {
          // For simplicity, pick the first variable (or you could allow the user to choose)
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
      setViewerMode("JBMC"); // Switch UI to display JBMC JSON
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
              />
            </div>
          )}
        </div>

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
// WebsiteContainer.js
import React, { useState, useEffect } from "react";
import DirectoryBar from "./WebsiteElements/DirectoryBar";
import EditorManager from "./Editor/EditorManager";
import JsonManager from "./Editor/JsonManager";
import ModularActions from "./ModularActions";
import JsonViewer from "./WebsiteElements/JsonViewer";
import TraceTree from "./WebsiteElements/TraceTree";
import MethodTreeView from "./WebsiteElements/MethodTreeView";
import CollapsibleSection from "./WebsiteElements/CollapsibleSection";
import MergedAssignmentsTable from "./WebsiteElements/MergedAssignmentsTable";
import "./Css/App.css";
function WebsiteContainer() {
  // Basic state management
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
  const [isMiddleContainerCollapsed, setIsMiddleContainerCollapsed] = useState(false);
  // Project ID state from URL or manual input
  const [projectId, setProjectId] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("projectId") || "";
  });
  // On mount, update projectId from URL (if available)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get("projectId");
    if (urlProjectId) {
      setProjectId(urlProjectId);
      console.log(`Working with project ID: ${urlProjectId}`);
    }
  }, []);
  // Update URL when projectId changes
  useEffect(() => {
    if (projectId) {
      const url = new URL(window.location);
      url.searchParams.set("projectId", projectId);
      window.history.pushState({}, "", url);
    }
  }, [projectId]);
  function setActiveAndDisplayed(path) {
    uploadedFiles.forEach((file) => {
      if (path === file.webkitRelativePath) {
        setDisplayedFile(file);
        setActiveFile(file);
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
    if (!projectId) {
      alert("Please enter a Project ID before uploading files");
      return;
    }
    const formData = new FormData(document.getElementById("upload-form"));
    // Append projectId to form data
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
  function highlightTraceNodeInEditor(node) {
    console.log("highlightTraceNodeInEditor called with node:", node);
    setTraceNodeToHighlight(node);
  }
  function handleHoverTraceId(traceId) {
    console.log("Hovered trace ID:", traceId);
    setHoveredTraceId(traceId);
  }
  function handleLineClick(fileName, line) {
    console.log(`Line clicked: file=${fileName}, line=${line}`);
    if (!projectId) {
      console.error("No project ID set for variable mapping");
      return;
    }
    // Include projectId in API call
    fetch(`/api/varMapping?file=${encodeURIComponent(fileName)}&line=${line}&projectId=${projectId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Variable mapping failed: ${res.status}`);
        }
        return res.json();
      })
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
    if (!projectId) {
      alert("Please enter a Project ID first");
      return;
    }
    try {
      // Include projectId in API call
      const response = await fetch(`/api/static-methods?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error(`Static methods fetch failed: ${response.status}`);
      }
      const data = await response.json();
      setStaticMethodsJson(data);
    } catch (error) {
      console.error("Error fetching static methods:", error);
      alert(`Failed to fetch static methods: ${error.message}`);
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
    if (!projectId) {
      alert("Please enter a Project ID first");
      return;
    }
    try {
      const resp = await fetch(`/api/jbmc/result/${instrumentId}?projectId=${projectId}`);
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
  const toggleMiddleContainer = () => {
    setIsMiddleContainerCollapsed(!isMiddleContainerCollapsed);
  };
  const handleCreateNewProject = () => {
    window.open("/new-project", "_blank");
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
        setVisualizationJson(jsonData); // Add this line
        setViewerMode("JSON"); // Add this line to switch to JSON view
      }}
        projectId={projectId}
      />
      {/* MIDDLE COLUMN with collapsible sections */}
      <div className={`middle-container ${isMiddleContainerCollapsed ? "collapsed" : ""}`}>
        <button className="middle-container-toggle" onClick={toggleMiddleContainer}>
          {isMiddleContainerCollapsed ? "►" : "◄"}
        </button>
        {!isMiddleContainerCollapsed && (
          <>
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
            <CollapsibleSection title="Modular Actions" defaultOpen={true}>
              <ModularActions
                projectName="MyProject"
                projectId={projectId}
                setProjectId={setProjectId}
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
            <CollapsibleSection title="Visualization Output" defaultOpen={true}>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button className={viewerMode === "JSON" ? "active-tab" : ""} onClick={() => setViewerMode("JSON")}>
                  JSON
                </button>
                <button className={viewerMode === "METHOD" ? "active-tab" : ""} onClick={() => setViewerMode("METHOD")}>
                  Methods
                </button>
                <button className={viewerMode === "TRACE" ? "active-tab" : ""} onClick={() => setViewerMode("TRACE")}>
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

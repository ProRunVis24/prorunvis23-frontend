import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import EditorInitializer from "./EditorInitializer";
import JsonManager from "./JsonManager";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import loopImage from "../Images/loop.png";
import linkImage from "../Images/link.png";
import outlinkImage from "../Images/outlink.png";
import "../Css/App.css";

function EditorManager({
  displayedFile,
  setActiveAndDisplayed,
  isActiveDisplayed,
  jsonManager,
  activeFunctionIndex,
  setActiveFunctionIndex,
  traceNodeToHighlight,
  setTraceNodeToHighlight,
  onHoverTraceId,
  onLineClick, // callback for line click events
  activeIterationIndices,
  setActiveIterationIndices,
}) {
  // States and refs
  const [jumpNodesIndices, setJumpNodesIndices] = useState([]);
  const [doPositionJump, setDoPositionJump] = useState(false);
  const [jumpPosition, setJumpPosition] = useState(new monaco.Position(0, 0));
  const editorContainerRef = useRef(null);
  const [editor, setEditor] = useState(null);
  const [javaFileContent, setJavaFileContent] = useState("");
  const lineToTraceIdRef = useRef({});

  // Loads text from displayedFile into state
  const loadJavaFile = async () => {
    try {
      if (displayedFile) {
        const text = await displayedFile.text();
        setJavaFileContent(text);
      }
    } catch (error) {
      console.error("Error loading the Java file:", error);
    }
  };

  // --- Highlighting functions (unchanged) ---
  function highlightActive(range) {
    editor.createDecorationsCollection([
      {
        options: { className: "active" },
        range: {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
        },
      },
    ]);
  }

  function highlightLink(range, linkOrOutLink) {
    editor.createDecorationsCollection([
      {
        options: { className: "link" },
        range: {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
        },
      },
    ]);
    setNodeSymbol(range, linkOrOutLink);
  }

  function highlightLoop(range) {
    editor.createDecorationsCollection([
      {
        options: { className: "loop" },
        range: {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
        },
      },
    ]);
    setNodeSymbol(range, "loop");
  }

  function highlightEnd(range) {
    editor.createDecorationsCollection([
      {
        options: { className: "inactive" },
        range: {
          startLineNumber: range.startLineNumber,
          startColumn: range.startColumn,
          endLineNumber: range.endLineNumber,
          endColumn: range.endColumn,
        },
      },
    ]);
  }

  function setNodeSymbol(range, symbol) {
    const widgetRight = {
      domNode: (() => {
        const domNode = document.createElement("img");
        if (symbol === "loop") {
          domNode.src = loopImage;
        } else if (symbol === "link") {
          domNode.src = linkImage;
        } else {
          domNode.src = outlinkImage;
        }
        return domNode;
      })(),
      getId() {
        return range.toString();
      },
      getDomNode() {
        return this.domNode;
      },
      getPosition() {
        return {
          lane: monaco.editor.GlyphMarginLane.Right,
          range: {
            startLineNumber: range.startLineNumber,
            startColumn: 1,
            endLineNumber: range.startLineNumber,
            endColumn: 1,
          },
        };
      },
    };

    editor.addGlyphMarginWidget(widgetRight);
    editor.layoutGlyphMarginWidget(widgetRight);
  }

  function placeLinePiece(startLineNumber, symbol) {
    editor.createDecorationsCollection([
      {
        range: new monaco.Range(startLineNumber, 1, startLineNumber, 1),
        options: {
          glyphMarginClassName: symbol,
        },
      },
    ]);
  }

  function iterateLine(range) {
    return new monaco.Range(
      range.startLineNumber + 1,
      0,
      range.endLineNumber + 1,
      0
    );
  }

  function drawLine(ranges) {
    let ongoing = false;
    for (let i = 0; i < ranges.length; i++) {
      if (
        i + 1 < ranges.length &&
        ranges[i].startLineNumber === ranges[i + 1].startLineNumber
      ) {
        continue;
      }
      let startLine = new monaco.Range(
        ranges[i].startLineNumber,
        0,
        ranges[i].startLineNumber + 1,
        0
      );
      let endLine = iterateLine(startLine);
      while (endLine.startLineNumber < ranges[i].endLineNumber) {
        placeLinePiece(endLine.startLineNumber, "line");
        endLine = iterateLine(endLine);
      }
      placeLinePiece(startLine.startLineNumber, ongoing ? "line" : "start");
      startLine = new monaco.Range(
        ranges[i].endLineNumber,
        0,
        ranges[i].endLineNumber + 1,
        0
      );
      endLine = iterateLine(startLine);
      if (i !== ranges.length - 1) {
        while (
          editor.getModel().getValueInRange(endLine).trim().length === 0 &&
          endLine.startLineNumber < ranges[i + 1].startLineNumber
        ) {
          endLine = iterateLine(endLine);
        }
      }
      if (
        i + 1 < ranges.length &&
        endLine.startLineNumber === ranges[i + 1].startLineNumber
      ) {
        if (startLine.startLineNumber === ranges[i].startLineNumber) {
          startLine = iterateLine(startLine);
        }
        while (startLine.startLineNumber < endLine.startLineNumber) {
          placeLinePiece(startLine.startLineNumber, "line");
          startLine = iterateLine(startLine);
        }
        ongoing = true;
      } else {
        placeLinePiece(ranges[i].endLineNumber, ongoing ? "end" : "one-line");
        ongoing = false;
      }
    }
  }

  function changeIteration(newIterationIndex) {
    setActiveIterationIndices([newIterationIndex]);
  }

  // NEW: Register an onMouseDown listener that logs the event and calls onLineClick.
  useEffect(() => {
    if (editor && onLineClick) {
      const disposable = editor.onMouseDown((e) => {
        if (!e.target || !e.target.position) return;
        const lineNumber = e.target.position.lineNumber;
        const fileName = displayedFile ? displayedFile.name : "UnknownFile.java";
        console.log("EditorManager: onMouseDown event:", e);
        console.log(`EditorManager: Click detected on file ${fileName} at line ${lineNumber}`);
        // Call the callback passed from the parent
        onLineClick(fileName, lineNumber);
      });
      return () => disposable.dispose();
    }
  }, [editor, onLineClick, displayedFile]);

  // (Keep your other event listeners such as handleJumps and handleIterationButton as-is)
  function handleJumps() {
    editor.onMouseDown((e) => {
      if (!e.target || !e.target.position) return;
      const position = e.target.position;
      jumpNodesIndices.forEach((jumpIndex) => {
        if (jumpIndex === 1) return;
        const jump = jsonManager.nodes[jumpIndex];
        if (jump.nodeType !== "Function" || jumpIndex === activeFunctionIndex) {
          if (jump.nodeType === "Function" && jump.outLinks.length === 2) {
            if (jump.outLinks[1].range.containsPosition(position)) {
              setJumpPosition(jump.outLinkPosition);
              setDoPositionJump(true);
              setActiveIterationIndices(jump.outLoopIterations);
              setActiveFunctionIndex(jump.outFunctionIndex);
            }
            jsonManager
              .updateActiveRangesFunction(activeFunctionIndex, activeIterationIndices)
              .forEach((range) => {
                if (range.containsRange(jsonManager.nodes[jumpIndex].outLinks[0].range)) {
                  if (jump.outLinks[0].range.containsPosition(position)) {
                    setJumpPosition(jump.outLinkPosition);
                    setDoPositionJump(true);
                    setActiveIterationIndices(jump.outLoopIterations);
                    setActiveFunctionIndex(jump.outFunctionIndex);
                  }
                }
              });
          } else {
            jump.outLinks.forEach((outLink) => {
              if (outLink.range.containsPosition(position)) {
                setJumpPosition(jump.outLinkPosition);
                setDoPositionJump(true);
                setActiveIterationIndices(jump.outLoopIterations);
                setActiveFunctionIndex(jump.outFunctionIndex);
              }
            });
          }
        }
        if (jumpIndex === activeFunctionIndex) return;
        if (jump.nodeType === "Function") {
          if (jump.link.range.containsPosition(position)) {
            setJumpPosition(jump.linkPosition);
            setDoPositionJump(true);
            setActiveIterationIndices(jsonManager.initIterations(jumpIndex, []));
            setActiveFunctionIndex(jumpIndex);
          }
        }
      });
    });
  }

  function handleIterationButton() {
    editor.onMouseDown((e) => {
      if (!e.target || !e.target.position) return;
      const position = e.target.position;
      activeIterationIndices.forEach((iterationIndex) => {
        const iteration = jsonManager.nodes[iterationIndex];
        if (iteration.link.range.containsPosition(position)) {
          const baseId = JsonManager.getBaseTraceId(iteration.traceId);
          let nextIteration = prompt("Please enter the iteration", iteration.iteration);
          nextIteration = parseInt(nextIteration, 10);
          for (let i = 0; i < jsonManager.nodes.length; i++) {
            const node = jsonManager.nodes[i];
            const candidateBaseId = JsonManager.getBaseTraceId(node.traceId);
            if (
              candidateBaseId === baseId &&
              node.iteration === nextIteration &&
              node.parentIndex === iteration.parentIndex
            ) {
              changeIteration(i);
              break;
            }
          }
        }
      });
    });
  }

  function splitRangeByLine(range) {
    if (!editor) return [range];
    const result = [];
    const model = editor.getModel();
    if (!model) return [range];
    const startLineNumber = range.startLineNumber;
    const endLineNumber = range.endLineNumber;
    for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      const firstNonWhitespace = lineContent.search(/\S/);
      const startColumn =
        lineNumber === startLineNumber
          ? range.startColumn
          : Math.max(1, firstNonWhitespace + 1);
      const endColumn =
        lineNumber === endLineNumber
          ? range.endColumn
          : model.getLineMaxColumn(lineNumber);
      result.push(new monaco.Range(lineNumber, startColumn, lineNumber, endColumn));
    }
    return result;
  }

  function jumpToPosition(position) {
    if (!position || !editor) return;
    editor.revealLineNearTop(position.lineNumber);
    editor.setPosition(position);
  }

  useEffect(() => {
    if (traceNodeToHighlight && editor) {
      if (traceNodeToHighlight.link && traceNodeToHighlight.link.range) {
        jumpToPosition(traceNodeToHighlight.link.range.getStartPosition());
        highlightActive(traceNodeToHighlight.link.range);
      }
    }
  }, [traceNodeToHighlight, editor]);

  useEffect(() => {
    if (editor) {
      const subscription = editor.onMouseMove((e) => {
        if (!e.target || !e.target.position) {
          onHoverTraceId && onHoverTraceId(null);
          return;
        }
        const line = e.target.position.lineNumber;
        const traceIds = lineToTraceIdRef.current[line];
        if (Array.isArray(traceIds) && traceIds.length > 0) {
          if (activeIterationIndices.length > 0) {
            const activeIterIndex = activeIterationIndices[0];
            const activeIterNode = jsonManager.nodes[activeIterIndex];
            if (!activeIterNode) {
              onHoverTraceId && onHoverTraceId(traceIds[0]);
              return;
            }
            const activeTraceId = activeIterNode.traceId;
            if (traceIds.includes(activeTraceId)) {
              onHoverTraceId && onHoverTraceId(activeTraceId);
            } else {
              onHoverTraceId && onHoverTraceId(traceIds[0]);
            }
          } else {
            onHoverTraceId && onHoverTraceId(traceIds[0]);
          }
        } else {
          onHoverTraceId && onHoverTraceId(null);
        }
      });
      return () => subscription.dispose();
    }
  }, [editor, onHoverTraceId, activeIterationIndices, jsonManager]);

  useEffect(() => {
    if (jsonManager) {
      setActiveFunctionIndex(jsonManager.getMain());
      setActiveAndDisplayed(jsonManager.nodes[1].link.file);
      setActiveIterationIndices(jsonManager.initIterations(1, []));
    }
  }, [jsonManager]);

  useEffect(() => {
    if (displayedFile) {
      loadJavaFile();
    }
  }, [displayedFile]);

  useEffect(() => {
    let newEditor;
    if (javaFileContent && editorContainerRef.current) {
      let hints = [];
      if (isActiveDisplayed()) {
        activeIterationIndices.forEach((iterationIndex) => {
          const position = jsonManager.nodes[iterationIndex].link.range.getStartPosition();
          const content =
            "(" +
            jsonManager.nodes[iterationIndex].iteration +
            "/" +
            jsonManager.getLastIterationNumber(iterationIndex) +
            ")";
          hints.push({ position, content });
        });
      }
      if (editor) {
        editor.dispose();
      }
      newEditor = EditorInitializer.initializeEditor(
        editorContainerRef,
        javaFileContent,
        hints
      );
      if (newEditor) {
        setEditor(newEditor.editor);
      }
    }
    return () => {
      if (javaFileContent && editorContainerRef.current && newEditor) {
        newEditor.dispose();
      }
    };
  }, [javaFileContent, activeIterationIndices, activeFunctionIndex]);

  useEffect(() => {
    if (jsonManager) {
      setActiveAndDisplayed(jsonManager.nodes[activeFunctionIndex].link.file);
    }
  }, [activeFunctionIndex]);

  useEffect(() => {
    if (jsonManager) {
      setJumpNodesIndices(
        jsonManager.updateJumpsFunction(activeFunctionIndex, activeIterationIndices)
      );
    }
  }, [activeIterationIndices]);

  useEffect(() => {
    if (jsonManager && editor) {
      const rangesToHighlight = jsonManager.updateActiveRangesFunction(
        activeFunctionIndex,
        activeIterationIndices
      );
      if (isActiveDisplayed()) {
        setDoPositionJump(true);
        rangesToHighlight.forEach((rangeToHighlight) => {
          splitRangeByLine(rangeToHighlight).forEach((splitRangeToHighlight) => {
            highlightActive(splitRangeToHighlight);
          });
        });
        drawLine(rangesToHighlight);
        jumpNodesIndices.forEach((jumpIndex) => {
          const jNode = jsonManager.nodes[jumpIndex];
          if (jNode.nodeType !== "Function" || jumpIndex === activeFunctionIndex) {
            if (jNode.nodeType === "Function" && jNode.outLinks.length === 2) {
              highlightLink(jNode.outLinks[1].range);
              jsonManager
                .updateActiveRangesFunction(activeFunctionIndex, activeIterationIndices)
                .forEach((range) => {
                  if (range.containsRange(jNode.outLinks[0].range)) {
                    highlightLink(jNode.outLinks[0].range, "outlink");
                  }
                });
            } else {
              jNode.outLinks.forEach((outLink) => {
                highlightLink(outLink.range, "outlink");
              });
            }
          }
          if (jumpIndex !== activeFunctionIndex && jNode.nodeType === "Function") {
            highlightLink(jNode.link.range, "link");
          }
        });
        handleJumps();
        handleIterationButton();
        activeIterationIndices.forEach((index) => {
          highlightLoop(jsonManager.nodes[index].link.range);
        });
      }
      if (!doPositionJump && isActiveDisplayed()) {
        if (activeFunctionIndex !== 1) {
          jumpToPosition(
            jsonManager.nodes[activeFunctionIndex].outLinks[
              jsonManager.nodes[activeFunctionIndex].outLinks.length - 1
            ].range.getStartPosition()
          );
        } else {
          jumpToPosition(
            jsonManager.nodes[activeFunctionIndex].link.range.getStartPosition()
          );
        }
        setDoPositionJump(false);
      }
      if (doPositionJump) {
        setDoPositionJump(false);
        jumpToPosition(jumpPosition);
      }
    }
  }, [editor]);

  useEffect(() => {
    if (!jsonManager || !jsonManager.nodes) return;
    lineToTraceIdRef.current = {};
    jsonManager.nodes.forEach((node) => {
      if (!node.traceId || !node.ranges || node.ranges.length === 0) return;
      node.ranges.forEach((rng) => {
        for (let ln = rng.startLineNumber; ln <= rng.endLineNumber; ln++) {
          if (!lineToTraceIdRef.current[ln]) {
            lineToTraceIdRef.current[ln] = [];
          }
          lineToTraceIdRef.current[ln].push(node.traceId);
        }
      });
    });
    console.log("Built line->traceId map:", lineToTraceIdRef.current);
  }, [jsonManager]);

  // Welcome component when no file is loaded
// Welcome component when no file is loaded
const EditorWelcome = () => {
  return (
    <div className="editor-welcome-container">
      <div className="editor-welcome-content">
        <h2>Welcome to ProRunVis Code Visualizer</h2>
        <div className="welcome-instructions">
          <p>Upload a Java project from the left panel to get started.</p>
          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="step-number">1</span>
              <p>Use the directory browser on the left to select and upload a Java project</p>
            </div>
            <div className="welcome-step">
              <span className="step-number">2</span>
              <p>Run instrumentation and tracing using the modular actions panel</p>
            </div>
            <div className="welcome-step">
              <span className="step-number">3</span>
              <p>Visualize the execution flow with color-coded highlights and interactive elements</p>
            </div>
          </div>
          <div className="welcome-features">
            <h3>Features:</h3>
            <ul>
              <p><span className="feature-highlight active"></span> Active code is highlighted in <strong>green</strong></p>
              <p><span className="feature-highlight link"></span> Function calls and jumps are highlighted in <strong>blue</strong></p>
              <p><span className="feature-highlight loop"></span> Loops are highlighted in <strong>purple</strong></p>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

return (
  <main className="right-container">
    {!displayedFile ? (
      <EditorWelcome />
    ) : (
      <div ref={editorContainerRef} className="editor-container"></div>
    )}
  </main>
);
}

EditorManager.propTypes = {
  displayedFile: PropTypes.instanceOf(File),
  setActiveAndDisplayed: PropTypes.func,
  activeFunctionIndex: PropTypes.number,
  setActiveFunctionIndex: PropTypes.func,
  traceNodeToHighlight: PropTypes.object,
  setTraceNodeToHighlight: PropTypes.func,
  onHoverTraceId: PropTypes.func,
  isActiveDisplayed: PropTypes.func,
  jsonManager: PropTypes.instanceOf(JsonManager),
  activeIterationIndices: PropTypes.array.isRequired,
  setActiveIterationIndices: PropTypes.func.isRequired,
  onLineClick: PropTypes.func, // NEW: prop for line click events
};

export default EditorManager;
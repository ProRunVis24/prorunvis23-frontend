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
const EditorWelcome = () => {
  return (
    <div className="editor-welcome-container">
      <div className="editor-welcome-content">
        <h2>Welcome to ProRunVis</h2>
        <div className="welcome-description">
          <p>
            <strong>ProRunVis</strong> is an advanced visualization tool that helps you understand and analyze the execution flow of Java programs.
            By instrumenting, tracing, and visualizing your code, it reveals how your program actually runs - showing control flow, method calls,
            loops, and execution paths that might otherwise be difficult to understand.
          </p>
        </div>

        <div className="welcome-workflow">
          <h3>How It Works:</h3>
          <div className="welcome-steps">
            <div className="welcome-step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Upload Your Java Project</h4>
                <p>Use the file browser on the left panel to upload a Java project directory. ProRunVis works best with
                self-contained Java projects without external dependencies.</p>
              </div>
            </div>

            <div className="welcome-step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Instrument & Trace</h4>
                <p>Use the {'"Instrument"'} button in the middle panel to prepare your code for analysis.
                Then {'"Trace"'} to run your program and collect execution data. ProRunVis automatically
                inserts trace points throughout your code to track execution.</p>
              </div>
            </div>

            <div className="welcome-step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Process & Visualize</h4>
                <p>Click {'"Process"'} to analyze the trace data, then {'"Visualize"'} to see the execution flow in the editor.
                Your code will be displayed with color-coded highlights showing the actual execution path.</p>
              </div>
            </div>

            <div className="welcome-step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Explore & Analyze</h4>
                <p>Use the interactive visualizations to explore method calls, loops, and execution paths.
                You can also run JBMC analysis to see variable assignments and potential issues in your code.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="welcome-visualization">
          <h3>Visualization Guide:</h3>
          <div className="visualization-features">
            <div className="feature">
              <span className="feature-highlight active"></span>
              <p><strong>Green highlights</strong> show executed code segments in the current context</p>
            </div>
            <div className="feature">
              <span className="feature-highlight link"></span>
              <p><strong>Blue highlights</strong> indicate function calls and jumps - click to navigate to target locations</p>
            </div>
            <div className="feature">
              <span className="feature-highlight loop"></span>
              <p><strong>Purple highlights</strong> show loops - click to select specific iterations</p>
            </div>
            <div className="feature">
              <span className="feature-highlight inactive"></span>
              <p><strong>Red highlights</strong> indicate inactive or unreachable code in the current execution path</p>
            </div>
          </div>
        </div>

        <div className="welcome-advanced">
          <h3>Advanced Features:</h3>
          <ul>
            <li><strong>Method Tree View:</strong> Explore the hierarchy of function calls in your code</li>
            <li><strong>Trace Tree:</strong> See a sequential list of all execution points</li>
            <li><strong>JBMC Integration:</strong> Run the Java Bounded Model Checker to identify potential bugs and analyze variable states</li>

          </ul>
        </div>

        <div className="welcome-tip">
          <h4>Getting Started:</h4>
          <p>Try uploading a simple Java project first to get familiar with the workflow. Check the Help button in the navigation bar for a detailed tutorial.</p>
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
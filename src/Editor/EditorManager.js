import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import EditorInitializer from "./EditorInitializer";
import JsonManager from "./JsonManager";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import loopImage from "../Images/loop.png";
import linkImage from "../Images/link.png";
import outlinkImage from "../Images/outlink.png";
import "../Css/App.css";
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
}) {
  // State for the indices of the loop iterations currently active.
  const [activeIterationIndices, setActiveIterationIndices] = useState([]);

  // State for the indices of the Nodes (other functions and throws)
  // of the active function that can be used to jump to another node.
  const [jumpNodesIndices, setJumpNodesIndices] = useState([]);

  // State to determine whether the file was changed through a jump
  const [doPositionJump, setDoPositionJump] = useState(false);

  // The position to jump to on a new file load
  const [jumpPosition, setJumpPosition] = useState(new monaco.Position(0, 0));

  // Reference to the editor container
  const editorContainerRef = useRef(null);

  // Monaco editor instance
  const [editor, setEditor] = useState(null);

  // Java file content to display
  const [javaFileContent, setJavaFileContent] = useState("");

  // We'll build a line->traceId map (actually an array of traceIds) after we have editor + jsonManager
  const lineToTraceIdRef = useRef({});

  /** Loads text from `displayedFile` into state. */
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

  // ---------------------------------- Decorators (highlighting) ----------------------------------

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

  // Places an icon in the margin
  function setNodeSymbol(range, symbol) {
    const widgetRight = {
      domNode: (function () {
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

  // Draw a vertical line next to executed code
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

      placeLinePiece(
        startLine.startLineNumber,
        ongoing ? "line" : "start"
      );

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
        placeLinePiece(
          ranges[i].endLineNumber,
          ongoing ? "end" : "one-line"
        );
        ongoing = false;
      }
    }
  }

  // -------------------- Handling iteration changes --------------------

  function changeIteration(newIterationIndex) {
    // your existing logic

   setActiveIterationIndices([newIterationIndex]);
  }

  // --------------- Handling clicks to jump among nodes ---------------

  function handleJumps() {
    editor.onMouseDown((e) => {
      if (!e.target || !e.target.position) {
        return;
      }
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
                if (
                  range.containsRange(jsonManager.nodes[jumpIndex].outLinks[0].range)
                ) {
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
        // skip link for current function if same file
        if (jumpIndex === activeFunctionIndex) {
          return;
        }
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

  /** Handle clicks on loop lines to change iteration. */
 function handleIterationButton() {
   editor.onMouseDown((e) => {
     if (!e.target || !e.target.position) return;

     const position = e.target.position;

     // Iterate over all currently "active" iteration nodes:
     activeIterationIndices.forEach((iterationIndex) => {
       const iteration = jsonManager.nodes[iterationIndex];

       // If we clicked on the line for this loop node:
       if (iteration.link.range.containsPosition(position)) {
         const id = iteration.traceId;
         let nextIteration = prompt(
           "Please enter the iteration",
           iteration.iteration
         );
         nextIteration = parseInt(nextIteration, 10);

         // If user gave invalid input (NaN, negative, or out of range),
         // just keep the old iteration number:
         if (
           isNaN(nextIteration) ||
           nextIteration < 0 ||
           nextIteration > jsonManager.getLastIterationNumber(iterationIndex)
         ) {
           nextIteration = iteration.iteration;
         }

         // Find the TraceNode that matches (same traceId, same iteration, same parent):
         for (let i = 0; i < jsonManager.nodes.length; i++) {
           if (
             jsonManager.nodes[i].traceId === id &&
             jsonManager.nodes[i].iteration === nextIteration &&
             jsonManager.nodes[i].parentIndex === iteration.parentIndex
           ) {
             // Found a valid node => call your simplified changeIteration:
             // (Remember, in changeIteration, you do something like:
             //   setActiveIterationIndices([ newIterationIndex ]);
             // )
             changeIteration(i);
             break;
           }
         }
       }
     });
   });
 }
  /**
   * Splits a monaco.Range into line-by-line sub-ranges,
   * so you can highlight them individually.
   */
  function splitRangeByLine(range) {
    if (!editor) return [range];
    // fallback if editor is null

    const result = [];
    const model = editor.getModel();
    if (!model) return [range];

    const startLineNumber = range.startLineNumber;
    const endLineNumber = range.endLineNumber;

    for (let lineNumber = startLineNumber; lineNumber <= endLineNumber; lineNumber++) {
      const lineContent = model.getLineContent(lineNumber);
      // find the first non-whitespace character
      const firstNonWhitespace = lineContent.search(/\S/);
      const startColumn =
        lineNumber === startLineNumber
          ? range.startColumn
          : Math.max(1, firstNonWhitespace + 1);
      const endColumn =
        lineNumber === endLineNumber
          ? range.endColumn
          : model.getLineMaxColumn(lineNumber);

      result.push(
        new monaco.Range(lineNumber, startColumn, lineNumber, endColumn)
      );
    }
    return result;
  }

  /** Reveal a position in the editor */
  function jumpToPosition(position) {
    if (!position || !editor) return;
    editor.revealLineNearTop(position.lineNumber);
    editor.setPosition(position);
  }

  // --------------- useEffect for traceNodeToHighlight ---------------
  useEffect(() => {
    if (traceNodeToHighlight && editor) {
      if (traceNodeToHighlight.link && traceNodeToHighlight.link.range) {
        jumpToPosition(traceNodeToHighlight.link.range.getStartPosition());
        highlightActive(traceNodeToHighlight.link.range);
      }
      // optionally: setTraceNodeToHighlight(null);
    }
  }, [traceNodeToHighlight, editor]);

  // --------------- onMouseMove subscription ---------------
useEffect(() => {
  if (editor) {
    const subscription = editor.onMouseMove((e) => {
      if (!e.target || !e.target.position) {
        onHoverTraceId && onHoverTraceId(null);
        return;
      }
      const line = e.target.position.lineNumber;
      const traceIds = lineToTraceIdRef.current[line];

      // CHANGE #1: Remove "&& activeIterationIndices.length > 0"
      // so ANY lines with traceIds are highlighted, not just loop/iteration lines
      if (Array.isArray(traceIds) && traceIds.length > 0) {
        // Keep your existing logic: pick the "active iteration" if present
        // or fall back to the first trace ID
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
          // If no active iteration, just highlight the first trace ID
          onHoverTraceId && onHoverTraceId(traceIds[0]);
        }
      } else {
        onHoverTraceId && onHoverTraceId(null);
      }
    });
    return () => subscription.dispose();
  }
}, [editor, onHoverTraceId, activeIterationIndices, jsonManager]);

  // --------------- Initialize the main function + file ---------------
  useEffect(() => {
    if (jsonManager) {
      setActiveFunctionIndex(jsonManager.getMain());
      // pick node #1’s file if that’s your main approach
      setActiveAndDisplayed(jsonManager.nodes[1].link.file);
      setActiveIterationIndices(jsonManager.initIterations(1, []));
    }
  }, [jsonManager]);

  // --------------- Load the displayed file content ---------------
  useEffect(() => {
    if (displayedFile) {
      loadJavaFile();
    }
  }, [displayedFile]);

  // --------------- Initialize / re-init the editor ---------------
  useEffect(() => {
    let newEditor;
    if (javaFileContent && editorContainerRef.current) {
      // Build hints for iteration labels
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

      // If there's an existing editor, dispose it before re-creating
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
    // Cleanup
    return () => {
      if (javaFileContent && editorContainerRef.current && newEditor) {
        newEditor.dispose();
      }
    };
  }, [javaFileContent, activeIterationIndices, activeFunctionIndex]);

  // --------------- Update file display if active function changes ---------------
  useEffect(() => {
    if (jsonManager) {
      setActiveAndDisplayed(jsonManager.nodes[activeFunctionIndex].link.file);
    }
  }, [activeFunctionIndex]);

  // --------------- Update jump-nodes if iteration changes ---------------
  useEffect(() => {
    if (jsonManager) {
      setJumpNodesIndices(
        jsonManager.updateJumpsFunction(activeFunctionIndex, activeIterationIndices)
      );
    }
  }, [activeIterationIndices]);

  // --------------- When editor updates, highlight active ranges ---------------
  useEffect(() => {
    if (jsonManager && editor) {
      const rangesToHighlight = jsonManager.updateActiveRangesFunction(
        activeFunctionIndex,
        activeIterationIndices
      );

      if (isActiveDisplayed()) {
        setDoPositionJump(true);
        rangesToHighlight.forEach((rangeToHighlight) => {
          // split each range by line
          splitRangeByLine(rangeToHighlight).forEach((splitRangeToHighlight) => {
            highlightActive(splitRangeToHighlight);
          });
        });
        // draw lines next to those ranges
        drawLine(rangesToHighlight);

        // highlight jump links
        jumpNodesIndices.forEach((jumpIndex) => {
          const jNode = jsonManager.nodes[jumpIndex];
          if (
            jNode.nodeType !== "Function" ||
            jumpIndex === activeFunctionIndex
          ) {
            if (
              jNode.nodeType === "Function" &&
              jNode.outLinks.length === 2
            ) {
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
          // If not current function, highlight the function link
          if (jumpIndex !== activeFunctionIndex && jNode.nodeType === "Function") {
            highlightLink(jNode.link.range, "link");
          }
        });

        handleJumps();
        handleIterationButton();

        // highlight loops
        activeIterationIndices.forEach((index) => {
          highlightLoop(jsonManager.nodes[index].link.range);
        });
      }

      // Position the editor to the active node or do the saved jump
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

  // --------------- Build line->traceIds map ---------------
  useEffect(() => {
    if (!jsonManager || !jsonManager.nodes) {
      return;
    }
    lineToTraceIdRef.current = {};

    jsonManager.nodes.forEach((node, idx) => {
      if (!node.traceId) return;
      if (!node.ranges || node.ranges.length === 0) return;

      node.ranges.forEach((rng) => {
        const startLine = rng.startLineNumber;
        const endLine = rng.endLineNumber;
        for (let ln = startLine; ln <= endLine; ln++) {
          // store an array of all traceIds for that line
          if (!lineToTraceIdRef.current[ln]) {
            lineToTraceIdRef.current[ln] = [];
          }
          lineToTraceIdRef.current[ln].push(node.traceId);
        }
      });
    });

    console.log("Built line->traceId map:", lineToTraceIdRef.current);
  }, [jsonManager]);

  // ------------------------- Render -------------------------

  return (
    <main className="right-container">
      <div ref={editorContainerRef} className="editor-container"></div>
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
};

export default EditorManager;
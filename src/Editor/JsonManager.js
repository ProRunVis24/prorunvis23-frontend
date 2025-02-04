import TraceNode from "./TraceNode";
import { editor, Position } from "monaco-editor";

/**
 * Helper function to extract the base trace ID from a full traceId.
 * If the traceId contains "_iter", this function returns only the part before it.
 * Otherwise, it returns the entire traceId.
 * @param {string} traceId
 * @returns {string}
 */
/**
 * Returns the substring before "_iter".
 * If no "_iter" is found, returns the entire traceId.
 *
 * @param {string} traceId e.g. "loop42_iter3" or "loop42"
 * @returns {string} the base ID, e.g. "loop42"
 */

/**
 * Class that contains an array of {@link TraceNode}s and manages them.
 * It provides functions to extract information needed for the editor.
 */
class JsonManager {
  /**
   * Constructor takes in a JSON string, maps the data to {@link TraceNode}s,
   * and saves them in an array.
   * @param {string} jsonString - JSON data from the backend.
   */
  constructor(jsonString) {
    this.nodes = [];
    this.activeIterations = [];
    this.skipIds = [];
    this.activeIterationIndex = 0;
    let data = jsonString;
    data.forEach((jsonData) => {
      this.nodes.push(new TraceNode(jsonData));
    });
    for (let i = 2; i < this.nodes.length; i++) {
      let node = this.nodes[i];
      if (node.nodeType === "Throw") {
        node.outLinkPosition = new Position(0, 0);
        if (this.nodes[node.outIndex].ranges.length !== 0) {
          // If catch is empty and has no range, pick the first sorted range.
          node.outLinkPosition = this.nodes[node.outIndex].ranges
            .sort((a, b) =>
              a.startLineNumber < b.startLineNumber ? -1 : a.startLineNumber > b.startLineNumber ? 1 : 0
            )[0].getStartPosition();
        }
      }
      if (node.nodeType === "Function") {
        node.linkPosition = node.outLinks[node.outLinks.length - 1].range.getStartPosition();
        node.outLinkPosition = node.link.range.getStartPosition();
      }
      if (node.nodeType === "Function" || node.nodeType === "Throw") {
        let currentIndex = node.outIndex;
        let currentNode = this.nodes[currentIndex];
        let parentBeforeIndex = -1;
        let parentBeforeTraceId = -1;
        let iterationsBefore = [];
        let iterations = [];
        let start = true;
        while (currentNode.nodeType !== "Function" || start) {
          if (!start) {
            currentIndex = this.nodes[currentIndex].parentIndex;
            currentNode = this.nodes[currentIndex];
            parentBeforeTraceId = this.nodes[parentBeforeIndex].traceId;
          }
          iterations = [];
          if (currentNode.nodeType === "Loop") {
            iterations.push(currentIndex);
          }
          currentNode.childrenIndices.forEach((childIndex) => {
            if (childIndex === parentBeforeIndex) {
              iterations.push(...iterationsBefore);
            } else if (this.nodes[childIndex].iteration === 1 &&
                       this.nodes[childIndex].traceId !== parentBeforeTraceId) {
              iterations.push(childIndex);
            }
          });
          parentBeforeIndex = currentIndex;
          iterationsBefore = iterations;
          start = false;
        }
        this.nodes[i].outLoopIterations = iterations;
        this.nodes[i].outFunctionIndex = currentIndex;
      }
    }
  }

  /**
   * Returns the index of the main function in nodes.
   * @returns {number}
   */
  getMain() {
    return 1;
  }

  /**
   * Returns the parent function index for a given node.
   * @param {number} nodeIndex
   * @returns {number}
   */
  getParentFunction(nodeIndex) {
    if (nodeIndex < 1 || nodeIndex > this.nodes.length - 1) return -1;
    let currentIndex = nodeIndex;
    let currentNode = this.nodes[currentIndex];
    while (currentNode.nodeType !== "Function") {
      currentIndex = currentNode.parentIndex;
      currentNode = this.nodes[currentIndex];
    }
    return currentIndex;
  }

  /**
     * Returns the base trace ID by stripping out the "_iter" suffix.
     * @param {string} traceId
     * @returns {string} the base trace ID.
     */
    static getBaseTraceId(traceId) {
      const index = traceId.indexOf("_iter");
      return index === -1 ? traceId : traceId.substring(0, index);
    }


  /**
   * Returns the number of the last iteration that belongs to the loop.
   * This method compares only the base trace IDs (before "_iter").
   * @param {number} iterationIndex - Index of a TraceNode representing one iteration.
   * @returns {number} The highest iteration number found.
   */
getLastIterationNumber(iterationIndex) {
  let iterationIndexId = this.nodes[iterationIndex].traceId;
  // Use the static method on JsonManager
  let baseId = JsonManager.getBaseTraceId(iterationIndexId);
  let lastIteration = this.nodes[iterationIndex].iteration;

  this.nodes[this.nodes[iterationIndex].parentIndex].childrenIndices.forEach((childIndex) => {
    if (
      JsonManager.getBaseTraceId(this.nodes[childIndex].traceId) === baseId &&
      this.nodes[childIndex].iteration > lastIteration
    ) {
      lastIteration = this.nodes[childIndex].iteration;
    }
  });
  return lastIteration;
}

  /**
   * Determines the initially active iterations for a function.
   * @param {number} functionIndex - Index of the currently active function.
   * @param {Array} activeIterationIndices - Current active iteration indices.
   * @returns {Array} An array with the active iteration node indices.
   */
  initIterations(functionIndex, activeIterationIndices) {
    this.skipIds = [];
    this.activeIterations = [...activeIterationIndices];
    this.activeIterationIndex = 0;
    this.nodes[functionIndex].childrenIndices.forEach((childIndex) => {
      this.getIterations(childIndex);
    });
    return this.activeIterations;
  }

  /**
   * Recursively determines all active loops that have this node as a grandparent.
   * @param {number} nodeIndex - Current node index.
   * @returns {Array} An array with the active iteration indices.
   */
  getIterations(nodeIndex) {
    let end = false;
    this.skipIds.forEach((skipId) => {
      if (this.nodes[nodeIndex].traceId === skipId) {
        end = true;
      }
    });
    if (end || this.nodes[nodeIndex].nodeType === "Function") {
      return [];
    }
    let skip = true;
    if (this.nodes[nodeIndex].nodeType !== "Loop") skip = false;
    if (this.activeIterationIndex + 1 > this.activeIterations.length && this.nodes[nodeIndex].iteration === 1) {
      this.activeIterations.push(nodeIndex);
      this.activeIterationIndex++;
      skip = false;
      this.skipIds.push(this.nodes[nodeIndex].traceId);
    }
    if (
      !(this.activeIterationIndex + 1 > this.activeIterations.length) &&
      this.nodes[nodeIndex].iteration === this.nodes[this.activeIterations[this.activeIterationIndex]].iteration
    ) {
      this.activeIterationIndex++;
      this.skipIds.push(this.nodes[nodeIndex].traceId);
      skip = false;
    }
    if (!skip) {
      this.nodes[nodeIndex].childrenIndices.forEach((childIndex) => {
        this.activeIterations.concat(this.getIterations(childIndex));
      });
    }
  }

  /**
   * Determines all function and throw nodes in the currently active function,
   * marking whether they are active based on the active iterations.
   * @param {number} functionIndex - Index of the active function.
   * @param {Array} activeIterationIndices - Current active loop iterations.
   * @returns {Array} An array with indices of the function or throw nodes.
   */
  updateJumpsFunction(functionIndex, activeIterationIndices) {
    this.skipIds = [];
    this.activeIterations = [...activeIterationIndices];
    let jumps = [];
    jumps.push(functionIndex);
    this.nodes[functionIndex].childrenIndices.forEach((childIndex) => {
      jumps = jumps.concat(this.getJumps(childIndex));
    });
    return jumps;
  }

  /**
   * Recursively determines all function and throw nodes that are part of the current function.
   * @param {number} nodeIndex - Current node index.
   * @returns {Array} An array with indices of the function or throw nodes.
   */
  getJumps(nodeIndex) {
    let jumps = [];
    let end = false;
    this.skipIds.forEach((skipId) => {
      if (this.nodes[nodeIndex].traceId === skipId) end = true;
    });
    if (end) return jumps;
    if (this.nodes[nodeIndex].nodeType === "Function" || this.nodes[nodeIndex].nodeType === "Throw")
      jumps.push(nodeIndex);
    if (
      (!(this.nodes[nodeIndex].nodeType === "Loop") ||
        nodeIndex === this.activeIterations[0])
    ) {
      if (this.nodes[nodeIndex].nodeType === "Loop") {
        this.activeIterations.shift();
        this.skipIds.push(this.nodes[nodeIndex].traceId);
      }
      if (this.nodes[nodeIndex].nodeType !== "Function") {
        this.nodes[nodeIndex].childrenIndices.forEach((childIndex) => {
          jumps = jumps.concat(this.getJumps(childIndex));
        });
      }
    }
    return jumps;
  }

  /**
   * Determines all active ranges in the currently active function.
   * @param {number} functionIndex - Index of the active function.
   * @param {Array} activeIterationIndices - Active loop iterations.
   * @returns {Array} An array with all active ranges.
   */
  updateActiveRangesFunction(functionIndex, activeIterationIndices) {
    let ranges = [];
    this.activeIterations = [...activeIterationIndices];
    this.skipIds = [];
    this.nodes[functionIndex].ranges.forEach((range) => {
      ranges.push(range);
    });
    this.nodes[functionIndex].childrenIndices.forEach((childIndex) => {
      ranges = ranges.concat(this.getActiveRanges(childIndex));
    });
    ranges.sort((a, b) =>
      a.startLineNumber < b.startLineNumber ? -1 : a.startLineNumber > b.startLineNumber ? 1 : 0
    );
    return ranges;
  }

  /**
   * Recursively determines all ranges of all child nodes that are part of the current function.
   * @param {number} nodeIndex - Current node index.
   * @returns {Array} An array with the ranges for the node and its children.
   */
  getActiveRanges(nodeIndex) {
    let ranges = [];
    let end = false;
    this.skipIds.forEach((skipId) => {
      if (this.nodes[nodeIndex].traceId === skipId) end = true;
    });
    if (end) return ranges;
    if (this.nodes[nodeIndex].nodeType === "Function") {
      ranges.push(this.nodes[nodeIndex].link.range);
    } else if (
      this.nodes[nodeIndex].nodeType !== "Loop" ||
      nodeIndex === this.activeIterations[0]
    ) {
      if (this.nodes[nodeIndex].nodeType === "Loop") {
        this.activeIterations.shift();
        this.skipIds.push(this.nodes[nodeIndex].traceId);
      }
      this.nodes[nodeIndex].ranges.forEach((range) => {
        ranges.push(range);
      });
      this.nodes[nodeIndex].childrenIndices.forEach((childIndex) => {
        ranges = ranges.concat(this.getActiveRanges(childIndex));
      });
    }
    return ranges;
  }
}

export default JsonManager;
// MethodTreeView.js

import React, { useState, useMemo } from "react";
import PropTypes from "prop-types";

/**
 * Build a tree of "Function" nodes from jsonManager.nodes:
 * - Each node gains a `children` array, containing child function nodes.
 * - Return an array of "root" function nodes (those whose parent is not a function).
 */
function buildFunctionTree(jsonManager) {
  if (!jsonManager || !jsonManager.nodes) {
    return [];
  }

  // 1) Create a quick map from node index -> node
  const indexToNode = {};
  jsonManager.nodes.forEach((node, idx) => {
    indexToNode[idx] = node;
  });

  // 2) Prepare each node for children
  jsonManager.nodes.forEach((node) => {
    // We'll add a `children` array
    node.children = [];
  });

  // 3) For each function node, push any child function nodes
  jsonManager.nodes.forEach((node, idx) => {
    if (node.nodeType === "Function") {
      node.childrenIndices.forEach((childIndex) => {
        const childNode = indexToNode[childIndex];
        if (childNode && childNode.nodeType === "Function") {
          // childNode is also a function, so nest it
          node.children.push(childNode);
        }
      });
    }
  });

  // 4) Identify root function nodes:
  //    (1) parentIndex is null/negative, or
  //    (2) parent's nodeType != "Function"
  const rootFunctions = [];
  jsonManager.nodes.forEach((node, idx) => {
    if (node.nodeType === "Function") {
      const parentIndex = node.parentIndex;
      if (
        parentIndex === null ||
        parentIndex < 0 ||
        indexToNode[parentIndex].nodeType !== "Function"
      ) {
        rootFunctions.push(node);
      }
    }
  });

  return rootFunctions;
}

/**
 * Recursive component that displays a single function node.
 * - Expands/collapses if it has child function nodes.
 * - Renders a "Select" button to pick this node.
 */
function FunctionTreeItem({ node, onSelect }) {
  // Local expanded/collapsed state
  const [expanded, setExpanded] = useState(false);

  // If node has child function nodes
  const hasChildren = node.children && node.children.length > 0;

  const toggleExpand = (e) => {
    e.stopPropagation(); // so we don't conflict with the button's click
    setExpanded((prev) => !prev);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    onSelect(node);
  };

  return (
    <li style={{ margin: "4px 0" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: hasChildren ? "pointer" : "default",
        }}
        onClick={toggleExpand}
      >
        {hasChildren && (
          <span style={{ marginRight: "6px", fontSize: "0.8rem" }}>
            {expanded ? "▼" : "►"}
          </span>
        )}
        {!hasChildren && <span style={{ marginRight: "14px" }} />}
        {/* just spacing if no children */}

        <button
          style={{ marginRight: "8px" }}
          onClick={handleSelect}
        >
          Select
        </button>
        <span>{node.nodeMethodName || "UnnamedMethod"}</span>
      </div>
      {hasChildren && expanded && (
        <ul style={{ listStyle: "none", marginLeft: "20px", paddingLeft: 0 }}>
          {node.children.map((child, idx) => (
            <FunctionTreeItem key={idx} node={child} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
}

FunctionTreeItem.propTypes = {
  node: PropTypes.object.isRequired,   // a single function node
  onSelect: PropTypes.func.isRequired, // callback when user clicks "Select"
};

/**
 * Main component that:
 *  - Builds the function tree from jsonManager
 *  - Renders root-level function nodes, each of which
 *    recursively renders children
 *  - Calls onSelectMethod when user selects a node
 */
export default function MethodTreeView({ jsonManager, onSelectMethod, className }) {
  // Build the tree once
  const rootFunctions = useMemo(() => buildFunctionTree(jsonManager), [jsonManager]);

  if (!jsonManager || !jsonManager.nodes) {
    return <div className={className}>No jsonManager or nodes available.</div>;
  }

  if (rootFunctions.length === 0) {
    return <div className={className}>No function nodes found.</div>;
  }

  // On "Select" we find the node's index in jsonManager.nodes, pass to onSelectMethod
  const handleSelectNode = (node) => {
    const idx = jsonManager.nodes.indexOf(node);
    onSelectMethod(idx);
  };

  return (
    <div className={className}>
      <h3>Method Hierarchy (Tree)</h3>
      <ul style={{ listStyle: "none", paddingLeft: 0 }}>
        {rootFunctions.map((rootNode, i) => (
          <FunctionTreeItem
            key={i}
            node={rootNode}
            onSelect={handleSelectNode}
          />
        ))}
      </ul>
    </div>
  );
}

MethodTreeView.propTypes = {
  jsonManager: PropTypes.object,
  onSelectMethod: PropTypes.func.isRequired,
  className: PropTypes.string,
};
// MethodView.js
import React from "react";
import PropTypes from "prop-types";

export default function MethodView({ jsonManager, onSelectMethod, className }) {
  // If no jsonManager or its nodes are missing, bail out
  if (!jsonManager || !jsonManager.nodes) {
    return (
      <div className={className}>
        <h3>Methods</h3>
        <p>No jsonManager or no nodes available.</p>
      </div>
    );
  }

  // Filter out only the nodes that are `nodeType = "Function"`.
  const methods = jsonManager.nodes.filter((node) => node.nodeType === "Function");

  if (methods.length === 0) {
    return (
      <div className={className}>
        <h3>Methods</h3>
        <p>No methods available.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <h3>Methods</h3>
      <select
        className="method-view-dropdown"
        onChange={(e) => {
          const idx = parseInt(e.target.value, 10);
          if (!isNaN(idx)) {
            const methodNode = methods[idx];
            // Pass the node’s index in jsonManager.nodes or the node itself
            onSelectMethod(jsonManager.nodes.indexOf(methodNode));
          }
        }}
      >
        <option value="">-- Select a method --</option>
        {methods.map((m, i) => (
          <option key={i} value={i}>
            {/* Show the method name (nodeMethodName) */}
            {m.nodeMethodName || "UnnamedMethod"}
          </option>
        ))}
      </select>
    </div>
  );
}

MethodView.propTypes = {
  jsonManager: PropTypes.object, // or shape
  onSelectMethod: PropTypes.func.isRequired,
  className: PropTypes.string
};
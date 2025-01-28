import React from 'react';
import PropTypes from 'prop-types';

/**
 * Renders a tree/list of all TraceNodes from your jsonManager.
 *
 * - nodes: an array of all nodes (jsonManager.nodes).
 * - onSelectTraceNode: callback, called when user clicks a node in the tree,
 *                      typically so you can highlight in the code editor.
 * - hoveredTraceId: if you want to highlight an item when user hovers code,
 *                   pass the traceId here (optional).
 */
export default function TraceTree({ nodes, onSelectTraceNode, hoveredTraceId }) {
  if (!nodes || nodes.length === 0) {
    return <div>No trace data.</div>;
  }

  return (
    <div style={{ overflowY: 'auto', maxHeight: '200px', border: '1px solid #666' }}>
      <h3>Trace Tree</h3>
      <ul style={{ paddingLeft: '1rem' }}>
        {nodes.map((node, idx) => (
          <li
            key={node.traceId || idx}
            style={{
              backgroundColor:
                hoveredTraceId && hoveredTraceId === node.traceId
                  ? 'yellow'
                  : 'transparent',
            }}
            onClick={() => onSelectTraceNode(node)}
          >
            {/* Show ID and maybe method name */}
            <b>{node.traceId}</b> {/* Use node.traceId directly */}
            ({node.nodeType}
            {node.nodeMethodName ? `: ${node.nodeMethodName}` : ''})
          </li>
        ))}
      </ul>
    </div>
  );
}

TraceTree.propTypes = {
  nodes: PropTypes.array.isRequired,
  onSelectTraceNode: PropTypes.func.isRequired,
  hoveredTraceId: PropTypes.string,
};
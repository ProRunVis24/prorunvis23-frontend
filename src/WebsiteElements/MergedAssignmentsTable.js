import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

function MergedAssignmentsTable({ traceId, projectId, selectedVariable }) {
  const [allRows, setAllRows] = useState([]);

  useEffect(() => {
    // Only fetch data if both traceId and projectId are available
    if (!traceId || !projectId) return;

    // Fetch processed trace (the array of nodes) using projectId
    fetch(`/api/jbmc/flatten?projectId=${projectId}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load processed trace for projectId=${projectId}`);
        }
        return res.json();
      })
      .then((nodeList) => {
        // Flatten each node’s jbmcValues to produce an array of rows
        const flattened = flattenAssignments(nodeList);
        setAllRows(flattened);
      })
      .catch((err) => {
        console.error("Error fetching or flattening merged JBMC data:", err);
      });
  }, [traceId, projectId, selectedVariable]);

  // Filter the rows if a selectedVariable is provided
  const rowsToDisplay = selectedVariable
    ? allRows.filter(row => row.variableName === selectedVariable)
    : allRows;

  return (
    <div style={{ margin: "1rem", padding: "1rem", backgroundColor: "#2A2A2A" }}>
      <h3>Merged JBMC/Trace Assignments</h3>
      {rowsToDisplay.length === 0 ? (
        <p>No variable assignments to display (maybe no merges or no JBMC data, or no matching variable).</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={thStyle}>Node Trace ID</th>
              <th style={thStyle}>Variable</th>
              <th style={thStyle}>Iteration</th>
              <th style={thStyle}>Value</th>
            </tr>
          </thead>
          <tbody>
            {rowsToDisplay.map((row, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{row.nodeTraceId}</td>
                <td style={tdStyle}>{row.variableName}</td>
                <td style={tdStyle}>{row.iteration}</td>
                <td style={tdStyle}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

MergedAssignmentsTable.propTypes = {
  traceId: PropTypes.string.isRequired,
  projectId: PropTypes.string.isRequired,
  selectedVariable: PropTypes.string // optional
};

// Helper function to flatten each node's jbmcValues
function flattenAssignments(nodeList) {
  const result = [];
  nodeList.forEach((node) => {
    if (!node.jbmcValues) return;
    Object.entries(node.jbmcValues).forEach(([varName, varValues]) => {
      varValues.forEach((valObj) => {
        result.push({
          nodeTraceId: valObj.traceId,
          variableName: varName,
          iteration: valObj.iteration,
          value: valObj.value
        });
      });
    });
  });
  return result;
}

// Inline styles for table headers and cells
const thStyle = {
  border: "1px solid gray",
  backgroundColor: "#444",
  padding: "6px"
};
const tdStyle = {
  border: "1px solid gray",
  padding: "6px"
};

export default MergedAssignmentsTable;
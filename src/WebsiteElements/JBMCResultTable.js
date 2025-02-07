// src/WebsiteElements/JBMCResultTable.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Minimal JBMC Viewer:
 * Fetches JBMC’s JSON (an array of variable assignments) and displays them in a table.
 *
 * @param {string} instrumentId - The unique ID referencing local_storage/<instrumentId>.
 */
export default function JBMCResultTable({ instrumentId }) {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    console.log("[JBMCResultTable] instrumentId:", instrumentId);
    if (!instrumentId) {
      console.warn("[JBMCResultTable] No instrumentId provided.");
      return;
    }

    fetch(`/api/jbmc/result/${instrumentId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch JBMC result (status: ${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("[JBMCResultTable] Fetched data:", data);
        if (Array.isArray(data)) {
          setAssignments(data);
        } else {
          console.warn("[JBMCResultTable] Expected an array but got:", data);
          setAssignments([]);
        }
      })
      .catch((error) => {
        console.error("[JBMCResultTable] Error fetching JBMC result:", error);
      });
  }, [instrumentId]);

  return (
    <div>
      <h2>JBMC Assignments</h2>
      {assignments.length === 0 ? (
        <p>No assignments to display.</p>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={thStyle}>Variable</th>
              <th style={thStyle}>Value</th>
              <th style={thStyle}>File</th>
              <th style={thStyle}>Line</th>
              <th style={thStyle}>Iteration</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((assign, idx) => (
              <tr key={idx}>
                <td style={tdStyle}>{assign.variableName}</td>
                <td style={tdStyle}>{assign.value}</td>
                <td style={tdStyle}>{assign.file}</td>
                <td style={tdStyle}>{assign.line}</td>
                <td style={tdStyle}>{assign.iteration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

JBMCResultTable.propTypes = {
  instrumentId: PropTypes.string.isRequired,
};

// Inline CSS for table styling
const thStyle = {
  border: '1px solid black',
  backgroundColor: '#ccc',
  padding: '8px',
};

const tdStyle = {
  border: '1px solid black',
  padding: '6px',
};
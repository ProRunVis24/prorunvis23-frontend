// StaticMethodsView.js
import React, { useEffect, useState } from 'react';

const StaticMethodsView = () => {
  const [methods, setMethods] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch the static methods from the endpoint when the component mounts
  useEffect(() => {
    setLoading(true);
    fetch('/api/static-methods')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok.');
        }
        return response.json();
      })
      .then((data) => {
        setMethods(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '1rem', backgroundColor: '#222', color: '#fff' }}>
      <h2>Static Methods (Extracted from Source Code)</h2>
      {loading && <div>Loading static methods...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {methods && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(methods, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default StaticMethodsView;
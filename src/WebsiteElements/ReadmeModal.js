import React from 'react';
import PropTypes from 'prop-types';
import '../Css/App.css'; // Ensure your CSS defines the classes used below

export default function ReadmeModal({ closeModal }) {
  return (
    <div className="help-modal-content">


      {/* MAIN CONTENT */}
      <main className="help-main">
        <h2>Welcome to ProRunVis</h2>
        <p>
          ProRunVis is an advanced visualization tool that helps you understand and analyze the execution flow of Java programs.
          By instrumenting, tracing, and visualizing your code, it reveals how your program actually runs &ndash; showing control flow, method calls, loops,
          and execution paths that might otherwise be difficult to understand.
        </p>

        <h3>How It Works:</h3>
        <ol>
          <li>
            <strong>Upload Your Java Project</strong>
            <p>
              Use the file browser on the left panel to upload a Java project directory.
              ProRunVis works best with self-contained Java projects without external dependencies.
            </p>
          </li>
          <li>
            <strong>Instrument &amp; Trace</strong>
            <p>
              Use the &quot;Instrument&quot; button in the middle panel to prepare your code for analysis.
              Then &quot;Trace&quot; to run your program and collect execution data.
              ProRunVis automatically inserts trace points throughout your code to track execution.
            </p>
          </li>
          <li>
            <strong>Process &amp; Visualize</strong>
            <p>
              Click &quot;Process&quot; to analyze the trace data, then &quot;Visualize&quot; to see the execution flow in the editor.
              Your code will be displayed with color-coded highlights showing the actual execution path.
            </p>
          </li>
          <li>
            <strong>Explore &amp; Analyze</strong>
            <p>
              Use the interactive visualizations to explore method calls, loops, and execution paths.
              You can also run JBMC analysis to see variable assignments and potential issues in your code.
            </p>
          </li>
        </ol>

        <h3>Visualization Guide:</h3>
        <ul>
          <li><strong>Green highlights</strong> show executed code segments in the current context</li>
          <li><strong>Blue highlights</strong> indicate function calls and jumps &ndash; click to navigate to target locations</li>
          <li><strong>Purple highlights</strong> show loops &ndash; click to select specific iterations</li>
          <li><strong>Red highlights</strong> indicate inactive or unreachable code in the current execution path</li>
        </ul>

        <h3>Advanced Features:</h3>
        <ul>
          <li><strong>Method Tree View:</strong> Explore the hierarchy of function calls in your code</li>
          <li><strong>Trace Tree:</strong> See a sequential list of all execution points</li>
          <li><strong>JBMC Integration:</strong> Run the Java Bounded Model Checker to identify potential bugs and analyze variable states</li>
        </ul>

        <h3>Getting Started:</h3>
        <p>
          Try uploading a simple Java project first to get familiar with the workflow.
          Check the Help button in the navigation bar for a detailed tutorial.
        </p>
      </main>

      {/* FOOTER */}
      <footer className="help-footer">
        <button onClick={closeModal} className="modal-close-button">
          Close
        </button>
      </footer>
    </div>
  );
}

ReadmeModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
};

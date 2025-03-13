// Imports the React module.
import React from 'react';

// Imports the ReactDom module from 'react-dom/client'(refers to newest react version).
import {createRoot} from 'react-dom/client';

// Imports CSS-File for styling.
import './Css/App.css';

// Imports the App-component from App.js.
import App from './App.js';

// Imports the function reportWebVitals for measuring the performance of the web application.
import reportWebVitals from './ReportWebVitals.js';

// Determines the DOM-Element with the ID 'root' that is used as an anchor point for the React application.
const rootElement = document.getElementById('root');

// Checks if the 'rootElement' is present to prevent errors.
if (rootElement) {
    // Creates the Root-Element through 'createRoot' from 'react-dom/client'.
    const root = createRoot(rootElement);

    // Uses 'root.render()', to render the app-component inside the <React.StrictMode>-wrapper.
    // <React.StrictMode> is used to activate additional tests and warnings for the app.
    root.render(
        <React.StrictMode>
            <App/>
        </React.StrictMode>
    );
}

// Create a button to open a new project session
document.addEventListener('DOMContentLoaded', function() {
    // Create new project button
    var newProjectBtn = document.createElement('button');
    newProjectBtn.textContent = 'New Project';
    newProjectBtn.style.position = 'fixed';
    newProjectBtn.style.bottom = '20px';
    newProjectBtn.style.right = '20px';
    newProjectBtn.style.padding = '10px 20px';
    newProjectBtn.style.backgroundColor = '#4CAF50';
    newProjectBtn.style.color = 'white';
    newProjectBtn.style.border = 'none';
    newProjectBtn.style.borderRadius = '5px';
    newProjectBtn.style.cursor = 'pointer';
    newProjectBtn.style.zIndex = '1000';

    newProjectBtn.addEventListener('click', function() {
        window.open('/new-project', '_blank');
    });


});

// reportWebVitals is called to capture performance data and report it.
// This can be used for analysing and optimizing the performance.
// More information about this process can be found here: https://bit.ly/CRA-vitals
reportWebVitals(console.log);  //'console.log' gets passed on as an example-callback-function.
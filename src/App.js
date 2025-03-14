// App.js
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types'; // Add this import
import Navbar from "./WebsiteElements/Navbar";
import WebsiteContainer from "./WebsiteContainer";
import "./Css/App.css";

/**
 * Observes Left/RightContainer for correct resizing. Prohibits sending too many requests to DOM, which causes a Runtime Error.
 */
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Welcome Screen Component
function WelcomeScreen({ onEnterApp }) {
    return (
        <div className="welcome-container">
            <div className="welcome-content">
                <img
                    src="/CDProRunVis.png"
                    alt="ProRunVis Logo"
                    className="welcome-logo"
                />
                <h1>Welcome to ProRunVis</h1>
                <p>A visualization tool for understanding program control flow</p>

                <div className="welcome-buttons">
                    <button className="open-button" onClick={onEnterApp}>
                        Open Project
                    </button>
                    <button
                        className="new-button"
                        onClick={() => window.open('/new-project', '_blank')}
                    >
                        Create New Project
                    </button>
                </div>
            </div>
        </div>
    );
}

// Add prop-types validation here
WelcomeScreen.propTypes = {
    onEnterApp: PropTypes.func.isRequired
};

// Rest of your App component stays the same
function App() {
    const contentRef = useRef(null);
    const [showWelcome, setShowWelcome] = useState(true);

    useEffect(() => {
        const handleResize = debounce(() => {
        }, 100);

        const observer = new ResizeObserver(handleResize);
        if (contentRef.current) {
            observer.observe(contentRef.current);
        }

        return () => observer.disconnect(); // Cleanup-Function and disconnects
    }, []);

    // If showing welcome screen
    if (showWelcome) {
        return <WelcomeScreen onEnterApp={() => setShowWelcome(false)} />;
    }

    // Otherwise show the main app
    return (
        <div className="App" ref={contentRef}>
            <Navbar />
            <WebsiteContainer />
        </div>
    );
}

export default App;
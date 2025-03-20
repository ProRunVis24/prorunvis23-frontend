import React from 'react';
import ReactJson from '@microlink/react-json-view';
import '../Css/App.css';
import PropTypes from 'prop-types';

function JsonViewer({ jsonData, onElementClick }) {
    const handleJsonClick = (click) => {
        if (onElementClick) {
            if (click.updated_src) {
                onElementClick(click.updated_src);
            } else if (click.namespace) {
                onElementClick(click.namespace);
            }
        }
    };

    const handleDownload = () => {
        const fileName = 'data.json';
        const jsonStr = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="json-viewer">
            <h2>JSON-Datei anzeigen</h2>
            <div className="json-display">
                <ReactJson
                    src={jsonData}
                    theme="monokai"
                    collapsed={2}
                    enableClipboard={true}
                    onEdit={handleJsonClick}
                    onDelete={handleJsonClick}
                    onAdd={handleJsonClick}
                    onSelect={handleJsonClick}
                />
            </div>
            <button onClick={handleDownload} className="download-button">
                JSON-Datei herunterladen
            </button>
        </div>
    );
}

JsonViewer.propTypes = {
    jsonData: PropTypes.object.isRequired,
    onElementClick: PropTypes.func
};

export default JsonViewer;
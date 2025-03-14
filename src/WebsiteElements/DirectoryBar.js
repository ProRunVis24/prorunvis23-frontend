// DirectoryBar.js
import React, { useEffect, useState } from 'react';
import FolderTree from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';
import "../Css/App.css";
import PropTypes from "prop-types";
/**
 * Represents the left component that displays a folder tree of Java files.
 * Files are uploaded into a project-specific folder (resources/in/project-[projectId]).
 * The projectId is passed as a prop.
 */
function DirectoryBar({ setDisplayedFile, setDisplayedToActive, passOnUploadedFiles, passOnJsonData, projectId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [folderTreeData, setFolderTreeData] = useState(null);
  const [isLeftContainerCollapsed, setIsLeftContainerCollapsed] = useState(false);
  const [uploadedJsonFile, setUploadedJsonFile] = useState(null);
  // Handle file upload and build folder tree
  const handleFileUpload = (event) => {
    const filteredFiles = Array.from(event.target.files).filter(file =>
      file.webkitRelativePath.endsWith('.java')
    );
    setUploadedFiles(filteredFiles);
    if (filteredFiles.length > 0) {
      const directoryName = filteredFiles[0].webkitRelativePath.split('/')[0];
      const treeData = buildFolderTree(filteredFiles, directoryName);
      setFolderTreeData(treeData);
    }
  };
  const buildFolderTree = (fileList, directoryName) => {
    const root = { name: directoryName, isOpen: true, children: [] };
    let i = 0;
    fileList.forEach(file => {
      const splitPath = file.webkitRelativePath.split('/');
      let currentLevel = root;
      splitPath.forEach((part, index) => {
        if (index > 0) {
          const nodeName = part.replace('.java', '');
          let existingNode = currentLevel.children.find(child => child.name === nodeName);
          const isDirectory = index < splitPath.length - 1;
          if (!isDirectory && !existingNode) {
            existingNode = {
              name: nodeName,
              realPath: file.webkitRelativePath,
              index: i,
              children: isDirectory ? [] : undefined
            };
            i++;
            currentLevel.children.push(existingNode);
          } else if (!existingNode) {
            existingNode = { name: nodeName, children: isDirectory ? [] : undefined };
            currentLevel.children.push(existingNode);
          }
          currentLevel = existingNode;
        }
      });
    });
    return root;
  };
  const toggleLeftContainer = () => {
    setIsLeftContainerCollapsed(!isLeftContainerCollapsed);
  };
  // When a file node is clicked, set it as the displayed file
  const onNameClick = ({ nodeData }) => {
    const { realPath, index } = nodeData;
    if (realPath != null) {
      setDisplayedFile(uploadedFiles[index]);
    }
  };
  // Handle JSON file upload (for uploading processed JSON, etc.)
  const handleJsonFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedJsonFile(file);
      uploadJsonFileToBackend(file);
    }
  };
  const uploadJsonFileToBackend = async (file) => {
    if (!projectId) {
      alert('Please enter a Project ID before uploading JSON files');
      return;
    }
    const formData = new FormData();
    formData.append('jsonFile', file);
    formData.append('projectId', projectId);
    try {
      const response = await fetch('/api/upload-json', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const jsonData = await response.json();
        passOnJsonData(jsonData);
        alert('JSON file successfully uploaded!');
      } else {
        alert('Error uploading JSON file.');
      }
    } catch (error) {
      console.error('Error uploading JSON file:', error);
      alert('An unexpected error occurred.');
    }
  };
  // When uploadedFiles change, pass them upward
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      passOnUploadedFiles(uploadedFiles);
    }
  }, [uploadedFiles]);
  return (
    <main className={`left-container ${isLeftContainerCollapsed ? 'collapsed' : ''}`}>
      <button
        className="left-container-toggle"
        onClick={toggleLeftContainer}
        title={isLeftContainerCollapsed ? "Expand directory" : "Collapse directory"}
      >
        {isLeftContainerCollapsed ? '►' : '◄'}
      </button>
      <div className="left-container-content">
        <button onClick={setDisplayedToActive} className="jump-button">
          Jump to active function
        </button>
        {/* Display current project ID */}
        <div className="project-id-display">
          Project ID: {projectId || 'Not set'}
        </div>
        <div className="upload-button-container">
          <form id="upload-form" className="text-box" encType="multipart/form-data">
            <input type="hidden" name="projectId" value={projectId || ''} />
            <input
              type="file"
              name="file"
              multiple
              webkitdirectory=""
              onChange={handleFileUpload}
              className="picker"
            />
          </form>
        </div>
        <div className="upload-json-container">
          <form id="json-upload-form" encType="multipart/form-data">
            <input type="hidden" name="projectId" value={projectId || ''} />
            <input
              type="file"
              name="jsonFile"
              accept=".json"
              onChange={handleJsonFileUpload}
              className="picker"
            />
          </form>
        </div>
        {folderTreeData && (
          <div className="folder-tree-container">
            <FolderTree
              data={folderTreeData}
              onNameClick={onNameClick}
              showCheckbox={false}
              readOnly={true}
              indentPixels={15}
            />
          </div>
        )}
      </div>
    </main>
  );
}
DirectoryBar.propTypes = {
  setDisplayedFile: PropTypes.func.isRequired,
  setDisplayedToActive: PropTypes.func.isRequired,
  passOnUploadedFiles: PropTypes.func.isRequired,
  passOnJsonData: PropTypes.func.isRequired,
  projectId: PropTypes.string
};
export default DirectoryBar;

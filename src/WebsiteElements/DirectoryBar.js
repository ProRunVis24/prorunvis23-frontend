import React, { useEffect, useState } from 'react';
import FolderTree from 'react-folder-tree';
import 'react-folder-tree/dist/style.css';
import "../Css/App.css";
import PropTypes from "prop-types";

/**
 * Left-side component for uploading a Java folder and optionally a JSON file.
 * There's no direct display of project ID here; we rely on the parent's single
 * "Project ID" field.
 */
function DirectoryBar({
  setDisplayedFile,
  setDisplayedToActive,
  passOnUploadedFiles,
  passOnJsonData,
  projectId
}) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [folderTreeData, setFolderTreeData] = useState(null);
  const [isLeftContainerCollapsed, setIsLeftContainerCollapsed] = useState(false);

  // Called when user picks a local folder containing .java files
  const handleFileUpload = (event) => {
    const filteredFiles = Array.from(event.target.files).filter(file =>
      file.webkitRelativePath.endsWith('.java')
    );
    setUploadedFiles(filteredFiles);

    if (filteredFiles.length > 0) {
      const folderName = filteredFiles[0].webkitRelativePath.split('/')[0];
      const treeData = buildFolderTree(filteredFiles, folderName);
      setFolderTreeData(treeData);
    }
  };

  // Build a "folder tree" data structure for FolderTree
  const buildFolderTree = (fileList, rootFolderName) => {
    const root = { name: rootFolderName, isOpen: true, children: [] };
    let i = 0;

    fileList.forEach((file) => {
      const pathParts = file.webkitRelativePath.split('/');
      let currentLevel = root;

      pathParts.forEach((part, idx) => {
        if (idx > 0) {
          const nodeName = part.replace('.java', '');
          let existing = currentLevel.children.find(child => child.name === nodeName);
          const isDirectory = idx < pathParts.length - 1;

          if (!isDirectory && !existing) {
            existing = {
              name: nodeName,
              realPath: file.webkitRelativePath,
              index: i,
              children: undefined,
            };
            currentLevel.children.push(existing);
            i++;
          } else if (!existing) {
            existing = { name: nodeName, children: [] };
            currentLevel.children.push(existing);
          }
          currentLevel = existing;
        }
      });
    });

    return root;
  };

  // Toggle the collapsed/expanded state of the left container
  const toggleLeftContainer = () => {
    setIsLeftContainerCollapsed(!isLeftContainerCollapsed);
  };

  // When user clicks on a node (file) in FolderTree
  const onNameClick = ({ nodeData }) => {
    const { realPath, index } = nodeData;
    if (realPath != null) {
      setDisplayedFile(uploadedFiles[index]);
    }
  };

  // Handle JSON file upload
  const handleJsonFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      uploadJsonFileToBackend(file);
    }
  };

  // POST the JSON file to the server
  const uploadJsonFileToBackend = async (file) => {
    if (!projectId) {
      alert("Please enter a Project ID before uploading JSON files");
      return;
    }

    const formData = new FormData();
    formData.append('jsonFile', file);
    formData.append('projectId', projectId);

    try {
      const res = await fetch('/api/upload-json', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        alert("Error uploading JSON file.");
        return;
      }
      const jsonData = await res.json();
      passOnJsonData(jsonData);
      alert("JSON file successfully uploaded!");
    } catch (error) {
      console.error("Error uploading JSON file:", error);
      alert("An unexpected error occurred.");
    }
  };

  // If `uploadedFiles` changes, pass them upward
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      passOnUploadedFiles(uploadedFiles);
    }
  }, [uploadedFiles, passOnUploadedFiles]);

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

        {/* Only a hidden input for projectId is used by the forms */}
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
  projectId: PropTypes.string,
};

export default DirectoryBar;
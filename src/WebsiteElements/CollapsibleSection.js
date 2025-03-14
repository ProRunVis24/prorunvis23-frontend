import React, { useState } from 'react';
import PropTypes from 'prop-types';
const CollapsibleSection = ({ title, defaultOpen = true, className = '', children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible-section ${className} ${isOpen ? 'expanded' : 'collapsed'}`}>
      <div className="collapsible-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span className="collapse-icon">{isOpen ? '▼' : '►'}</span>
      </div>
      {isOpen && <div className="collapsible-content">{children}</div>}
    </div>
  );
};
CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  defaultOpen: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node
};
export default CollapsibleSection;
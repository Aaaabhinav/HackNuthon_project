import { useState, useEffect } from 'react';

const FunctionalRequirements = ({ structureData, htmlData, onRequirementsUpdate }) => {
  const [requirements, setRequirements] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newRequirement, setNewRequirement] = useState('');

  // Generate initial requirements based on structure and HTML data
  useEffect(() => {
    if (structureData && htmlData) {
      // Parse the structure data if it's a string
      const parsedStructure = typeof structureData === 'string' 
        ? JSON.parse(structureData) 
        : structureData;
      
      // Auto-generate initial requirements based on the structure
      const generatedRequirements = [
        `The website must display content from URL: ${parsedStructure.url || 'provided URL'}`,
        `Header must include main title: "${parsedStructure.title || 'Page Title'}"`,
        `Navigation should include ${parsedStructure.links?.length || 0} links`,
        `Page must be responsive and display correctly on various devices`,
        `All images must have proper alt text for accessibility`,
        `Form inputs must include validation for user entries`,
        `Website must maintain the visual style represented in the design`,
      ];
      
      setRequirements(generatedRequirements);
      
      // Call the callback to notify parent component
      if (onRequirementsUpdate) {
        onRequirementsUpdate(generatedRequirements);
      }
    }
  }, [structureData, htmlData, onRequirementsUpdate]);

  const handleAddRequirement = () => {
    if (newRequirement.trim()) {
      const updatedRequirements = [...requirements, newRequirement.trim()];
      setRequirements(updatedRequirements);
      setNewRequirement('');
      
      // Call the callback to notify parent component
      if (onRequirementsUpdate) {
        onRequirementsUpdate(updatedRequirements);
      }
    }
  };

  const handleEditStart = (index) => {
    setEditingIndex(index);
    setNewRequirement(requirements[index]);
  };

  const handleEditSave = () => {
    if (editingIndex !== null && newRequirement.trim()) {
      const updatedRequirements = [...requirements];
      updatedRequirements[editingIndex] = newRequirement.trim();
      setRequirements(updatedRequirements);
      setEditingIndex(null);
      setNewRequirement('');
      
      // Call the callback to notify parent component
      if (onRequirementsUpdate) {
        onRequirementsUpdate(updatedRequirements);
      }
    }
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setNewRequirement('');
  };

  const handleDeleteRequirement = (index) => {
    const updatedRequirements = requirements.filter((_, i) => i !== index);
    setRequirements(updatedRequirements);
    
    // Call the callback to notify parent component
    if (onRequirementsUpdate) {
      onRequirementsUpdate(updatedRequirements);
    }
  };

  const handleRequirementChange = (e) => {
    setNewRequirement(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (editingIndex !== null) {
        handleEditSave();
      } else {
        handleAddRequirement();
      }
    }
  };

  return (
    <div className="card requirements-card">
      <div className="card-header">
        <h5>Functional Requirements</h5>
      </div>
      <div className="card-body">
        <div className="requirements-list">
          {requirements.length === 0 ? (
            <p className="placeholder-text">Requirements will appear here after analysis</p>
          ) : (
            <ul className="list-group">
              {requirements.map((req, index) => (
                <li key={index} className="list-group-item requirement-item">
                  {editingIndex === index ? (
                    <div className="edit-requirement">
                      <input
                        type="text"
                        className="form-control"
                        value={newRequirement}
                        onChange={handleRequirementChange}
                        onKeyPress={handleKeyPress}
                        autoFocus
                      />
                      <div className="edit-buttons">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={handleEditSave}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleEditCancel}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="requirement-content">
                      <span>{req}</span>
                      <div className="requirement-actions">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEditStart(index)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteRequirement(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="add-requirement">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Add new requirement..."
              value={newRequirement}
              onChange={handleRequirementChange}
              onKeyPress={handleKeyPress}
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleAddRequirement}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FunctionalRequirements;

import { useState } from 'react';
import PropTypes from 'prop-types';
import './Dashboard.css';
import { useUserData } from './hooks/useUserData';
import { useFileUpload } from './hooks/useFileUpload';
import { useFileProcessing } from './hooks/useFileProcessing';
import UserInfoCard from './UserInfoCard';
import FileUploadSection from './FileUploadSection';
import ParametersSection from './ParametersSection';
import OutputSection from './OutputSection';
import QualityMetricsSection from './QualityMetricsSection';

/**
 * Dashboard component for SMOTE image augmentation processing
 * Handles file upload, parameter configuration, and displays processing results
 * @param {Object} props - Component props
 * @param {string} props.token - JWT authentication token
 * @param {Function} props.onLogout - Logout callback function
 */
function Dashboard({ token, onLogout }) {
  // Fetch user data with authentication
  const { user, loading } = useUserData(token, onLogout);
  
  // File upload state and handlers
  const {
    zipFile,
    dragActive,
    fieldErrors,
    setFieldErrors,
    handleDrag,
    handleDrop,
    handleFileChange,
    clearFile,
  } = useFileUpload();

  // File processing state and handlers
  const {
    submitting,
    error,
    success,
    outputInfo,
    metricsData,
    validateField,
    processFile,
  } = useFileProcessing(token);

  // SMOTE parameters state
  const [kNeighbour, setKNeighbour] = useState('');
  const [targetRatio, setTargetRatio] = useState('');
  const [randomState, setRandomState] = useState('');

  /**
   * Handle input field changes with validation
   * @param {string} name - Input field name
   * @param {string} value - Input field value
   */
  const handleInputChange = (name, value) => {
    const setters = {
      kNeighbour: setKNeighbour,
      targetRatio: setTargetRatio,
      randomState: setRandomState,
    };

    const setter = setters[name];
    if (setter) {
      setter(value);
    }

    // Validate field and update error state
    const errors = validateField(name, value, zipFile);
    setFieldErrors((prev) => ({ 
      ...prev, 
      ...errors, 
      [name]: errors[name] || '',
    }));
  };

  /**
   * Handle form submission for file processing
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await processFile(zipFile, kNeighbour, targetRatio, randomState);
    
    // Clear form on success
    if (result.success) {
      const fileInput = document.getElementById('fileInput');
      if (fileInput) {
        fileInput.value = '';
      }
      clearFile();
      setKNeighbour('');
      setTargetRatio('');
      setRandomState('');
      setFieldErrors({});
    } else if (result.errors) {
      setFieldErrors(result.errors);
    }
  };

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header with logout button */}
        <div className="dashboard-header">
          <div className="header-text">
            <h1>Dashboard</h1>
            <p className="header-subtitle">Apply SMOTE to your datasets here.</p>
          </div>
          <button type="button" onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        {/* User information card */}
        <UserInfoCard user={user} />

        {/* File processing form */}
        <div className="processing-card">
          <h2 className="card-title">File Processing</h2>

          {/* Error message display */}
          {error && (
            <div className="message message-error">
              <span className="message-icon">!</span>
              <p>{error}</p>
            </div>
          )}
          
          {/* Success message display */}
          {success && (
            <div className="message message-success">
              <span className="message-icon">✓</span>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-layout">
              {/* Left section: Input parameters */}
              <div className="left-section">
                <h3 className="section-title">Input Parameters</h3>

                <FileUploadSection
                  zipFile={zipFile}
                  dragActive={dragActive}
                  fieldErrors={fieldErrors}
                  handleDrag={handleDrag}
                  handleDrop={handleDrop}
                  handleFileChange={handleFileChange}
                />

                <ParametersSection
                  kNeighbour={kNeighbour}
                  targetRatio={targetRatio}
                  randomState={randomState}
                  fieldErrors={fieldErrors}
                  handleInputChange={handleInputChange}
                />

                {/* Submit button with loading state */}
                <button
                  type="submit"
                  disabled={submitting}
                  className={`submit-btn ${submitting ? 'submit-btn-disabled' : ''}`}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-small" />
                      Processing...
                    </>
                  ) : (
                    <>Process File</>
                  )}
                </button>
              </div>

              {/* Right section: Output information */}
              <div className="right-section">
                <h3 className="section-title">Output Information</h3>
                <OutputSection outputInfo={outputInfo} />
              </div>
            </div>
          </form>
        </div>

        {/* Quality metrics section (shown after processing) */}
        <QualityMetricsSection metricsData={metricsData} />
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  token: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Dashboard;
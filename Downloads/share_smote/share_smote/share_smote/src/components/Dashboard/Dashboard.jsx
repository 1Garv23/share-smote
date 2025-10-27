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

function Dashboard({ token, onLogout }) {
  const { user, loading } = useUserData(token, onLogout);
  
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

  const {
    submitting,
    error,
    success,
    outputInfo,
    validateField,
    processFile,
  } = useFileProcessing(token);

  const [kNeighbour, setKNeighbour] = useState('');
  const [targetRatio, setTargetRatio] = useState('');
  const [randomState, setRandomState] = useState('');

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

    const errors = validateField(name, value, zipFile);
    setFieldErrors((prev) => ({ 
      ...prev, 
      ...errors, 
      [name]: errors[name] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await processFile(zipFile, kNeighbour, targetRatio, randomState);
    
    if (result.success) {
      clearFile();
      setKNeighbour('');
      setTargetRatio('');
      setRandomState('');
      setFieldErrors({});
    } else if (result.errors) {
      setFieldErrors(result.errors);
    }
  };

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
        <div className="dashboard-header">
          <div className="header-text">
            <h1>Dashboard</h1>
            <p className="header-subtitle">Apply SMOTE to your datasets here.</p>
          </div>
          <button type="button" onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>

        <UserInfoCard user={user} />

        <div className="processing-card">
          <h2 className="card-title">File Processing</h2>

          {error && (
            <div className="message message-error">
              <span className="message-icon">!</span>
              <p>{error}</p>
            </div>
          )}
          
          {success && (
            <div className="message message-success">
              <span className="message-icon">✓</span>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-layout">
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

              <div className="right-section">
                <h3 className="section-title">Output Information</h3>
                <OutputSection outputInfo={outputInfo} />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

Dashboard.propTypes = {
  token: PropTypes.string.isRequired,
  onLogout: PropTypes.func.isRequired,
};

export default Dashboard;
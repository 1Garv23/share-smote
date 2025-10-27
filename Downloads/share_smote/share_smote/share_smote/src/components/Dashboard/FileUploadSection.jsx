import PropTypes from 'prop-types';

function FileUploadSection({ 
  zipFile, 
  dragActive, 
  fieldErrors, 
  handleDrag, 
  handleDrop, 
  handleFileChange,
}) {
  const labelStyles = { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem', 
    fontSize: '0.875rem', 
    fontWeight: '500', 
    color: '#374151',
    marginBottom: '0.5rem',
  };

  const hiddenInputStyles = { 
    display: 'none',
  };

  const handleClick = () => {
    document.getElementById('fileInput').click();
  };

  return (
    <div>
      <label htmlFor="fileInput" style={labelStyles}>
        Upload Dataset
        <span className="required-badge">Required</span>
      </label>
      <div
        className={`upload-area ${dragActive ? 'upload-area-active' : ''} ${fieldErrors.zipFile ? 'input-error' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        role="button"
        tabIndex={0}
      >
        <input
          id="fileInput"
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          style={hiddenInputStyles}
        />
        <div className="upload-content">
          {zipFile ? (
            <>
              <div className="file-icon">FILE</div>
              <div className="file-info">
                <p className="file-label">Selected file:</p>
                <p className="file-name">{zipFile.name}</p>
                <p className="file-size">
                  {(zipFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="upload-icon">UPLOAD</div>
              <div className="upload-text">
                <p className="upload-primary">Drag and drop your .zip file here</p>
                <p className="upload-secondary">or click to browse</p>
              </div>
            </>
          )}
        </div>
      </div>
      {fieldErrors.zipFile && (
        <p className="field-error">! {fieldErrors.zipFile}</p>
      )}
    </div>
  );
}

FileUploadSection.propTypes = {
  zipFile: PropTypes.shape({
    name: PropTypes.string.isRequired,
    size: PropTypes.number.isRequired,
  }),
  dragActive: PropTypes.bool.isRequired,
  fieldErrors: PropTypes.shape({
    zipFile: PropTypes.string,
  }).isRequired,
  handleDrag: PropTypes.func.isRequired,
  handleDrop: PropTypes.func.isRequired,
  handleFileChange: PropTypes.func.isRequired,
};

FileUploadSection.defaultProps = {
  zipFile: null,
};

export default FileUploadSection;
import PropTypes from 'prop-types';

/**
 * Output information display section component
 * Shows processing results after successful file processing
 * @param {Object} props - Component props
 * @param {Object} props.outputInfo - Output information object
 */
function OutputSection({ outputInfo }) {
  const placeholderTextStyles = { 
    fontSize: '0.75rem', 
    marginTop: '0.5rem',
  };

  return (
    <div className="output-section">
      {outputInfo ? (
        <div className="output-info">
          {/* Display output file information */}
          <div className="output-item">
            <span className="output-label">Output File:</span>
            <span className="output-value">{outputInfo.filename}</span>
          </div>
          <div className="output-item">
            <span className="output-label">File Size:</span>
            <span className="output-value">{outputInfo.size}</span>
          </div>
          <div className="output-item">
            <span className="output-label">K Neighbour Used:</span>
            <span className="output-value">{outputInfo.kNeighbour}</span>
          </div>
          <div className="output-item">
            <span className="output-label">Target Ratio Used:</span>
            <span className="output-value">{outputInfo.targetRatio}</span>
          </div>
          <div className="output-item">
            <span className="output-label">Random State Used:</span>
            <span className="output-value">{outputInfo.randomState}</span>
          </div>
        </div>
      ) : (
        <div className="output-placeholder">
          <p>Output information will appear here after processing</p>
          <p style={placeholderTextStyles}>Submit the form to see the results</p>
        </div>
      )}
    </div>
  );
}

OutputSection.propTypes = {
  outputInfo: PropTypes.shape({
    filename: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    kNeighbour: PropTypes.string.isRequired,
    targetRatio: PropTypes.string.isRequired,
    randomState: PropTypes.string.isRequired,
  }),
};

OutputSection.defaultProps = {
  outputInfo: null,
};

export default OutputSection;

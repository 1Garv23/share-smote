import PropTypes from 'prop-types';

/**
 * SMOTE parameters input section component
 * @param {Object} props - Component props
 * @param {string} props.kNeighbour - K neighbour value
 * @param {string} props.targetRatio - Target ratio value
 * @param {string} props.randomState - Random state value
 * @param {Object} props.fieldErrors - Validation errors
 * @param {Function} props.handleInputChange - Input change handler
 */
function ParametersSection({
  kNeighbour,
  targetRatio,
  randomState,
  fieldErrors,
  handleInputChange,
}) {
  /**
   * Validates and sanitizes input for integer fields
   * Only allows positive integers without leading zeros or invalid characters
   * @param {string} value - The input value to validate
   * @returns {boolean} Whether the input is valid
   */
  const isValidIntegerInput = (value) => {
    if (value === '') return true;
    // Allow only digits, no negative signs, decimals, or special characters
    return /^\d+$/.test(value);
  };

  /**
   * Validates and sanitizes input for decimal fields
   * Only allows positive decimals in proper format
   * @param {string} value - The input value to validate
   * @returns {boolean} Whether the input is valid
   */
  const isValidDecimalInput = (value) => {
    if (value === '') return true;
    // Allow digits and at most one decimal point
    return /^\d*\.?\d*$/.test(value);
  };

  /**
   * Handles input for K Neighbour field with strict validation
   * @param {Event} e - The input event
   */
  const handleKNeighbourInput = (e) => {
    const value = e.target.value;
    if (isValidIntegerInput(value)) {
      handleInputChange('kNeighbour', value);
    }
  };

  /**
   * Handles input for Target Ratio field with strict validation
   * @param {Event} e - The input event
   */
  const handleTargetRatioInput = (e) => {
    const value = e.target.value;
    if (isValidDecimalInput(value)) {
      handleInputChange('targetRatio', value);
    }
  };

  /**
   * Handles input for Random State field with strict validation
   * @param {Event} e - The input event
   */
  const handleRandomStateInput = (e) => {
    const value = e.target.value;
    if (isValidIntegerInput(value)) {
      handleInputChange('randomState', value);
    }
  };

  return (
    <div className="parameters-grid">
      {/* K Neighbour parameter input */}
      <div className="param-field">
        <label htmlFor="kNeighbour">
          K Neighbour
          <span className="required-badge">Required</span>
        </label>
        <input
          id="kNeighbour"
          type="text"
          value={kNeighbour}
          onChange={handleKNeighbourInput}
          onBlur={(e) => handleInputChange('kNeighbour', e.target.value)}
          className={fieldErrors.kNeighbour ? 'input-error' : ''}
          placeholder="Enter value (e.g., 5)"
          required
        />
        {fieldErrors.kNeighbour ? (
          <p className="field-error">! {fieldErrors.kNeighbour}</p>
        ) : (
          <p className="param-hint">
            Must be greater than or equal to 2 (required)
          </p>
        )}
      </div>

      {/* Target Ratio parameter input */}
      <div className="param-field">
        <label htmlFor="targetRatio">
          Target Ratio
          <span className="required-badge">Required</span>
        </label>
        <input
          id="targetRatio"
          type="text"
          value={targetRatio}
          onChange={handleTargetRatioInput}
          onBlur={(e) => handleInputChange('targetRatio', e.target.value)}
          className={fieldErrors.targetRatio ? 'input-error' : ''}
          placeholder="Enter value between 0.0 and 1.0"
          required
        />
        {fieldErrors.targetRatio ? (
          <p className="field-error">! {fieldErrors.targetRatio}</p>
        ) : (
          <p className="param-hint">Between 0.0 and 1.0 (required)</p>
        )}
      </div>

      {/* Random State parameter input */}
      <div className="param-field">
        <label htmlFor="randomState">
          Random State
          <span className="required-badge">Required</span>
        </label>
        <input
          id="randomState"
          type="text"
          value={randomState}
          onChange={handleRandomStateInput}
          onBlur={(e) => handleInputChange('randomState', e.target.value)}
          className={fieldErrors.randomState ? 'input-error' : ''}
          placeholder="Enter positive integer (e.g., 42)"
          required
        />
        {fieldErrors.randomState ? (
          <p className="field-error">! {fieldErrors.randomState}</p>
        ) : (
          <p className="param-hint">Must be greater than 0 (required)</p>
        )}
      </div>
    </div>
  );
}

ParametersSection.propTypes = {
  kNeighbour: PropTypes.string.isRequired,
  targetRatio: PropTypes.string.isRequired,
  randomState: PropTypes.string.isRequired,
  fieldErrors: PropTypes.shape({
    kNeighbour: PropTypes.string,
    targetRatio: PropTypes.string,
    randomState: PropTypes.string,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
};

export default ParametersSection;
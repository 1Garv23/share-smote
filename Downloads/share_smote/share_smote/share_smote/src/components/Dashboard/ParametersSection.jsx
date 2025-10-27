import PropTypes from "prop-types";

function ParametersSection({
  kNeighbour,
  targetRatio,
  randomState,
  fieldErrors,
  handleInputChange,
}) {
  return (
    <div className="parameters-grid">
      <div className="param-field">
        <label htmlFor="kNeighbour">
          K Neighbour
          <span className="required-badge">Required</span>
        </label>
        <input
          id="kNeighbour"
          type="number"
          value={kNeighbour}
          onChange={(e) => handleInputChange("kNeighbour", e.target.value)}
          min="2"
          className={fieldErrors.kNeighbour ? "input-error" : ""}
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

      <div className="param-field">
        <label htmlFor="targetRatio">
          Target Ratio
          <span className="required-badge">Required</span>
        </label>
        <input
          id="targetRatio"
          type="number"
          step="0.01"
          value={targetRatio}
          onChange={(e) => handleInputChange("targetRatio", e.target.value)}
          min="0.0"
          max="1.0"
          className={fieldErrors.targetRatio ? "input-error" : ""}
          placeholder="Enter value between 0.0 and 1.0"
          required
        />
        {fieldErrors.targetRatio ? (
          <p className="field-error">! {fieldErrors.targetRatio}</p>
        ) : (
          <p className="param-hint">Between 0.0 and 1.0 (required)</p>
        )}
      </div>

      <div className="param-field">
        <label htmlFor="randomState">
          Random State
          <span className="required-badge">Required</span>
        </label>
        <input
          id="randomState"
          type="number"
          value={randomState}
          onChange={(e) => handleInputChange("randomState", e.target.value)}
          min="0"
          className={fieldErrors.randomState ? "input-error" : ""}
          placeholder="Enter positive integer (e.g., 42)"
          required
        />
        {fieldErrors.randomState ? (
          <p className="field-error">! {fieldErrors.randomState}</p>
        ) : (
          <p className="param-hint">Any positive integer value (required)</p>
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

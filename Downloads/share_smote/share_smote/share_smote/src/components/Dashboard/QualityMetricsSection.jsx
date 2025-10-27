import PropTypes from 'prop-types';

/**
 * Quality metrics display section component
 * Shows SMOTE augmentation quality metrics after processing
 * @param {Object} props - Component props
 * @param {Object} props.metricsData - Quality metrics data object
 */
function QualityMetricsSection({ metricsData }) {
  // Don't render if no metrics data available
  if (!metricsData) {
    return null;
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      marginTop: '1.5rem'
    }}>
      <h3 style={{
        fontSize: '1.15rem',
        fontWeight: '600',
        color: '#1f2937',
        margin: '0 0 1rem 0',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        Quality Metrics
      </h3>
      
      {/* Average quality metrics display */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {/* Cosine Similarity metric */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: '#eff6ff'
        }}>
          <div>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 0.25rem 0'
            }}>
              Average Cosine Similarity
            </p>
            <p style={{
              color: '#1f2937',
              fontWeight: '600',
              fontSize: '1.5rem',
              margin: '0'
            }}>
              {metricsData.average_quality.cosine_similarity.toFixed(4)}
            </p>
          </div>
        </div>
        
        {/* SSIM metric */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          background: '#faf5ff'
        }}>
          <div>
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 0.25rem 0'
            }}>
              Average SSIM
            </p>
            <p style={{
              color: '#1f2937',
              fontWeight: '600',
              fontSize: '1.5rem',
              margin: '0'
            }}>
              {metricsData.average_quality.ssim.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Dataset statistics display */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: '#f9fafb',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#374151',
          margin: '0 0 0.75rem 0'
        }}>
          Dataset Statistics
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Total synthetic images count */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: 'white',
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: '#6b7280', fontWeight: '500' }}>
              Total Synthetic Images:
            </span>
            <span style={{ color: '#1f2937', fontWeight: '600' }}>
              {metricsData.total_synthetic_images}
            </span>
          </div>
          {/* Total original images count */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem',
            background: 'white',
            borderRadius: '0.25rem',
            fontSize: '0.875rem'
          }}>
            <span style={{ color: '#6b7280', fontWeight: '500' }}>
              Total Original Images:
            </span>
            <span style={{ color: '#1f2937', fontWeight: '600' }}>
              {metricsData.total_original_images}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

QualityMetricsSection.propTypes = {
  metricsData: PropTypes.shape({
    total_synthetic_images: PropTypes.number.isRequired,
    total_original_images: PropTypes.number.isRequired,
    average_quality: PropTypes.shape({
      cosine_similarity: PropTypes.number.isRequired,
      ssim: PropTypes.number.isRequired
    }).isRequired
  })
};

QualityMetricsSection.defaultProps = {
  metricsData: null
};

export default QualityMetricsSection;
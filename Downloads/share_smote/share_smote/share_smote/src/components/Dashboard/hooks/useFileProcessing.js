import { useState } from 'react';
import JSZip from 'jszip';

/**
 * Validates a single form field based on its name and value
 * @param {string} name - The name of the field to validate
 * @param {string} value - The value of the field
 * @param {File|null} zipFile - The uploaded zip file (for file validation)
 * @returns {Object} An object containing validation errors (empty if valid)
 */
const validateField = (name, value, zipFile) => {
  const errors = {};

  switch (name) {
    case 'zipFile':
      if (!zipFile) {
        errors.zipFile = 'ZIP file is required';
      }
      break;
    
    case 'kNeighbour': {
      if (value && value !== '') {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) {
          errors.kNeighbour = 'Must be a valid integer';
        } else if (num < 2) {
          errors.kNeighbour = 'Must be greater than or equal to 2';
        }
      }
      break;
    }
    
    case 'targetRatio': {
      if (value && value !== '') {
        const num = parseFloat(value);
        if (Number.isNaN(num)) {
          errors.targetRatio = 'Must be a valid number';
        } else if (num < 0.0 || num > 1.0) {
          errors.targetRatio = 'Must be between 0.0 and 1.0';
        }
      }
      break;
    }
    
    case 'randomState': {
      if (value !== '' && value !== null && value !== undefined) {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) {
          errors.randomState = 'Must be a valid integer';
        } else if (num <= 0) {
          errors.randomState = 'Must be a positive integer (greater than 0)';
        }
      }
      break;
    }
    
    default:
      break;
  }

  return errors;
};

/**
 * Validates all form fields before submission
 * @param {File|null} zipFile - The uploaded zip file
 * @param {string} kNeighbour - The k-neighbour parameter value
 * @param {string} targetRatio - The target ratio parameter value
 * @param {string} randomState - The random state parameter value
 * @returns {Object} An object containing all validation errors
 */
const validateAllFields = (zipFile, kNeighbour, targetRatio, randomState) => {
  const errors = {};
  
  if (!zipFile) {
    errors.zipFile = 'ZIP file is required';
  }
  
  Object.assign(errors, validateField('kNeighbour', kNeighbour, zipFile));
  Object.assign(errors, validateField('targetRatio', targetRatio, zipFile));
  Object.assign(errors, validateField('randomState', randomState, zipFile));

  return errors;
};

/**
 * Custom hook for handling file processing operations
 * Manages the state and logic for uploading and processing files with SMOTE parameters
 * @param {string} token - JWT authentication token
 * @returns {Object} File processing state and functions
 * @returns {boolean} returns.submitting - Whether file is currently being processed
 * @returns {string} returns.error - Error message if processing failed
 * @returns {string} returns.success - Success message if processing succeeded
 * @returns {Object|null} returns.outputInfo - Information about processed file
 * @returns {Object|null} returns.metricsData - Quality metrics from processing
 * @returns {Function} returns.validateField - Function to validate individual fields
 * @returns {Function} returns.processFile - Function to process the uploaded file
 */
export const useFileProcessing = (token) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [outputInfo, setOutputInfo] = useState(null);
  const [metricsData, setMetricsData] = useState(null);

  /**
   * Processes the uploaded file with the specified SMOTE parameters
   * @param {File} zipFile - The zip file containing the dataset
   * @param {string} kNeighbour - Number of nearest neighbors for SMOTE
   * @param {string} targetRatio - Target ratio for synthetic samples
   * @param {string} randomState - Random seed for reproducibility
   * @returns {Promise<Object>} Result object with success status and errors if any
   */
  const processFile = async (zipFile, kNeighbour, targetRatio, randomState) => {
    // Reset state before processing
    setError('');
    setSuccess('');
    setOutputInfo(null);
    setMetricsData(null);

    // Validate all fields before submission
    const errors = validateAllFields(zipFile, kNeighbour, targetRatio, randomState);
    if (Object.keys(errors).length > 0) {
      setError('Please fix all validation errors before submitting');
      return { success: false, errors };
    }

    setSubmitting(true);

    // Prepare form data for API request
    const formData = new FormData();
    formData.append('zipFile', zipFile);
    formData.append('k_neighbour', kNeighbour || 'null');
    formData.append('target_ratio', targetRatio || 'null');
    formData.append('random_state', randomState || 'null');

    try {
      // Send processing request to backend
      const response = await fetch('/api/auth/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Handle error responses
      if (!response.ok) {
        let message = 'Error processing file';
        try {
          const errJson = await response.json();
          message = errJson.message || message;
        } catch {
          // Silent catch - use default error message
        }
        setError(message);
        setSubmitting(false);
        return { success: false };
      }

      // Extract filename from Content-Disposition header
      const disposition = response.headers.get('Content-Disposition') 
        || response.headers.get('content-disposition');
      let filename = 'result.zip';
      
      if (disposition) {
        // Try UTF-8 encoded filename first
        const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
        const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
        
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else if (plainMatch) {
          filename = plainMatch[1];
        }
      }

      // Get response blob
      const blob = await response.blob();
      
      // Extract metrics from zip file if available
      try {
        const zip = await JSZip.loadAsync(blob);
        const jsonFile = zip.file('augmentation_metadata.json');
        if (jsonFile) {
          const jsonContent = await jsonFile.async('string');
          const jsonData = JSON.parse(jsonContent);
          if (jsonData.metrics) {
            setMetricsData(jsonData.metrics);
          }
        }
      } catch (zipError) {
        console.error('Error parsing zip:', zipError);
      }
      
      // Trigger file download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'result.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Update success state
      setSuccess('File processed successfully! Download started.');
      
      // Set output information
      setOutputInfo({
        filename,
        size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
        kNeighbour: kNeighbour || 'Auto',
        targetRatio: targetRatio || 'Auto',
        randomState: randomState || 'Auto',
      });

      setSubmitting(false);
      return { success: true };
    } catch (err) {
      console.error(err);
      setError('Connection error');
      setSubmitting(false);
      return { success: false };
    }
  };

  return {
    submitting,
    error,
    success,
    outputInfo,
    metricsData,
    validateField,
    processFile,
  };
};
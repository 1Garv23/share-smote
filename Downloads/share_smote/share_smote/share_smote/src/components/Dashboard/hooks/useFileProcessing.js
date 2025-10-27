import { useState } from 'react';

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
          errors.kNeighbour = 'Must be greater than 1';
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
      if (value && value !== '') {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) {
          errors.randomState = 'Must be a valid integer';
        }
      }
      break;
    }
    
    default:
      break;
  }

  return errors;
};

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

export const useFileProcessing = (token) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [outputInfo, setOutputInfo] = useState(null);

  const processFile = async (zipFile, kNeighbour, targetRatio, randomState) => {
    setError('');
    setSuccess('');
    setOutputInfo(null);

    const errors = validateAllFields(zipFile, kNeighbour, targetRatio, randomState);
    if (Object.keys(errors).length > 0) {
      setError('Please fix all validation errors before submitting');
      return { success: false, errors };
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append('zipFile', zipFile);
    formData.append('k_neighbour', kNeighbour || 'null');
    formData.append('target_ratio', targetRatio || 'null');
    formData.append('random_state', randomState || 'null');

    try {
      const response = await fetch('http://localhost:5000/api/auth/process', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let message = 'Error processing file';
        try {
          const errJson = await response.json();
          message = errJson.message || message;
        } catch {
          // Silent catch - response is not JSON
        }
        setError(message);
        setSubmitting(false);
        return { success: false };
      }

      const disposition = response.headers.get('Content-Disposition') 
        || response.headers.get('content-disposition');
      let filename = 'result.zip';
      
      if (disposition) {
        const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition);
        const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(disposition);
        
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else if (plainMatch) {
          filename = plainMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'result.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('File processed successfully! Download started.');
      
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
    validateField,
    processFile,
  };
};
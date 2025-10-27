import { useState } from 'react';

export const useFileUpload = () => {
  const [zipFile, setZipFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      if (file.name.endsWith('.zip')) {
        setZipFile(file);
        setFieldErrors((prev) => ({ ...prev, zipFile: '' }));
      } else {
        setFieldErrors((prev) => ({ 
          ...prev, 
          zipFile: 'Only .zip files are allowed',
        }));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.name.endsWith('.zip')) {
        setZipFile(file);
        setFieldErrors((prev) => ({ ...prev, zipFile: '' }));
      } else {
        setFieldErrors((prev) => ({ 
          ...prev, 
          zipFile: 'Only .zip files are allowed',
        }));
      }
    }
  };

  const clearFile = () => {
    setZipFile(null);
  };

  return {
    zipFile,
    dragActive,
    fieldErrors,
    setFieldErrors,
    handleDrag,
    handleDrop,
    handleFileChange,
    clearFile,
  };
};
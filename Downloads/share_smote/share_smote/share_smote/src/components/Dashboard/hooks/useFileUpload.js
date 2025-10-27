import { useState } from 'react';

/**
 * Custom hook for handling file upload functionality
 * Manages file selection, drag and drop, and validation
 * @returns {Object} File upload state and handlers
 * @returns {File|null} returns.zipFile - Currently selected file
 * @returns {boolean} returns.dragActive - Whether drag operation is active
 * @returns {Object} returns.fieldErrors - Object containing field validation errors
 * @returns {Function} returns.setFieldErrors - Function to update field errors
 * @returns {Function} returns.handleDrag - Handler for drag events
 * @returns {Function} returns.handleDrop - Handler for drop events
 * @returns {Function} returns.handleFileChange - Handler for file input change
 * @returns {Function} returns.clearFile - Function to clear selected file
 */
export const useFileUpload = () => {
  const [zipFile, setZipFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  /**
   * Handles drag events for drag and drop functionality
   * Updates drag active state based on event type
   * @param {DragEvent} e - The drag event
   */
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  /**
   * Handles file drop event
   * Validates dropped file and updates state
   * @param {DragEvent} e - The drop event
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validate file type
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

  /**
   * Handles file selection from input element
   * Validates selected file and updates state
   * @param {Event} e - The change event from file input
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
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

  /**
   * Clears the currently selected file
   * Resets file state to null
   */
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
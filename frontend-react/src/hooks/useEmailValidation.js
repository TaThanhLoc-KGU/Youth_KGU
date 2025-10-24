import { useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';

/**
 * Custom hook for realtime email validation with debounce
 * @param {string} email - Email to validate
 * @param {string} excludeMaSv - Student ID to exclude from duplicate check (for edit mode)
 * @param {number} debounceDelay - Debounce delay in ms (default: 500)
 * @returns {object} - { isValid, isDuplicate, isLoading, error }
 */
export const useEmailValidation = (email, excludeMaSv = null, debounceDelay = 500) => {
  const [isValid, setIsValid] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateEmail = useCallback(async (emailToValidate) => {
    if (!emailToValidate || emailToValidate.trim() === '') {
      setIsValid(false);
      setIsDuplicate(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    try {
      // Check format
      const formatResult = await studentService.validateEmailFormat(emailToValidate);
      setIsValid(formatResult.isValid || false);

      if (formatResult.isValid) {
        // Check for duplicates
        const duplicateResult = await studentService.checkDuplicateEmail(
          emailToValidate,
          excludeMaSv
        );
        setIsDuplicate(duplicateResult.isDuplicate || false);
      } else {
        setIsDuplicate(false);
      }

      setError(null);
    } catch (err) {
      console.error('Email validation error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [excludeMaSv]);

  // Debounce the validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateEmail(email);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [email, debounceDelay, validateEmail]);

  return {
    isValid,
    isDuplicate,
    isLoading,
    error,
    isEmailOk: isValid && !isDuplicate && !isLoading, // True only if valid and not duplicate and not loading
  };
};

export default useEmailValidation;

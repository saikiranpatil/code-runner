import type { ApiErrorResponse } from '@/api/types';
import axios, { type AxiosError } from 'axios';

export interface ParsedError {
  message: string;
  errors: string[];
  statusCode: number;
}

// Safely identifies if the error stems from Axios directly or your HTTPError wrapper
const getAxiosError = (error: unknown): AxiosError | null => {
  if (axios.isAxiosError(error)) return error;
  // If it's your custom HTTPError wrapper, Axios error object resides inside 'cause'
  if (error && typeof error === 'object' && 'cause' in error && axios.isAxiosError((error as any).cause)) {
    return (error as any).cause;
  }
  return null;
};

export const parseApiError = (error: unknown): ParsedError => {
  const axiosError = getAxiosError(error);

  if (axiosError) {
    const statusCode = axiosError.response?.status ?? 0;
    const data = axiosError.response?.data as ApiErrorResponse | undefined;

    if (data && typeof data === 'object') {
      let message = 'Something went wrong.';
      let errors: string[] = [];

      // NestJS class-validator bundles error arrays directly into the 'message' field
      if (Array.isArray(data.message)) {
        errors = data.message;
        message = errors[0] || 'Validation failed.';
      } else if (typeof data.message === 'string') {
        message = data.message;
        errors = Array.isArray(data.errors) ? data.errors : [];
      }

      return { message, errors, statusCode };
    }

    return {
      message: axiosError.message || 'Network error. Please check your connection.',
      errors: [],
      statusCode,
    };
  }

  // Fallthrough for native/runtime javascript errors
  if (error instanceof Error) {
    return {
      message: error.message,
      errors: [],
      statusCode: 0,
    };
  }

  return {
    message: 'An unexpected error occurred.',
    errors: [],
    statusCode: 0,
  };
};
import type { ApiErrorResponse } from '@/api/types';
import type { AxiosError } from 'axios';

export interface ParsedError {
  message: string;
  errors: string[];
  statusCode: number;
}

const isAxiosError = (error: unknown): error is AxiosError =>
  typeof error === 'object' &&
  error !== null &&
  (error as any).isAxiosError === true;

/**
 * Converts any thrown value into a consistent ParsedError.
 *
 * - AxiosError with a shaped backend response → uses the backend message/errors
 * - AxiosError without a body → uses the HTTP status text
 * - Unknown Error → re-throws so the ErrorBoundary can catch it
 * - Anything else → returns a generic ParsedError
 */
export const parseApiError = (error: unknown): ParsedError => {
  if (isAxiosError(error)) {
    const statusCode = error.response?.status ?? 0;
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (data && typeof data === 'object') {
      return {
        message: data.message || error.message || 'Something went wrong.',
        errors: Array.isArray(data.errors) ? data.errors : [],
        statusCode,
      };
    }

    // Network error or no body
    return {
      message: error.message || 'Network error. Please check your connection.',
      errors: [],
      statusCode,
    };
  }

  // Real programming error, let the ErrorBoundary handle it
  if (error instanceof Error) {
    throw error;
  }

  return {
    message: 'An unexpected error occurred.',
    errors: [],
    statusCode: 0,
  };
};
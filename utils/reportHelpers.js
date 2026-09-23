/**
 * Utility functions for classifying and presenting rescue report errors.
 * Extracted from HomeScreen.js.
 */

export function getReportErrorModalType(errorType) {
  switch (errorType) {
    case 'bad_request':
    case 'unauthorized':
    case 'forbidden':
    case 'not_found':
    case 'rate_limited':
      return 'warning';
    case 'network':
    case 'timeout':
    case 'server_error':
    case 'unknown_error':
    default:
      return 'error';
  }
}

export function getReportErrorMessage(errorType) {
  switch (errorType) {
    case 'bad_request':
      return 'Please check the form details and try again.';
    case 'unauthorized':
      return 'Please sign in again and retry the report submission.';
    case 'forbidden':
      return 'You do not have permission to submit this report.';
    case 'not_found':
      return 'The report could not be submitted right now.';
    case 'rate_limited':
      return 'Please wait a moment before submitting another report.';
    case 'server_error':
      return 'Something went wrong on our side. Please try again soon.';
    case 'network':
      return 'Please check your internet connection and try again.';
    case 'timeout':
      return 'The request took too long. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function getApiErrorModalType(apiErrorType) {
  switch (apiErrorType) {
    case 'network':
    case 'timeout':
    case 'server_error':
    case 'unknown_error':
      return 'error';
    default:
      return 'warning';
  }
}

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

/**
 * Returns the correct label for the resolution remarks section based on
 * who resolved the report.
 *
 * The backend writes `resolverRole` ("admin" | "volunteer" | "ngo") at
 * resolution time.  For historical records that pre-date this field the
 * value will be an empty string or undefined; we fall back to a neutral
 * "Remarks" label rather than incorrectly claiming "Admin Remarks".
 *
 * @param {object} report - The hydrated report object from the API.
 * @returns {string} The UI label to display above the remark text.
 */
export function getResolverLabel(report) {
  switch (report?.resolverRole) {
    case 'admin':
      return 'Admin Remarks';
    case 'volunteer':
      return 'Volunteer Remarks';
    case 'ngo':
      return 'NGO Remarks';
    default:
      // Historical resolved report with no resolverRole stamp.
      // Avoid a misleading label — use a neutral fallback.
      return 'Resolution Remarks';
  }
}

/**
 * Checks if a report belongs to the current user.
 * 
 * @param {object} report - The report object from the API.
 * @param {string} currentUserUid - The current authenticated user's UID.
 * @returns {boolean} True if the current user is the reporter.
 */
export function isOwnReport(report, currentUserUid) {
  return Boolean(report?.reporterUid && currentUserUid && report.reporterUid === currentUserUid);
}

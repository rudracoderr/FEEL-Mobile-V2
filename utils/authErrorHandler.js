import { normalizeApiError } from './apiErrorHandler';
import { normalizeDeviceError } from './deviceErrorHandler';

/**
 * Shared Firebase Auth error cases reused by both login and signup flows.
 * Returns a feedback object { type, title, message } or null if no match.
 */
function normalizeSharedAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return {
        type: 'warning',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      };
    case 'auth/network-request-failed':
      return {
        type: 'error',
        title: 'No Internet Connection',
        message: 'No internet connection.',
      };
    case 'auth/too-many-requests':
      return {
        type: 'warning',
        title: 'Too Many Attempts',
        message: 'Too many attempts. Please try again later.',
      };
    default:
      return null;
  }
}

/**
 * Normalizes a Firebase Auth error that occurred during sign-in.
 * Returns a feedback object { type, title, message }.
 */
export function normalizeLoginError(error) {
  const code = String(error?.code || '').toLowerCase();

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return {
        type: 'error',
        title: 'Login Failed',
        message: 'Invalid email or password.',
      };
    case 'auth/user-disabled':
      return {
        type: 'error',
        title: 'Account Disabled',
        message: 'This account has been disabled.',
      };
    default: {
      const shared = normalizeSharedAuthError(code);
      if (shared) return shared;

      const normalized = normalizeApiError(error, {
        fallbackMessage: 'Unable to sign in right now. Please try again.',
      });

      return {
        type: 'error',
        title: 'Login Failed',
        message: normalized.message || 'Unable to sign in right now. Please try again.',
      };
    }
  }
}

/**
 * Normalizes a Firebase Auth error that occurred during a password-reset request.
 * Returns a feedback object { type, title, message }.
 *
 * SECURITY: auth/user-not-found is intentionally NOT surfaced to the caller.
 * Treat it the same as success so we do not reveal account existence.
 */
export function normalizeForgotPasswordError(error) {
  const code = String(error?.code || '').toLowerCase();

  switch (code) {
    // Deliberately omitted — caller treats user-not-found as a silent success
    // to avoid account-enumeration. Listed here only as documentation.
    // case 'auth/user-not-found': ...

    case 'auth/invalid-email':
      return {
        type: 'warning',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      };
    default: {
      const shared = normalizeSharedAuthError(code);
      if (shared) return shared;

      return {
        type: 'error',
        title: 'Request Failed',
        message: 'Unable to send the reset link right now. Please try again.',
      };
    }
  }
}

/**
 * Normalizes a Firebase Auth error that occurred during account creation.
 * Returns a feedback object { type, title, message }.
 */
export function normalizeSignupError(error) {
  const code = String(error?.code || '').toLowerCase();

  switch (code) {
    case 'auth/email-already-in-use':
      return {
        type: 'warning',
        title: 'Email Already In Use',
        message: 'An account with this email already exists.',
      };
    case 'auth/weak-password':
      return {
        type: 'warning',
        title: 'Weak Password',
        message: 'Please choose a stronger password.',
      };
    case 'auth/operation-not-allowed':
      return {
        type: 'error',
        title: 'Signup Disabled',
        message: 'Creating new accounts is currently disabled.',
      };
    case 'auth/internal-error':
      return {
        type: 'error',
        title: 'Signup Failed',
        message: 'Unable to create your account right now. Please try again.',
      };
    default: {
      const shared = normalizeSharedAuthError(code);
      if (shared) return shared;

      const deviceLikeError = normalizeDeviceError(error, {
        source: 'signup',
        fallbackMessage: '',
      });

      if (deviceLikeError?.type && deviceLikeError.type !== 'unknown_device_error') {
        return {
          type: 'error',
          title: deviceLikeError.title,
          message: deviceLikeError.message,
        };
      }

      const apiLikeError = normalizeApiError(null, {
        fallbackMessage: 'Unable to create your account right now. Please try again.',
      });

      return {
        type: 'error',
        title: apiLikeError.title || 'Signup Failed',
        message: apiLikeError.message || 'Unable to create your account right now. Please try again.',
      };
    }
  }
}

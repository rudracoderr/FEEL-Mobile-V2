import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

export const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://feelbackend-production.up.railway.app';
export const REQUEST_TIMEOUT_MS = 12000;

/**
 * Thrown when an API call is made while no user is signed in.
 * Callers can catch this specifically to silently ignore the error
 * during logout rather than showing an error to the user.
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super('Not signed in');
    this.name = 'UnauthenticatedError';
  }
}

/**
 * Waits for Firebase to restore the auth session (if still initializing),
 * then returns the current user. Uses auth.authStateReady() which resolves
 * once Firebase has restored the persisted session from storage.
 */
async function waitForCurrentUser() {
  // authStateReady() resolves after the first auth state is emitted (Firebase v10+)
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady();
    return auth.currentUser;
  }

  // Fallback: one-shot onAuthStateChanged listener for older Firebase versions
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function buildAuthHeaders(extraHeaders = {}) {
  const user = await waitForCurrentUser();
  if (!user) {
    throw new UnauthenticatedError();
  }

  const idToken = await user.getIdToken();

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
    ...extraHeaders,
  };
}

/**
 * Patches the Response object to safely parse JSON.
 * If the response is not OK and contains plain text/HTML (like a 502 or 401),
 * calling .json() on it directly would throw a SyntaxError.
 * This wrapper reads .text() first and handles parsing safely.
 */
function makeSafeJsonResponse(response) {
  response.json = async () => {
    const text = await response.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch (error) {
      if (response.ok) {
        throw error;
      }
      // If it's an error response (4xx/5xx) and NOT valid JSON,
      // return a safe fallback object so callers checking data.message don't crash,
      // or throw a standard Error so global catch blocks can handle the raw text.
      throw new Error(text || `HTTP Error ${response.status}`);
    }
  };
  return response;
}

/**
 * Generic helper to execute a fetch call with cold-start retry logic for GET requests.
 */
async function executeWithColdStartRetry(options, initialTimeoutMs, fetchAction) {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  let { response, error } = await fetchAction(initialTimeoutMs);

  if (error && isGet) {
    const isTimeoutOrNetwork = error.name === 'AbortError' || error.message?.includes('Network');
    if (isTimeoutOrNetwork) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log("API request timed out, retrying once for possible backend cold start...");
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retryResult = await fetchAction(25000); // 25s for cold start
      response = retryResult.response;
      error = retryResult.error;
    }
  }

  if (error) {
    throw error;
  }

  return response;
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const fetchAction = async (currentTimeoutMs) => {
    const controller = new AbortController();
    let timeoutId;
    try {
      const headers = await buildAuthHeaders(options.headers);
      timeoutId = setTimeout(() => controller.abort(), currentTimeoutMs);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const response = await executeWithColdStartRetry(options, timeoutMs, fetchAction);
  return makeSafeJsonResponse(response);
}

/**
 * Fetch wrapper for public endpoints that do NOT require authentication.
 * Used by guest users to load reports without a Firebase ID token.
 * Do NOT use this for any write or user-specific endpoint.
 */
export async function fetchPublicWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const fetchAction = async (currentTimeoutMs) => {
    const controller = new AbortController();
    let timeoutId;
    try {
      timeoutId = setTimeout(() => controller.abort(), currentTimeoutMs);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const response = await executeWithColdStartRetry(options, timeoutMs, fetchAction);
  return makeSafeJsonResponse(response);
}

export async function fetchJsonWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const fetchAction = async (currentTimeoutMs) => {
    const controller = new AbortController();
    let timeoutId;
    try {
      const headers = await buildAuthHeaders(options.headers);
      timeoutId = setTimeout(() => controller.abort(), currentTimeoutMs);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });
      return { response, error: null };
    } catch (error) {
      return { response: null, error };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const response = await executeWithColdStartRetry(options, timeoutMs, fetchAction);
  const responseText = await response.text();

  let responseData = null;
  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  return { response, responseText, responseData };
}

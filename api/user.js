import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';

/**
 * Fetches a user profile from the backend by UID.
 * Returns null for 404 (user created Firebase account but hasn't completed
 * their profile yet — normal during the signup → CompleteProfile flow).
 * Throws for all other non-OK responses.
 */
export async function fetchUserProfile(uid) {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${uid}`);
  const text = await res.text();
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(text || 'Failed to load user details');
  return text ? JSON.parse(text) : null;
}

/**
 * Updates the paid volunteer's availability and optionally their location.
 */
export async function updateAvailability(uid, isAvailable, location = null) {
  const payload = { isAvailable };
  if (location) {
    payload.location = location;
  }
  
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${uid}/availability`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Failed to update availability');
  return JSON.parse(text);
}

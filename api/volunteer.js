import { auth } from '../firebase';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';

/**
 * Fetches the current signed-in user's profile from the backend.
 * Throws if the user is not signed in or the request fails.
 */
export async function fetchMyProfile() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not signed in');
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${uid}`);
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Failed to load profile');
  return text ? JSON.parse(text) : null;
}

/**
 * Submits a volunteer application for the given profile.
 * The backend converts isVolunteer:true → volunteerStatus:"pending".
 * Throws if profile data is missing or the request fails.
 */
export async function submitVolunteerApplication(profile) {
  if (!profile) throw new Error('Profile data missing');
  const payload = {
    uid: profile.uid,
    email: profile.email,
    fullName: profile.fullName || '',
    age: profile.age ?? null,
    phone: profile.phone || '',
    city: profile.city || '',
    location: profile.location,
    isVolunteer: true, // backend converts this → volunteerStatus:"pending"
  };
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || 'Application submission failed');
  return text ? JSON.parse(text) : null;
}

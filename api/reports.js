import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';

/**
 * Fetches all reports submitted by a given reporter UID.
 * Returns an empty array on a non-OK response rather than throwing,
 * since a missing report list is non-fatal for screens that show it as a section.
 */
export async function fetchReportsByReporter(uid) {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/by-reporter/${uid}`);
  const data = await res.json();
  return res.ok && Array.isArray(data.reports) ? data.reports : [];
}

/**
 * Fetches all rescue reports claimed by a given volunteer UID.
 * Returns an empty array on a non-OK response.
 */
export async function fetchClaimedReports(uid) {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/claimed/${uid}`);
  const data = await res.json();
  return res.ok && Array.isArray(data.reports) ? data.reports : [];
}

/**
 * Fetches all cases for a Paid Volunteer: directly accepted AND assistance-accepted.
 * Uses the existing includeAssisting query param supported by the backend.
 * GET /api/reports/claimed/:uid?includeAssisting=true
 */
export async function fetchMyCases(uid) {
  const res = await fetchWithTimeout(
    `${BACKEND_BASE_URL}/api/reports/claimed/${uid}?includeAssisting=true`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load your cases.');
  return Array.isArray(data.reports) ? data.reports : [];
}

// ── Assistance Workflow ───────────────────────────────────────────────────────

/**
 * Normal Volunteer requests paid-volunteer assistance on their active case.
 * Only the assigned volunteer can call this; backend enforces authorization.
 * PATCH /api/reports/:id/request-assistance
 */
export async function requestAssistance(reportId) {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${reportId}/request-assistance`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to request assistance.');
  return data; // { success: true, report: updatedReport }
}

/**
 * Fetches all reports with assistance.status === "pending".
 * Used by Paid Volunteers to see open assistance requests.
 * GET /api/reports?assistancePending=true
 */
export async function fetchAssistanceRequests() {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports?assistancePending=true`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load assistance requests.');
  // Backend may return { reports: [...] } or a plain array
  return Array.isArray(data) ? data : (Array.isArray(data.reports) ? data.reports : []);
}

/**
 * Paid Volunteer accepts an open assistance request.
 * Backend enforces: approved paid volunteer, correct radius, pending status.
 * PATCH /api/reports/:id/accept-assistance
 */
export async function acceptAssistance(reportId) {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${reportId}/accept-assistance`, {
    method: 'PATCH',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to accept assistance.');
  return data; // { success: true, report: updatedReport }
}

// ── Progress / Resolve ────────────────────────────────────────────────────────

/**
 * Updates volunteer progress on an accepted report.
 * Valid progress values: "Assigned" | "On The Way" | "Reached Location" | "Resolved"
 * When progress="Resolved", resolutionDetails = { photoUrl, note } is required.
 * Only the assignedVolunteer.uid can call this — backend returns 403 otherwise.
 * PATCH /api/reports/:id/progress
 */
export async function updateProgress(reportId, progress, resolutionDetails) {
  const body = { progress };
  if (resolutionDetails) body.resolutionDetails = resolutionDetails;
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${reportId}/progress`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to update progress.');
  return data; // { success: true, report: updatedReport }
}

// ── NGO Transfer ──────────────────────────────────────────────────────────────

/**
 * Fetches the list of NGOs for the Transfer picker.
 * Requires authentication; returns [{ _id, name }].
 * GET /api/reports/ngos
 */
export async function fetchNgoList() {
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/ngos`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to load NGO list.');
  return Array.isArray(data.ngos) ? data.ngos : [];
}

/**
 * Creates a transfer request to an NGO.
 * Caller must be either assignedVolunteer or assistance.acceptedByUid — backend enforces.
 * POST /api/reports/:id/transfers
 */
export async function createTransfer(reportId, ngoId, remarks, condition) {
  const body = { ngoId, remarks: remarks || '' };
  if (condition) body.condition = condition;
  const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${reportId}/transfers`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.status === 409) throw new Error(data?.message || 'An active transfer already exists for this rescue.');
  if (!res.ok) throw new Error(data?.message || 'Failed to create transfer request.');
  return data; // { success: true, transfer }
}

/**
 * Cancels a pending NGO transfer.
 * Uses NgoTransfer._id (not Report._id) — backend requires the specific transfer document.
 * DELETE /api/reports/:id/transfers/:transferId
 */
export async function cancelTransfer(reportId, transferId) {
  const res = await fetchWithTimeout(
    `${BACKEND_BASE_URL}/api/reports/${reportId}/transfers/${transferId}`,
    { method: 'DELETE' }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Failed to cancel transfer.');
  return data;
}

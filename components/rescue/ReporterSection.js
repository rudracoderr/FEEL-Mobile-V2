import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera, Phone, ShieldCheck, UserRound } from 'lucide-react-native';
import RescueContactActions from './RescueContactActions';
import { requestAssistance } from '../../api/reports';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Assigned volunteer's view of the reporter, plus progress controls.
 * Purely presentational — all callbacks are passed in from RescueDetailsModal.
 *
 * @param {string}   reporterName          - Reporter's display name.
 * @param {string}   reporterPhone         - Reporter's phone number.
 * @param {string}   reportStatus          - Report status (e.g. 'accepted').
 * @param {string}   volunteerProgress     - Current progress step.
 * @param {boolean}  cancellingRescue      - Whether a cancel API call is in flight.
 * @param {boolean}  isSuspended           - Whether the volunteer is suspended.
 * @param {Function} onUpdateProgress      - Called with the next progress step label.
 * @param {Function} onCancelRescue        - Called when the volunteer confirms release.
 * @param {Function} onOpenResolutionForm  - Opens the resolution modal.
 * @param {string}   reportId              - Report._id used for assistance API calls.
 * @param {string}   assistanceStatus      - report.assistance?.status (undefined|"pending"|"accepted").
 * @param {Function} onAssistanceRequested - Callback to refresh the report after requesting assistance.
 */
export default function ReporterSection({
  reporterName,
  reporterPhone,
  reportStatus,
  volunteerProgress,
  cancellingRescue,
  isSuspended,
  onUpdateProgress,
  onCancelRescue,
  onOpenResolutionForm,
  reportId,
  assistanceStatus,
  onAssistanceRequested,
}) {
  const currentProgress = volunteerProgress || 'Assigned';
  const [requestingAssistance, setRequestingAssistance] = useState(false);

  const handleRequestAssistance = () => {
    Alert.alert(
      'Request Paid Volunteer Assistance',
      'Nearby approved paid volunteers will be notified and can choose to help with this rescue. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Assistance',
          onPress: async () => {
            if (!reportId) return;
            setRequestingAssistance(true);
            try {
              await requestAssistance(reportId);
              Alert.alert('Assistance Requested', 'Nearby paid volunteers have been notified.');
              if (typeof onAssistanceRequested === 'function') {
                onAssistanceRequested();
              }
            } catch (err) {
              Alert.alert('Request Failed', err.message || 'Please try again.');
            } finally {
              setRequestingAssistance(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelPress = () => {
    Alert.alert(
      'Release Rescue',
      'Are you sure you want to release this rescue? It will become available again for other volunteers.',
      [
        { text: 'Keep Rescue', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: () => {
            if (typeof onCancelRescue === 'function') {
              onCancelRescue();
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Derive whether to show the request button vs. a status pill
  const canRequestAssistance =
    reportStatus === 'accepted' &&
    !isSuspended &&
    (!assistanceStatus || assistanceStatus === 'none');

  const assistancePending = assistanceStatus === 'pending';
  const assistanceAccepted = assistanceStatus === 'accepted';

  return (
    <View style={styles.reporterSection}>
      <Text style={styles.subsectionHeading}>Reporter Information</Text>

      <View style={styles.metaRow}>
        <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.metaText}>Name: {reporterName || 'Anonymous'}</Text>
      </View>
      <View style={styles.metaRow}>
        <Phone size={15} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.metaText}>Phone: {reporterPhone || 'Not available'}</Text>
      </View>

      <RescueContactActions phone={reporterPhone} callLabel="Call Reporter" />

      {/* Progress update controls (only while report is accepted) */}
      {reportStatus === 'accepted' && (
        <View style={styles.progressSection}>
          <Text style={styles.progressHeading}>Update Rescue Progress</Text>

          {currentProgress === 'Assigned' && (
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => onUpdateProgress && onUpdateProgress('On The Way')}
              activeOpacity={0.85}
            >
              <Text style={styles.progressButtonText}>On The Way</Text>
            </TouchableOpacity>
          )}

          {currentProgress === 'On The Way' && (
            <TouchableOpacity
              style={styles.progressButton}
              onPress={() => onUpdateProgress && onUpdateProgress('Reached Location')}
              activeOpacity={0.85}
            >
              <Text style={styles.progressButtonText}>Reached Location</Text>
            </TouchableOpacity>
          )}

          {currentProgress === 'Reached Location' && (
            <TouchableOpacity
              style={[styles.progressButton, styles.progressResolveButton]}
              onPress={onOpenResolutionForm}
              activeOpacity={0.85}
            >
              <Camera size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.progressButtonText}>Mark as Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Request Assistance Section ────────────────────────────────────── */}
      {reportStatus === 'accepted' && (
        <View style={styles.assistanceSection}>
          <View style={styles.assistanceHeader}>
            <ShieldCheck size={15} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.assistanceHeading}>Need Extra Help?</Text>
          </View>

          {/* Status pill: assistance pending — waiting for a paid volunteer */}
          {assistancePending && (
            <View style={[styles.assistancePill, styles.assistancePillPending]}>
              <Text style={[styles.assistancePillText, styles.assistancePillTextPending]}>
                ⏳  Assistance Requested — waiting for a paid volunteer
              </Text>
            </View>
          )}

          {/* Status pill: assistance accepted — paid volunteer on their way */}
          {assistanceAccepted && (
            <View style={[styles.assistancePill, styles.assistancePillAccepted]}>
              <Text style={[styles.assistancePillText, styles.assistancePillTextAccepted]}>
                ✅  A paid volunteer is on their way to assist you
              </Text>
            </View>
          )}

          {/* Request button — only when no pending/accepted assistance */}
          {canRequestAssistance && (
            <TouchableOpacity
              style={[styles.assistanceButton, requestingAssistance && styles.assistanceButtonDisabled]}
              onPress={handleRequestAssistance}
              disabled={requestingAssistance}
              activeOpacity={0.85}
            >
              {requestingAssistance ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={styles.assistanceButtonText}>Request Paid Volunteer Assistance</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.cancelButton, (cancellingRescue || isSuspended) && styles.cancelButtonDisabled]}
        onPress={handleCancelPress}
        disabled={Boolean(cancellingRescue) || Boolean(isSuspended)}
        activeOpacity={0.85}
      >
        {cancellingRescue ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.cancelButtonText}>Cancel Rescue</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  reporterSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  subsectionHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.meta,
    fontWeight: '700',
    flex: 1,
  },
  progressSection: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  progressHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  progressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginBottom: spacing.sm,
  },
  progressResolveButton: {
    backgroundColor: colors.success,
  },
  progressButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  // ── Assistance styles ──────────────────────────────────────────────────────
  assistanceSection: {
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
  },
  assistanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  assistanceHeading: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  assistancePill: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  assistancePillPending: {
    backgroundColor: colors.warningSoft,
    borderColor: '#FCD34D',
  },
  assistancePillAccepted: {
    backgroundColor: colors.successSoft,
    borderColor: '#86EFAC',
  },
  assistancePillText: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  assistancePillTextPending: {
    color: '#92400E',
  },
  assistancePillTextAccepted: {
    color: '#166534',
  },
  assistanceButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    minHeight: 48,
  },
  assistanceButtonDisabled: {
    opacity: 0.55,
  },
  assistanceButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  // ── Cancel ─────────────────────────────────────────────────────────────────
  cancelButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.critical,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});

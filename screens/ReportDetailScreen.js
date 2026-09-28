import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { auth } from '../firebase';
import { BACKEND_BASE_URL, fetchPublicWithTimeout, fetchWithTimeout } from '../apiClient';
import RescueDetailsModal from '../components/RescueDetailsModal';
import PaidVolunteerRescueDetailsModal from '../components/paidVolunteer/PaidVolunteerRescueDetailsModal';
import { colors, spacing, typography } from '../theme';

/**
 * Thin screen that fetches a single report by ID and shows RescueDetailsModal.
 * Reached by:
 *   navigation.navigate('ReportDetail', { reportId: '<mongo-id>' })
 *
 * The modal is rendered always-visible (visible={true}).
 * onClose navigates back. All report-action props are passed as no-ops
 * since notification-driven views are read-only for the initial release.
 */
export default function ReportDetailScreen({ route, navigation }) {
  const reportId = route?.params?.reportId ?? null;

  const [report, setReport] = useState(null);
  const [isPaidVolunteer, setIsPaidVolunteer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUserUid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!reportId) {
      setError('No report ID provided.');
      setLoading(false);
      return;
    }

    let isActive = true;

    (async () => {
      try {
        const reportRes = await fetchPublicWithTimeout(
          `${BACKEND_BASE_URL}/api/reports/${reportId}`
        );
        const reportData = await reportRes.json();

        if (!reportRes.ok) {
          throw new Error(reportData?.message || reportData?.error || `HTTP ${reportRes.status}`);
        }

        let pvCheck = false;
        if (currentUserUid) {
          try {
            const userRes = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${currentUserUid}`);
            const userData = userRes.data || userRes;
            if (userData?.isPaidVolunteer && userData?.paidVolunteerStatus === 'approved') {
              pvCheck = true;
            }
          } catch (e) {
            console.warn('[ReportDetailScreen] Failed to fetch user profile:', e);
          }
        }

        if (isActive) {
          if (currentUserUid && reportData?.assignedVolunteer?.uid === currentUserUid && !pvCheck) {
            // Normal volunteer is assigned to this rescue.
            // Redirect to the fully wired My Cases flow instead of rendering the read-only modal.
            // This ensures they have full progress/cancel API hooks and PII (reporterContact) provided by the protected backend route.
            navigation.replace('AppTabs', {
              screen: 'Profile',
              params: {
                screen: 'ClaimedRescues',
                params: { autoOpenReportId: reportId },
              },
            });
            return;
          }

          if (pvCheck && currentUserUid) {
            const isAssigned = reportData?.assignedVolunteer?.uid === currentUserUid;
            const isAssisting = reportData?.assistance?.acceptedByUid === currentUserUid;
            
            if (isAssigned || isAssisting) {
              // Paid volunteer managing this case -> MyCases tab inside PaidVolunteerTabNavigator
              navigation.replace('AppTabs', {
                screen: 'MyCases',
                params: { autoOpenReportId: reportId },
              });
              return;
            }
          }

          setReport(reportData);
          setIsPaidVolunteer(pvCheck);
        }
      } catch (err) {
        if (isActive) {
          setError(err.message || 'Failed to load report details.');
        }
      } finally {
        if (isActive) setLoading(false);
      }
    })();

    return () => { isActive = false; };
  }, [reportId]);

  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error || 'Report not found or no longer available.'}
        </Text>
        <Text style={styles.backLink} onPress={handleClose}>
          ← Go back
        </Text>
      </View>
    );
  }

  let pvMode = 'rescue';
  if (report) {
    if (report.assignedVolunteer?.uid === currentUserUid || report.assistance?.acceptedByUid === currentUserUid) {
      pvMode = 'mycase';
    } else if (report.assistance?.status === 'pending') {
      pvMode = 'assistance';
    }
  }

  // RescueDetailsModal renders as a React Native Modal.
  // Render a full-screen background behind it so the screen
  // doesn't flash bare background while the modal animates in.
  return (
    <View style={styles.container}>
      {isPaidVolunteer ? (
        <PaidVolunteerRescueDetailsModal
          visible={true}
          report={report}
          currentUserUid={currentUserUid}
          mode={pvMode}
          onClose={handleClose}
          // Notification deep-links are read/action entry points.
          // Callbacks to parent screens are no-ops because this is a top-level Stack screen.
          // The modal manages its own internal state and API calls.
          onAcceptSuccess={() => {}}
          onCaseUpdated={() => {}}
          onCaseClosed={() => {}}
        />
      ) : (
        <RescueDetailsModal
          visible={true}
          report={report}
          currentUserUid={currentUserUid}
          onClose={handleClose}
          // Normal users: read-only notification deep-link
          onCancelRescue={null}
          cancellingRescue={false}
          isSuspended={false}
          onUpdateProgress={null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.body,
    color: colors.critical,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  backLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '700',
  },
});

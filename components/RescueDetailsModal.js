import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AlertTriangle, CheckCircle, MapPin, ShieldCheck, UserRound, X } from 'lucide-react-native';
import ReportImageGallery from './ReportImageGallery';
import Card from './ui/Card';
import StatusBadge from './ui/StatusBadge';
import RescueTimeline from './rescue/RescueTimeline';
import VolunteerSection from './rescue/VolunteerSection';
import ReporterSection from './rescue/ReporterSection';
import ReportAbuseModal from './rescue/ReportAbuseModal';
import ResolveRescueModal from './rescue/ResolveRescueModal';
import { BACKEND_BASE_URL, fetchPublicWithTimeout } from '../apiClient';
import { uploadResolutionImage } from '../utils/cloudinaryHelper';
import { formatDateLabel } from '../utils/dateHelpers';
import { getPhoneFromContact } from '../utils/contactHelpers';
import { colors, radius, spacing, typography } from '../theme';

export default function RescueDetailsModal({
  visible,
  report,
  currentUserUid,
  onClose,
  onCancelRescue,
  cancellingRescue,
  isSuspended,
  onUpdateProgress,
}) {
  // ── Report hydration ──────────────────────────────────────────────────────
  const [hydratedReport, setHydratedReport] = useState(report || null);

  useEffect(() => {
    let isActive = true;

    if (!visible || !report?._id) {
      setHydratedReport(report || null);
      return () => { isActive = false; };
    }

    setHydratedReport(report || null);

    (async () => {
      try {
        const response = await fetchPublicWithTimeout(`${BACKEND_BASE_URL}/api/reports/${report._id}`);
        const fullReport = await response.json();

        if (!response.ok) {
          throw new Error(fullReport?.error || fullReport?.message || 'Failed to load rescue details.');
        }

        if (isActive) setHydratedReport(fullReport);
      } catch (error) {
        console.error('Failed to hydrate rescue details:', error);
      }
    })();

    return () => { isActive = false; };
  }, [visible, report]);

  const displayReport = hydratedReport || report;
  const isResolved = (displayReport?.status || '').toLowerCase() === 'resolved';

  // ── Abuse report state & submission ──────────────────────────────────────
  const [isAbuseModalVisible, setIsAbuseModalVisible] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const [submittingAbuse, setSubmittingAbuse] = useState(false);

  const submitAbuseReport = async () => {
    if (!report?._id || !currentUserUid || !selectedReason) {
      Alert.alert('Error', 'Required fields are missing.');
      return;
    }

    try {
      setSubmittingAbuse(true);
      const response = await fetchWithTimeout(
        `${BACKEND_BASE_URL}/api/reports/${displayReport._id}/abuse`,
        {
          method: 'POST',
          body: JSON.stringify({
            reportedByUid: currentUserUid,
            reason: selectedReason,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to submit abuse report.');
      }

      Alert.alert(
        'Thank you',
        'This report has been flagged for review.',
        [{
          text: 'OK',
          onPress: () => {
            setIsAbuseModalVisible(false);
            setSelectedReason(null);
          },
        }]
      );
    } catch (err) {
      console.error('Failed to submit abuse report:', err);
      Alert.alert('Error', err.message || 'Failed to submit abuse report.');
    } finally {
      setSubmittingAbuse(false);
    }
  };

  // ── Resolution form state & submission ───────────────────────────────────
  const [resolutionFormVisible, setResolutionFormVisible] = useState(false);
  const [resolutionPhotoAsset, setResolutionPhotoAsset] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolutionSubmitting, setResolutionSubmitting] = useState(false);

  const openResolutionForm = () => {
    setResolutionPhotoAsset(null);
    setResolutionNote('');
    setResolutionFormVisible(true);
  };

  const closeResolutionForm = () => {
    if (resolutionSubmitting) return;
    setResolutionFormVisible(false);
    setResolutionPhotoAsset(null);
    setResolutionNote('');
  };

  const pickResolutionPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to attach a resolution photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: false,
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets?.length) return;
      setResolutionPhotoAsset(result.assets[0]);
    } catch (error) {
      console.error('Resolution photo pick failed:', error);
      Alert.alert('Photo selection failed', error.message);
    }
  };

  const handleSubmitResolution = async () => {
    if (!displayReport?._id || !currentUserUid) {
      Alert.alert('Error', 'Required information is missing.');
      return;
    }

    const note = resolutionNote.trim();
    if (!resolutionPhotoAsset) {
      Alert.alert('Photo required', 'Please attach a resolution photo.');
      return;
    }
    if (!note) {
      Alert.alert('Note required', 'Please enter a resolution note.');
      return;
    }

    setResolutionSubmitting(true);
    try {
      const photoUrl = await uploadResolutionImage(resolutionPhotoAsset);

      if (typeof onUpdateProgress === 'function') {
        await onUpdateProgress('Resolved', { photoUrl, note });
      }

      setResolutionFormVisible(false);
      setResolutionPhotoAsset(null);
      setResolutionNote('');
    } catch (error) {
      console.error('Resolution submission failed:', error);
      Alert.alert('Failed to resolve', error.message || 'Please try again.');
    } finally {
      setResolutionSubmitting(false);
    }
  };

  // ── Derived contact data ──────────────────────────────────────────────────
  const reportStatus = (displayReport?.status || '').toLowerCase();
  const isContactPhase = ['accepted', 'resolved'].includes(reportStatus);
  const isReporter = currentUserUid === displayReport?.reporterUid;
  const assignedVolunteerUid = displayReport?.assignedVolunteer?.uid || null;
  const isAssignedVolunteer = currentUserUid === assignedVolunteerUid;
  const volunteerPhone = displayReport?.assignedVolunteer?.phone || '';
  const reporterPhone = getPhoneFromContact(displayReport?.reporterContact);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.82} hitSlop={10}>
            <X size={22} color={colors.text} strokeWidth={2.4} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {displayReport ? (
            <>
              {/* Image Gallery */}
              <View style={styles.imageWrap}>
                <ReportImageGallery
                  imageUrls={displayReport.imageUrls || []}
                  height={280}
                  borderRadius={radius.lg}
                  style={styles.galleryImage}
                  counterStyle={styles.galleryCounter}
                />
              </View>

              {/* Report Info Card */}
              <Card style={styles.infoCard}>
                <View style={styles.badgeRow}>
                  <StatusBadge status={displayReport.status} />
                </View>
                <Text style={styles.title}>{displayReport.title}</Text>
                <View style={styles.metaRow}>
                  <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
                  <Text style={styles.metaText}>Reporter: {displayReport.reporterName || 'Anonymous'}</Text>
                </View>
                <View style={styles.metaRow}>
                  <ShieldCheck size={15} color={colors.textSecondary} strokeWidth={2.2} />
                  <Text style={styles.metaText}>Progress: {displayReport.volunteerProgress || 'Assigned'}</Text>
                </View>
                {displayReport.address ? (
                  <View style={styles.metaRow}>
                    <MapPin size={15} color={colors.textSecondary} strokeWidth={2.2} />
                    <Text style={styles.metaText}>{displayReport.address}</Text>
                  </View>
                ) : null}
                {displayReport.landmark ? (
                  <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
                    <MapPin size={15} color={colors.textSecondary} strokeWidth={2.2} />
                    <Text style={styles.metaText}>Landmark: {displayReport.landmark}</Text>
                  </View>
                ) : null}
              </Card>

              {/* Resolution Section (if resolved) */}
              {isResolved ? (
                <View style={styles.resolutionSection}>
                  <View style={styles.resolutionHeader}>
                    <CheckCircle size={18} color={colors.success} strokeWidth={2.5} />
                    <Text style={styles.resolutionHeading}>Resolved</Text>
                  </View>
                  <Text style={styles.resolutionLabel}>Admin Remark</Text>
                  <Text style={styles.resolutionBody}>
                    {displayReport.resolutionRemark || 'No admin remark provided.'}
                  </Text>
                  <Text style={styles.resolutionLabel}>Resolved At</Text>
                  <Text style={styles.resolutionDate}>{formatDateLabel(displayReport.resolvedAt)}</Text>
                </View>
              ) : null}

              {/* Timeline */}
              <RescueTimeline report={displayReport} />

              {/* Volunteer / Reporter Contact Card */}
              <Card style={styles.volunteerCard}>
                <Text style={styles.sectionHeading}>Volunteer Responding</Text>
                {displayReport.assignedVolunteer?.uid ? (
                  <View style={styles.metaRow}>
                    <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
                    <Text style={styles.metaText}>
                      Name: {displayReport.assignedVolunteer.fullName || 'Unknown volunteer'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.metaText}>Volunteer not assigned yet.</Text>
                )}

                {isContactPhase && isReporter && assignedVolunteerUid && (
                  <VolunteerSection
                    fullName={displayReport.assignedVolunteer?.fullName}
                    phone={volunteerPhone}
                  />
                )}

                {isContactPhase && isAssignedVolunteer && (
                  <ReporterSection
                    reporterName={displayReport.reporterName}
                    reporterPhone={reporterPhone}
                    reportStatus={displayReport.status}
                    volunteerProgress={displayReport.volunteerProgress}
                    cancellingRescue={cancellingRescue}
                    isSuspended={isSuspended}
                    onUpdateProgress={onUpdateProgress}
                    onCancelRescue={onCancelRescue}
                    onOpenResolutionForm={openResolutionForm}
                    reportId={displayReport?._id}
                    assistanceStatus={displayReport?.assistance?.status}
                    onAssistanceRequested={async () => {
                      // Re-fetch the report so the assistance status pill updates immediately
                      try {
                        const res = await fetchPublicWithTimeout(`${BACKEND_BASE_URL}/api/reports/${displayReport._id}`);
                        const fresh = await res.json();
                        if (res.ok && fresh?._id) setHydratedReport(fresh);
                      } catch (_) {
                        // Non-fatal — the Alert from ReporterSection already confirms success
                      }
                    }}
                  />
                )}
              </Card>

              {/* Description */}
              {displayReport.description ? (
                <Card style={styles.descriptionCard}>
                  <Text style={styles.sectionHeading}>Description</Text>
                  <Text style={styles.descriptionText}>{displayReport.description}</Text>
                </Card>
              ) : null}

              {/* Report Abuse trigger */}
              {currentUserUid ? (
                <TouchableOpacity
                  style={styles.abuseButton}
                  onPress={() => setIsAbuseModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <AlertTriangle size={18} color={colors.critical} strokeWidth={2.3} />
                  <Text style={styles.abuseButtonText}>Report Abuse</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </View>

      {/* Report Abuse Modal */}
      <ReportAbuseModal
        visible={isAbuseModalVisible}
        selectedReason={selectedReason}
        submitting={submittingAbuse}
        onSelectReason={setSelectedReason}
        onSubmit={submitAbuseReport}
        onClose={() => {
          if (!submittingAbuse) {
            setIsAbuseModalVisible(false);
            setSelectedReason(null);
          }
        }}
      />

      {/* Resolve Rescue Modal */}
      <ResolveRescueModal
        visible={resolutionFormVisible}
        resolutionPhotoAsset={resolutionPhotoAsset}
        resolutionNote={resolutionNote}
        submitting={resolutionSubmitting}
        onPickPhoto={pickResolutionPhoto}
        onRemovePhoto={() => setResolutionPhotoAsset(null)}
        onNoteChange={setResolutionNote}
        onSubmit={handleSubmitResolution}
        onClose={closeResolutionForm}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  imageWrap: {
    marginBottom: spacing.lg,
  },
  galleryImage: {
    width: '100%',
  },
  galleryCounter: {
    right: spacing.md,
    bottom: spacing.md,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    marginBottom: spacing.md,
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
  resolutionSection: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  resolutionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  resolutionHeading: {
    color: colors.success,
    fontSize: 16,
    fontWeight: '900',
  },
  resolutionLabel: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.sm,
    marginBottom: 3,
  },
  resolutionBody: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  resolutionDate: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  volunteerCard: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.body,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  descriptionCard: {
    marginBottom: spacing.lg,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  abuseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  abuseButtonText: {
    color: colors.critical,
    fontSize: 14,
    fontWeight: '800',
  },
});

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MapPin, Phone, ShieldCheck, UserRound, X } from 'lucide-react-native';
import ReportImageGallery from '../ReportImageGallery';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import SeverityBadge from '../ui/SeverityBadge';
import Button from '../ui/Button';
import RescueTimeline from '../rescue/RescueTimeline';
import ResolveRescueModal from '../rescue/ResolveRescueModal';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../../apiClient';
import { acceptAssistance, updateProgress, createTransfer, cancelTransfer, fetchNgoList } from '../../api/reports';
import { uploadResolutionImage } from '../../utils/cloudinaryHelper';
import { getTimeAgo } from '../../utils/dateHelpers';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Rescue details modal for Paid Volunteers.
 *
 * mode="rescue"    — View/Accept an unclaimed report from Nearby feed
 * mode="assistance"— View/Accept a pending assistance request
 * mode="mycase"    — View and act on an owned active case (progress/close/transfer)
 *
 * Props:
 *   visible          {boolean}
 *   report           {object}   Partial report from list
 *   currentUserUid   {string}
 *   mode             {string}   'rescue' | 'assistance' | 'mycase'
 *   onClose          {Function}
 *   onAcceptSuccess  {Function} mode=rescue|assistance — called with refreshed report
 *   onCaseUpdated    {Function} mode=mycase — called with updated report after progress/transfer
 *   onCaseClosed     {Function} mode=mycase — called with updated report after resolve
 */
export default function PaidVolunteerRescueDetailsModal({
  visible,
  report,
  currentUserUid,
  mode = 'rescue',
  onClose,
  onAcceptSuccess,
  onCaseUpdated,
  onCaseClosed,
}) {
  const [hydratedReport, setHydratedReport] = useState(report || null);
  const [hydrating, setHydrating] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Resolve modal state (reuses ResolveRescueModal)
  const [resolveVisible, setResolveVisible] = useState(false);
  const [resolutionPhotoAsset, setResolutionPhotoAsset] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  // Transfer modal state
  const [transferVisible, setTransferVisible] = useState(false);
  const [ngoList, setNgoList] = useState([]);
  const [ngoLoading, setNgoLoading] = useState(false);
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [transferRemarks, setTransferRemarks] = useState('');
  const [transferring, setTransferring] = useState(false);

  // ── Hydrate when modal opens ──────────────────────────────────────────────
  useEffect(() => {
    let isActive = true;
    if (!visible || !report?._id) {
      setHydratedReport(report || null);
      return () => { isActive = false; };
    }
    setHydratedReport(report || null);
    setHydrating(true);
    (async () => {
      try {
        const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${report._id}`);
        const fullReport = await response.json();
        if (!response.ok) throw new Error(fullReport?.error || fullReport?.message || 'Failed to load details.');
        if (isActive) setHydratedReport(fullReport);
      } catch (error) {
        console.error('[PaidVolunteerRescueDetailsModal] Hydration failed:', error);
      } finally {
        if (isActive) setHydrating(false);
      }
    })();
    return () => { isActive = false; };
  }, [visible, report]);

  const displayReport = hydratedReport || report;
  const reportStatus = (displayReport?.status || 'pending').toLowerCase();
  const isPending = reportStatus === 'pending';
  const isAccepted = reportStatus === 'accepted';
  const isResolved = reportStatus === 'resolved';

  const assignedVolunteerPhone = displayReport?.assignedVolunteer?.phone || null;
  const assignedVolunteerName = displayReport?.assignedVolunteer?.fullName || 'Assigned Volunteer';
  const hasPhone = Boolean(assignedVolunteerPhone);
  const isBusy = accepting || hydrating || updating || resolving || transferring;

  // Ownership determination for mycase mode
  const isDirectlyAssigned = displayReport?.assignedVolunteer?.uid === currentUserUid;
  const isAssisting = displayReport?.assistance?.acceptedByUid === currentUserUid;
  const isMyCase = isDirectlyAssigned || isAssisting;

  // Progress derived state
  const currentProgress = displayReport?.volunteerProgress || 'Assigned';
  const PROGRESS_STEPS = ['Assigned', 'On The Way', 'Reached Location', 'Resolved'];
  const currentProgressIdx = PROGRESS_STEPS.indexOf(currentProgress);
  const nextProgress = currentProgressIdx >= 0 && currentProgressIdx < PROGRESS_STEPS.length - 2
    ? PROGRESS_STEPS[currentProgressIdx + 1]
    : null; // null means next step is Resolved or already resolved

  // Transfer state
  const transferStatus = displayReport?.transferStatus || 'none';
  const transferPending = transferStatus === 'pending';
  const transferCompleted = transferStatus === 'completed';

  // ── Accept Rescue ─────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!currentUserUid || !displayReport?._id || accepting) return;
    setAccepting(true);
    try {
      const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${displayReport._id}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ uid: currentUserUid }),
      });
      const data = await response.json();
      if (response.status === 409) {
        Alert.alert('Already Claimed', 'This rescue was just claimed by another volunteer.');
        return;
      }
      if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to accept rescue.');

      let refreshedReport = data?.report || null;
      try {
        const refreshResponse = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${displayReport._id}`);
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok && refreshData?._id) refreshedReport = refreshData;
      } catch (_) {}

      if (typeof onAcceptSuccess === 'function' && refreshedReport) onAcceptSuccess(refreshedReport);
      onClose();
      Alert.alert('Rescue Accepted', 'You are now assigned to this rescue.');
    } catch (error) {
      console.error('[PaidVolunteerRescueDetailsModal] Accept failed:', error);
      Alert.alert('Unable to Accept', error.message || 'Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  // ── Accept Assistance ─────────────────────────────────────────────────────
  const handleAcceptAssistance = async () => {
    if (!currentUserUid || !displayReport?._id || accepting) return;
    setAccepting(true);
    try {
      const data = await acceptAssistance(displayReport._id);
      const refreshedReport = data?.report || null;
      if (typeof onAcceptSuccess === 'function' && refreshedReport) onAcceptSuccess(refreshedReport);
      onClose();
      Alert.alert('Assistance Accepted', 'You have accepted this assistance request. The volunteer has been notified.');
    } catch (error) {
      if (error.message?.includes('already been claimed')) {
        Alert.alert('Already Accepted', 'Another paid volunteer has already accepted this request.');
      } else {
        Alert.alert('Unable to Accept', error.message || 'Please try again.');
      }
    } finally {
      setAccepting(false);
    }
  };

  // ── Update Progress (non-resolve steps) ──────────────────────────────────
  const handleUpdateProgress = async (nextStep) => {
    if (!displayReport?._id || updating) return;
    setUpdating(true);
    try {
      const data = await updateProgress(displayReport._id, nextStep);
      const updated = data?.report || displayReport;
      setHydratedReport(updated);
      if (typeof onCaseUpdated === 'function') onCaseUpdated(updated);
      Alert.alert('Progress Updated', `Status: ${nextStep}`);
    } catch (error) {
      Alert.alert('Unable to update progress', error.message || 'Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // ── Resolve flow (reuses ResolveRescueModal + uploadResolutionImage) ──────
  const openResolveModal = () => {
    setResolutionPhotoAsset(null);
    setResolutionNote('');
    setResolveVisible(true);
  };

  const closeResolveModal = () => {
    if (resolving) return;
    setResolveVisible(false);
    setResolutionPhotoAsset(null);
    setResolutionNote('');
  };

  const pickResolutionPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
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
      Alert.alert('Photo selection failed', error.message);
    }
  };

  const handleSubmitResolution = async () => {
    if (!displayReport?._id) return;
    const note = resolutionNote.trim();
    if (!resolutionPhotoAsset) { Alert.alert('Photo required', 'Please attach a resolution photo.'); return; }
    if (!note) { Alert.alert('Note required', 'Please enter a resolution note.'); return; }
    setResolving(true);
    try {
      const photoUrl = await uploadResolutionImage(resolutionPhotoAsset);
      // Uses PATCH /progress with progress="Resolved" — same as ClaimedRescuesScreen pattern
      const data = await updateProgress(displayReport._id, 'Resolved', { photoUrl, note });
      const updated = data?.report || displayReport;
      setHydratedReport(updated);
      setResolveVisible(false);
      setResolutionPhotoAsset(null);
      setResolutionNote('');
      if (typeof onCaseClosed === 'function') onCaseClosed(updated);
      Alert.alert('Case Closed', 'The rescue has been marked as resolved.');
    } catch (error) {
      Alert.alert('Failed to resolve', error.message || 'Please try again.');
    } finally {
      setResolving(false);
    }
  };

  // ── Transfer to NGO flow ──────────────────────────────────────────────────
  const openTransferModal = async () => {
    setSelectedNgo(null);
    setTransferRemarks('');
    setTransferVisible(true);
    setNgoLoading(true);
    try {
      const list = await fetchNgoList();
      setNgoList(list);
    } catch (error) {
      Alert.alert('Failed to load NGO list', error.message || 'Please try again.');
      setTransferVisible(false);
    } finally {
      setNgoLoading(false);
    }
  };

  const handleSubmitTransfer = async () => {
    if (!selectedNgo || !displayReport?._id || transferring) return;
    setTransferring(true);
    try {
      await createTransfer(displayReport._id, selectedNgo._id, transferRemarks.trim());
      // Re-fetch to get updated transferStatus
      let updated = displayReport;
      try {
        const res = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${displayReport._id}`);
        const d = await res.json();
        if (res.ok && d?._id) updated = d;
      } catch (_) {}
      setHydratedReport(updated);
      setTransferVisible(false);
      if (typeof onCaseUpdated === 'function') onCaseUpdated(updated);
      Alert.alert('Transfer Requested', `Transfer to ${selectedNgo.name} has been sent. The NGO will be notified.`);
    } catch (error) {
      Alert.alert('Transfer Failed', error.message || 'Please try again.');
    } finally {
      setTransferring(false);
    }
  };

  // ── Navigate to rescue ────────────────────────────────────────────────────
  const handleNavigate = () => {
    const coordinates = displayReport?.location?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      Alert.alert('Location Unavailable', 'Location data is missing for this rescue.');
      return;
    }
    const [longitude, latitude] = coordinates;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`)
      .catch(() => Alert.alert('Error', 'Could not open maps.'));
  };

  // ── Call volunteer (rescue mode, accepted reports) ────────────────────────
  const handleCallVolunteer = () => {
    if (!hasPhone) return;
    Linking.openURL(`tel:${assignedVolunteerPhone}`)
      .catch(() => Alert.alert('Error', 'Could not open the phone dialer.'));
  };

  return (
    <>
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
                  <ReportImageGallery imageUrls={displayReport.imageUrls || []} height={260} borderRadius={radius.lg} />
                </View>

                {/* Info Card */}
                <Card style={styles.infoCard}>
                  <View style={styles.badgeRow}>
                    <StatusBadge status={displayReport.status} />
                    <SeverityBadge severity={displayReport.severity || 'medium'} />
                    {mode === 'mycase' && isAssisting && !isDirectlyAssigned && (
                      <View style={styles.assistingPill}>
                        <Text style={styles.assistingPillText}>Assisting</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.title}>{displayReport.title}</Text>

                  {displayReport.reporterName ? (
                    <View style={styles.metaRow}>
                      <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
                      <Text style={styles.metaText}>Reported by {displayReport.reporterName}</Text>
                    </View>
                  ) : null}

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

                  {displayReport.volunteerProgress ? (
                    <View style={styles.metaRow}>
                      <ShieldCheck size={15} color={colors.textSecondary} strokeWidth={2.2} />
                      <Text style={styles.metaText}>Progress: {displayReport.volunteerProgress}</Text>
                    </View>
                  ) : null}

                  {displayReport.date ? (
                    <Text style={styles.timeAgo}>{getTimeAgo(displayReport.date)}</Text>
                  ) : null}
                </Card>

                {/* Assigned Volunteer card (shown in rescue mode on accepted reports) */}
                {mode === 'rescue' && isAccepted && displayReport?.assignedVolunteer?.uid ? (
                  <Card style={styles.volunteerCard}>
                    <Text style={styles.sectionHeading}>Volunteer Responding</Text>
                    <View style={styles.metaRow}>
                      <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
                      <Text style={styles.metaText}>{assignedVolunteerName}</Text>
                    </View>
                    {hasPhone ? (
                      <View style={styles.metaRow}>
                        <Phone size={15} color={colors.textSecondary} strokeWidth={2.2} />
                        <Text style={styles.metaText}>{assignedVolunteerPhone}</Text>
                      </View>
                    ) : !hydrating ? (
                      <Text style={styles.contactUnavailable}>Volunteer contact unavailable</Text>
                    ) : null}
                  </Card>
                ) : null}

                {/* Description */}
                {displayReport.description ? (
                  <Card style={styles.descriptionCard}>
                    <Text style={styles.sectionHeading}>Description</Text>
                    <Text style={styles.descriptionText}>{displayReport.description}</Text>
                  </Card>
                ) : null}

                {/* Timeline */}
                <RescueTimeline report={displayReport} />

                {/* ── ACTIONS ── */}
                <View style={styles.actions}>

                  {/* Rescue mode: accept unclaimed */}
                  {mode === 'rescue' && isPending ? (
                    <Button
                      label={accepting ? 'Accepting…' : 'Accept Rescue'}
                      onPress={handleAccept}
                      disabled={isBusy}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {/* Rescue mode: call volunteer on accepted */}
                  {mode === 'rescue' && isAccepted ? (
                    <Button
                      label={hydrating ? 'Loading contact…' : hasPhone ? `Call ${assignedVolunteerName}` : 'Call Volunteer'}
                      onPress={handleCallVolunteer}
                      disabled={!hasPhone || isBusy}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {/* Assistance mode: accept */}
                  {mode === 'assistance' ? (
                    <Button
                      label={accepting ? 'Accepting…' : 'Accept Assistance'}
                      onPress={handleAcceptAssistance}
                      disabled={isBusy}
                      style={styles.actionButton}
                    />
                  ) : null}

                  {/* My Case mode: progress + close + transfer */}
                  {mode === 'mycase' && isMyCase && isAccepted ? (
                    <>
                      {/* Progress steps — only directly assigned volunteer */}
                      {isDirectlyAssigned && nextProgress ? (
                        <Button
                          label={updating ? 'Updating…' : `Mark as "${nextProgress}"`}
                          onPress={() => handleUpdateProgress(nextProgress)}
                          disabled={isBusy}
                          style={styles.actionButton}
                        />
                      ) : null}

                      {/* Resolve/Close — only directly assigned, at "Reached Location" step */}
                      {isDirectlyAssigned && currentProgress === 'Reached Location' ? (
                        <Button
                          label="Mark as Resolved"
                          onPress={openResolveModal}
                          disabled={isBusy}
                          style={styles.actionButton}
                        />
                      ) : null}

                      {/* Transfer to NGO — both directly assigned AND assisting */}
                      {!transferCompleted ? (
                        <Button
                          label={
                            transferring ? 'Transferring…'
                            : transferPending ? 'Transfer Pending…'
                            : 'Transfer to NGO'
                          }
                          variant={transferPending ? 'secondary' : 'outline'}
                          onPress={transferPending ? undefined : openTransferModal}
                          disabled={isBusy || transferPending}
                          style={styles.actionButton}
                        />
                      ) : (
                        <View style={styles.transferDonePill}>
                          <Text style={styles.transferDoneText}>✅ Transferred to NGO</Text>
                        </View>
                      )}
                    </>
                  ) : null}

                  {/* My case mode, resolved — read-only */}
                  {mode === 'mycase' && isResolved ? (
                    <View style={styles.resolvedBanner}>
                      <Text style={styles.resolvedBannerText}>✅ This case has been resolved.</Text>
                    </View>
                  ) : null}

                  {/* Navigate is always shown */}
                  <Button
                    label="Navigate to Rescue"
                    variant="outline"
                    onPress={handleNavigate}
                    disabled={isBusy}
                    style={styles.actionButton}
                  />
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      {/* Resolve Modal — reusing existing ResolveRescueModal */}
      <ResolveRescueModal
        visible={resolveVisible}
        resolutionPhotoAsset={resolutionPhotoAsset}
        resolutionNote={resolutionNote}
        submitting={resolving}
        onPickPhoto={pickResolutionPhoto}
        onRemovePhoto={() => setResolutionPhotoAsset(null)}
        onNoteChange={setResolutionNote}
        onSubmit={handleSubmitResolution}
        onClose={closeResolveModal}
      />

      {/* NGO Transfer Modal */}
      <Modal
        visible={transferVisible}
        transparent
        animationType="fade"
        onRequestClose={() => { if (!transferring) setTransferVisible(false); }}
      >
        <Pressable style={styles.overlay} onPress={() => { if (!transferring) setTransferVisible(false); }}>
          <Pressable style={styles.transferModal} onPress={e => e.stopPropagation()}>
            <Text style={styles.transferModalTitle}>Transfer to NGO</Text>
            <Text style={styles.transferModalSub}>Select an NGO to handle this rescue case.</Text>

            {ngoLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : ngoList.length === 0 ? (
              <Text style={styles.noNgoText}>No NGOs available at this time.</Text>
            ) : (
              <FlatList
                data={ngoList}
                keyExtractor={item => String(item._id)}
                style={styles.ngoList}
                renderItem={({ item }) => {
                  const isSelected = selectedNgo?._id === item._id;
                  return (
                    <TouchableOpacity
                      style={[styles.ngoItem, isSelected && styles.ngoItemSelected]}
                      onPress={() => setSelectedNgo(item)}
                      activeOpacity={0.82}
                    >
                      <Text style={[styles.ngoItemText, isSelected && styles.ngoItemTextSelected]}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            )}

            <TextInput
              style={styles.remarksInput}
              placeholder="Remarks (optional)..."
              placeholderTextColor={colors.textMuted}
              value={transferRemarks}
              onChangeText={setTransferRemarks}
              multiline
              textAlignVertical="top"
              editable={!transferring}
            />

            {transferring ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
            ) : null}

            <View style={styles.transferActions}>
              <TouchableOpacity
                style={[styles.transferActionButton, styles.transferCancelButton]}
                onPress={() => setTransferVisible(false)}
                disabled={transferring}
              >
                <Text style={styles.transferCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.transferActionButton,
                  styles.transferSubmitButton,
                  (!selectedNgo || transferring) && styles.transferSubmitDisabled,
                ]}
                onPress={handleSubmitTransfer}
                disabled={!selectedNgo || transferring}
              >
                <Text style={styles.transferSubmitText}>Confirm Transfer</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    paddingBottom: 48,
  },
  imageWrap: {
    marginBottom: spacing.lg,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  assistingPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  assistingPillText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    marginBottom: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaText: {
    flex: 1,
    ...typography.meta,
    fontWeight: '700',
  },
  timeAgo: {
    ...typography.meta,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
  contactUnavailable: {
    ...typography.meta,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  descriptionCard: {
    marginBottom: spacing.lg,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    width: '100%',
    minHeight: 48,
  },
  transferDonePill: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: spacing.md,
    alignItems: 'center',
  },
  transferDoneText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '900',
  },
  resolvedBanner: {
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#86EFAC',
    padding: spacing.md,
    alignItems: 'center',
  },
  resolvedBannerText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '900',
  },
  // ── Overlay / Transfer Modal ──────────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  transferModal: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    maxHeight: '80%',
  },
  transferModalTitle: {
    ...typography.body,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  transferModalSub: {
    ...typography.meta,
    marginBottom: spacing.lg,
  },
  ngoList: {
    maxHeight: 200,
    marginBottom: spacing.md,
  },
  ngoItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.surfaceAlt,
  },
  ngoItemSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  ngoItemText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  ngoItemTextSelected: {
    color: colors.primary,
    fontWeight: '900',
  },
  noNgoText: {
    ...typography.meta,
    color: colors.textMuted,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  remarksInput: {
    height: 80,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    marginBottom: spacing.md,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  transferActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  transferActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transferCancelButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transferCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  transferSubmitButton: {
    backgroundColor: colors.primary,
  },
  transferSubmitDisabled: {
    opacity: 0.45,
  },
  transferSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { onAuthStateChanged } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { Camera } from 'lucide-react-native';
import { auth } from '../firebase';
import { BACKEND_BASE_URL, UnauthenticatedError, fetchPublicWithTimeout, fetchWithTimeout } from '../apiClient';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';
import SectionHeader from '../components/ui/SectionHeader';
import HomeHeroBanner from '../components/home/HomeHeroBanner';
import FeaturedRescueCard from '../components/home/FeaturedRescueCard';
import CommunityImpactCard from '../components/home/CommunityImpactCard';
import RecentActivityCard from '../components/home/RecentActivityCard';
import AdoptionActionSheet from '../components/home/AdoptionActionSheet';
import ReportRescueModal from '../components/home/ReportRescueModal';
import { normalizeApiError } from '../utils/apiErrorHandler';
import { normalizeDeviceError } from '../utils/deviceErrorHandler';
import { uploadImageToCloudinary } from '../utils/cloudinaryHelper';
import { formatReadableAddress } from '../utils/locationHelpers';
import { getTimeAgo } from '../utils/dateHelpers';
import { getReportErrorModalType, getReportErrorMessage, getApiErrorModalType } from '../utils/reportHelpers';
import { colors, spacing } from '../theme';

function normalizeReports(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  return [];
}

export default function HomeScreen({ currentUserProfile, route }) {
  const navigation = useNavigation();

  // ── Auth & profile ────────────────────────────────────────────────────────
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(currentUserProfile || null);

  const openReportModalParam = route?.params?.openReportModal;

  useEffect(() => {
    setBackendUser(currentUserProfile || null);
  }, [currentUserProfile]);

  // ── Report feed ───────────────────────────────────────────────────────────
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ── Report form ───────────────────────────────────────────────────────────
  const { control: reportControl, handleSubmit: submitReportForm, formState: { errors: reportErrors }, reset: resetReportHookForm } = useForm({
    defaultValues: { title: '', description: '', reportLandmark: '' },
  });
  const [severity, setSeverity] = useState('medium');
  const [selectedImages, setSelectedImages] = useState([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // ── Modal visibility ──────────────────────────────────────────────────────
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [imageActionSheetVisible, setImageActionSheetVisible] = useState(false);
  const [adoptionSheetVisible, setAdoptionSheetVisible] = useState(false);

  // ── Location ──────────────────────────────────────────────────────────────
  const [reportLocation, setReportLocation] = useState(null);
  const [reportAddress, setReportAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // ── Status modal ──────────────────────────────────────────────────────────
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState({ type: 'info', title: '', message: '' });

  const lastCameraUri = useRef(null);

  const closeStatusModal = () => setStatusModalVisible(false);
  const openStatusModal = (config) => {
    setStatusModalConfig(config);
    setStatusModalVisible(true);
  };

  // ── Load reports ──────────────────────────────────────────────────────────
  const loadReports = async () => {
    try {
      const response = await fetchPublicWithTimeout(`${BACKEND_BASE_URL}/api/reports`);
      const data = await response.json();
      if (response.ok) setReports(normalizeReports(data));
    } catch (error) {
      if (error instanceof UnauthenticatedError) return;
      throw error;
    }
  };

  // ── Android camera-recovery (process death) ───────────────────────────────
  useEffect(() => {
    const recoverLostImage = async () => {
      try {
        const pendingResult = await ImagePicker.getPendingResultAsync();
        if (pendingResult && pendingResult.length > 0) {
          const recoveredAsset = pendingResult[0];
          if (recoveredAsset.uri) {
            lastCameraUri.current = recoveredAsset.uri;
            setSelectedImages((current) => {
              const withoutOldCamera = current.filter((img) => !img._fromCamera);
              return [...withoutOldCamera, { ...recoveredAsset, _fromCamera: true }];
            });
            setReportModalVisible(true);
          }
        }
      } catch (error) {
        console.error('Failed to recover pending camera image:', error);
      }
    };
    recoverLostImage();
  }, []);

  // ── Auth listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setFirebaseUser(user);

      try {
        setReportsLoading(true);
        await loadReports();
      } catch (error) {
        console.error('Failed to load home data:', error);
        if (isMounted) {
          const apiError = normalizeApiError(error, { fallbackMessage: 'Failed to load your dashboard.' });
          openStatusModal({
            type: getApiErrorModalType(apiError.type),
            title: apiError.title,
            message: apiError.message,
            primaryButton: {
              ...apiError.primaryAction,
              onPress: apiError.primaryAction?.label === 'Try Again' ? () => { closeStatusModal(); refreshHome(); } : closeStatusModal,
            },
            secondaryButton: apiError.secondaryAction ? { ...apiError.secondaryAction, onPress: closeStatusModal } : undefined,
          });
        }
      } finally {
        if (isMounted) setReportsLoading(false);
      }
    });

    return () => { isMounted = false; unsubscribe(); };
  }, []);

  // ── Refresh ───────────────────────────────────────────────────────────────
  const refreshHome = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      if (firebaseUser) {
        const [userResponse] = await Promise.all([
          fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${firebaseUser.uid}`),
          loadReports(),
        ]);
        const responseText = await userResponse.text();
        if (userResponse.status === 404) {
          setBackendUser(null);
        } else if (userResponse.ok && responseText) {
          setBackendUser(JSON.parse(responseText));
        }
      } else {
        await loadReports();
      }
    } catch (error) {
      if (error instanceof UnauthenticatedError) return;
      console.error('Failed to refresh home:', error);
      const apiError = normalizeApiError(error, { fallbackMessage: 'Failed to refresh your dashboard.' });
      openStatusModal({
        type: getApiErrorModalType(apiError.type),
        title: apiError.title,
        message: apiError.message,
        primaryButton: {
          ...apiError.primaryAction,
          onPress: apiError.primaryAction?.label === 'Try Again' ? () => { closeStatusModal(); refreshHome(); } : closeStatusModal,
        },
        secondaryButton: apiError.secondaryAction ? { ...apiError.secondaryAction, onPress: closeStatusModal } : undefined,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const username = backendUser?.fullName || firebaseUser?.email?.split('@')?.[0] || 'there';
  const reporterName = backendUser?.fullName || username;
  const reporterContact = backendUser?.phone || '';
  const deviceToken = currentUserProfile?.deviceToken || backendUser?.deviceToken || null;

  const activeReports = useMemo(
    () => reports.filter((r) => ['pending', 'accepted'].includes((r.status || 'pending').toLowerCase())),
    [reports]
  );
  const summary = useMemo(() => ({
    active: activeReports.length,
    critical: activeReports.filter((r) => (r.severity || '').toLowerCase() === 'critical').length,
    medium: activeReports.filter((r) => (r.severity || '').toLowerCase() === 'medium').length,
    low: activeReports.filter((r) => (r.severity || '').toLowerCase() === 'low').length,
  }), [activeReports]);

  const featuredReport = useMemo(() => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...activeReports].sort((a, b) => {
      const severityDiff = (rank[(a.severity || '').toLowerCase()] ?? 4) - (rank[(b.severity || '').toLowerCase()] ?? 4);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0);
    })[0] || null;
  }, [activeReports]);

  const recentActivity = useMemo(
    () => [...reports]
      .sort((a, b) => new Date(b.resolvedAt || b.acceptedAt || b.date || 0) - new Date(a.resolvedAt || a.acceptedAt || a.date || 0))
      .slice(0, 3),
    [reports]
  );

  // ── Location ──────────────────────────────────────────────────────────────
  const refreshReportLocation = async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission denied. Please allow location access to create a report.');
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = currentLocation.coords;
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      const readableAddress = formatReadableAddress(results?.[0]);
      setReportLocation({ type: 'Point', coordinates: [longitude, latitude] });
      setReportAddress(readableAddress || `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`);
    } catch (error) {
      console.error('Failed to load report location:', error);
      const deviceError = normalizeDeviceError(error, { source: 'location' });
      setReportLocation(null);
      setReportAddress('');
      setLocationError(deviceError.message);
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (!reportModalVisible) {
      setReportLocation(null);
      setReportAddress('');
      resetReportHookForm();
      setLocationError('');
      setLocationLoading(false);
      return undefined;
    }
    let isMounted = true;
    (async () => { if (isMounted) await refreshReportLocation(); })();
    return () => { isMounted = false; };
  }, [reportModalVisible]);

  // ── Camera / Gallery ──────────────────────────────────────────────────────
  const takePhoto = async () => {
    setImageActionSheetVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        const deviceError = normalizeDeviceError({ code: 'CAMERA_PERMISSION_DENIED' }, { source: 'camera' });
        openStatusModal({ type: 'warning', title: deviceError.title, message: deviceError.message });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6, allowsEditing: false });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      lastCameraUri.current = asset.uri;
      setSelectedImages((current) => {
        const withoutOldCamera = current.filter((img) => !img._fromCamera);
        return [...withoutOldCamera, { ...asset, _fromCamera: true }];
      });
    } catch (error) {
      console.error('Camera failed:', error);
      const deviceError = normalizeDeviceError(error, { source: 'camera' });
      openStatusModal({ type: 'error', title: deviceError.title, message: deviceError.message });
    }
  };

  const pickFromGallery = async () => {
    setImageActionSheetVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        const deviceError = normalizeDeviceError({ code: 'GALLERY_PERMISSION_DENIED' }, { source: 'gallery' });
        openStatusModal({ type: 'warning', title: deviceError.title, message: deviceError.message });
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
      if (result.canceled || !result.assets?.length) return;
      setSelectedImages((current) => {
        const next = [...current];
        result.assets.forEach((asset) => { if (!next.some((e) => e.uri === asset.uri)) next.push(asset); });
        return next;
      });
    } catch (error) {
      console.error('Image picking failed:', error);
      const deviceError = normalizeDeviceError(error, { source: 'gallery' });
      openStatusModal({ type: 'error', title: deviceError.title, message: deviceError.message });
    }
  };

  const removeSelectedImage = (uriToRemove) => {
    if (lastCameraUri.current === uriToRemove) lastCameraUri.current = null;
    setSelectedImages((current) => current.filter((asset) => asset.uri !== uriToRemove));
  };

  const resetReportForm = () => {
    setReportModalVisible(false);
    setImageActionSheetVisible(false);
    resetReportHookForm();
    setSeverity('medium');
    setSelectedImages([]);
    lastCameraUri.current = null;
    setReportLocation(null);
    setReportAddress('');
    setLocationError('');
    setLocationLoading(false);
  };

  // ── Submit report ─────────────────────────────────────────────────────────
  const handleSubmitReport = async (formData) => {
    if (!selectedImages.length) {
      openStatusModal({ type: 'warning', title: 'Missing Images', message: 'Please add at least one image to your report.' });
      return;
    }
    if (!reportLocation || !Array.isArray(reportLocation.coordinates)) {
      openStatusModal({ type: 'warning', title: 'Missing Location', message: 'Please refresh location before submitting your report.' });
      return;
    }

    setReportSubmitting(true);
    try {
      const imageUrls = await Promise.all(selectedImages.map((asset, index) => uploadImageToCloudinary(asset, index)));
      const normalizedSeverity = severity.charAt(0).toUpperCase() + severity.slice(1);
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: normalizedSeverity,
        reporterName,
        reporterUid: firebaseUser?.uid || null,
        reporterContact,
        location: reportLocation,
        address: reportAddress.trim(),
        landmark: formData.reportLandmark.trim(),
        reporterDeviceToken: deviceToken,
        imageUrls,
      };

      const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const responseText = await response.text();

      if (!response.ok) {
        let responseData = null;
        if (responseText) {
          try { responseData = JSON.parse(responseText); } catch { responseData = responseText; }
        }
        throw {
          message: typeof responseData === 'string' ? responseData : responseData?.message || responseData?.error || responseText,
          status: response.status,
          responseData,
        };
      }

      openStatusModal({ type: 'success', title: 'Report Submitted', message: 'Your rescue report is now visible to nearby volunteers.' });
      resetReportForm();
      await loadReports();
    } catch (error) {
      console.error('Report submission failed:', error);
      const normalizedError = normalizeApiError(error, { fallbackMessage: 'Please try again.' });
      openStatusModal({
        type: getReportErrorModalType(normalizedError.type),
        title: normalizedError.title || 'Report Failed',
        message: getReportErrorMessage(normalizedError.type),
      });
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReportPress = () => {
    if (!firebaseUser) {
      openStatusModal({
        type: 'info',
        title: 'Sign in required',
        message: 'Please sign in to report an animal in distress.',
        primaryButton: {
          label: 'Sign In',
          onPress: () => { closeStatusModal(); navigation.navigate('Login'); },
        },
        secondaryButton: { label: 'Cancel', onPress: closeStatusModal },
      });
      return;
    }
    setReportModalVisible(true);
  };

  useEffect(() => {
    if (openReportModalParam) {
      handleReportPress();
      // Clear the param so it doesn't re-trigger
      navigation.setParams({ openReportModal: undefined });
    }
  }, [openReportModalParam]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={reportSubmitting} title="Submitting Report" message="Please wait while we send your rescue report." />
      <StatusModal
        visible={statusModalVisible}
        type={statusModalConfig.type}
        title={statusModalConfig.title}
        message={statusModalConfig.message}
        primaryButton={statusModalConfig.primaryButton || { label: 'OK', onPress: closeStatusModal, variant: 'primary' }}
        secondaryButton={statusModalConfig.secondaryButton}
        onRequestClose={closeStatusModal}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshHome} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <HomeHeroBanner
          username={username}
          onDonationsPress={() => navigation.navigate('Donations')}
          onBellPress={() => navigation.navigate('Notifications')}
        />

        <View style={styles.paddedContent}>
          <SectionHeader title="🚨 Urgent Rescue Needed" subtitle="Highest-priority active case in your area." />
          <FeaturedRescueCard
            featuredReport={featuredReport}
            reportsLoading={reportsLoading}
            onViewDetails={() => navigation.navigate('RescueFeed')}
          />


          <SectionHeader title="Community Impact Today" />
          <CommunityImpactCard summary={summary} />

          <SectionHeader title="Recent Activity" />
          <RecentActivityCard recentActivity={recentActivity} reportsLoading={reportsLoading} />
        </View>
      </ScrollView>

      {/* Report Rescue Modal */}
      <ReportRescueModal
        visible={reportModalVisible}
        onClose={resetReportForm}
        control={reportControl}
        errors={reportErrors}
        severity={severity}
        onSeverityChange={setSeverity}
        selectedImages={selectedImages}
        onAddPhotoPress={() => setImageActionSheetVisible(true)}
        onRemoveImage={removeSelectedImage}
        onRetakePhoto={takePhoto}
        locationLoading={locationLoading}
        locationError={locationError}
        reportAddress={reportAddress}
        reportLocation={reportLocation}
        onRefreshLocation={refreshReportLocation}
        onSubmit={() => submitReportForm(handleSubmitReport)()}
        submitting={reportSubmitting}
      />

      {/* Photo action sheet */}
      <Modal visible={imageActionSheetVisible} transparent animationType="slide" onRequestClose={() => setImageActionSheetVisible(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setImageActionSheetVisible(false)}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetOption} onStartShouldSetResponder={() => true}>
              {/* Empty view to stop event propagation */}
            </View>
            <TouchableOpacity style={styles.sheetRow} onPress={takePhoto} activeOpacity={0.82}>
              <View style={styles.sheetOptionIcon}>
                <Camera size={22} color={colors.primary} strokeWidth={2.3} />
              </View>
              <View style={styles.sheetOptionText}>
                <View><View /></View>
                <Text style={styles.sheetOptionLabel}>📷 Take Photo</Text>
                <Text style={styles.sheetOptionSub}>Use your camera to capture a photo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetRow} onPress={pickFromGallery} activeOpacity={0.82}>
              <View style={styles.sheetOptionIcon}>
                <Camera size={22} color={colors.primary} strokeWidth={2.3} />
              </View>
              <View style={styles.sheetOptionText}>
                <Text style={styles.sheetOptionLabel}>🖼️ Choose From Gallery</Text>
                <Text style={styles.sheetOptionSub}>Pick one or more photos from your library</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sheetCancel} onPress={() => setImageActionSheetVisible(false)} activeOpacity={0.82}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Adoption action sheet */}
      <AdoptionActionSheet
        visible={adoptionSheetVisible}
        onClose={() => setAdoptionSheetVisible(false)}
        onAdopt={() => { setAdoptionSheetVisible(false); navigation.navigate('Adopt'); }}
        onRehome={() => { setAdoptionSheetVisible(false); navigation.navigate('Rehome'); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingBottom: 108,
  },
  paddedContent: {
    paddingHorizontal: spacing.lg,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetOption: {
    display: 'none',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: {
    flex: 1,
  },
  sheetOptionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  sheetOptionSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  sheetCancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '900',
  },
});

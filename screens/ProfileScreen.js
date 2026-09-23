import { useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';
import GuestProfileScreen from '../components/profile/GuestProfileScreen';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileMetrics from '../components/profile/ProfileMetrics';
import ProfileActivity from '../components/profile/ProfileActivity';
import ProfileSettings from '../components/profile/ProfileSettings';
import { normalizeApiError } from '../utils/apiErrorHandler';
import { fetchUserProfile } from '../api/user';
import { fetchReportsByReporter, fetchClaimedReports } from '../api/reports';
import { colors, spacing, typography } from '../theme';

export default function ProfileScreen({ onLogout, currentUserProfile }) {
  const navigation = useNavigation();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [claimedReports, setClaimedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusModalConfig, setStatusModalConfig] = useState({
    type: 'info',
    title: '',
    message: '',
  });

  const closeStatusModal = () => setStatusModalVisible(false);
  const openStatusModal = (config) => {
    setStatusModalConfig(config);
    setStatusModalVisible(true);
  };

  const loadProfile = async (user, isRefresh = false) => {
    if (!user) {
      setBackendUser(null);
      setMyReports([]);
      setClaimedReports([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (!isRefresh) setLoading(true);

      // fetchUserProfile returns null on 404 (user exists in Firebase but
      // hasn't completed their profile yet — normal during signup flow).
      const userData = await fetchUserProfile(user.uid);
      setBackendUser(userData);

      if (userData) {
        // Only fetch report counts when the backend profile exists.
        const reports = await fetchReportsByReporter(user.uid);
        setMyReports(reports);

        if (userData.isVolunteer) {
          const claimed = await fetchClaimedReports(user.uid);
          setClaimedReports(claimed);
        } else {
          setClaimedReports([]);
        }
      } else {
        setMyReports([]);
        setClaimedReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      const apiError = normalizeApiError(error, { fallbackMessage: 'Failed to load profile' });
      openStatusModal({
        type: 'error',
        title: apiError.title,
        message: apiError.message,
        primaryButton: {
          ...apiError.primaryAction,
          onPress: apiError.primaryAction?.label === 'Try Again' ? () => {
            closeStatusModal();
            onRefresh();
          } : closeStatusModal,
        },
        secondaryButton: apiError.secondaryAction ? {
          ...apiError.secondaryAction,
          onPress: closeStatusModal,
        } : undefined,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Effect 1: Firebase auth listener — sets the current user and loads their profile.
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setFirebaseUser(user);
      await loadProfile(user);
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Effect 2: Navigation focus listener — re-fetches profile data when the tab
  // is re-focused (e.g., returning from My Reports or Volunteer Application).
  // Preserving existing behavior; optimization deferred to a future pass.
  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => {
      if (auth.currentUser) {
        loadProfile(auth.currentUser, true);
      }
    });
    return unsubscribeFocus;
  }, [navigation]);

  // Effect 3: Prop sync — backendUser can be pre-seeded by a parent-passed
  // currentUserProfile to avoid a loading flash on first render. This creates
  // a dual source of truth (prop vs. API response). The API response always
  // wins once loadProfile completes.
  // TODO: Simplify to useState(currentUserProfile) once parent prop stabilizes.
  useEffect(() => {
    if (currentUserProfile) {
      setBackendUser(currentUserProfile);
    } else if (!firebaseUser) {
      setBackendUser(null);
    }
  }, [currentUserProfile, firebaseUser]);

  // ── Derived display values ───────────────────────────────────────────────
  const showSkeleton = loading && !backendUser;
  const displayName = showSkeleton ? '' : (backendUser?.fullName || firebaseUser?.email?.split('@')?.[0] || 'User');
  const email = showSkeleton ? '' : (firebaseUser?.email || backendUser?.email || 'No email');
  const city = showSkeleton ? '' : (backendUser?.city || 'City not set');
  const volunteerStatus = showSkeleton ? '' : (backendUser?.volunteerStatus || (backendUser?.isVolunteer ? 'Volunteer' : 'Community Member'));
  const initial = displayName ? displayName.charAt(0).toUpperCase() : '';

  const metrics = useMemo(() => ({
    submitted: myReports.length,
    active: claimedReports.filter((r) => r.status === 'accepted').length,
    completed: claimedReports.filter((r) => r.status === 'resolved').length,
  }), [myReports, claimedReports]);

  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadProfile(firebaseUser, true);
  };

  const handleLogout = async () => {
    openStatusModal({
      type: 'warning',
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      primaryButton: {
        label: 'Logout',
        variant: 'danger',
        onPress: () => {
          closeStatusModal();
          onLogout?.();
        },
      },
      secondaryButton: {
        label: 'Cancel',
        variant: 'secondary',
        onPress: closeStatusModal,
      },
    });
  };

  // ── Guest state ────────────────────────────────────────────────────────────
  if (!firebaseUser && !loading) {
    return <GuestProfileScreen />;
  }

  // ── Authenticated state ────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      <LoadingOverlay visible={loading} title="Loading Profile" message="Fetching your details..." />
      <StatusModal
        visible={statusModalVisible}
        type={statusModalConfig.type}
        title={statusModalConfig.title}
        message={statusModalConfig.message}
        primaryButton={
          statusModalConfig.primaryButton || {
            label: 'OK',
            onPress: closeStatusModal,
            variant: 'primary',
          }
        }
        secondaryButton={statusModalConfig.secondaryButton}
        onRequestClose={closeStatusModal}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <Text style={styles.title}>Profile</Text>

        <ProfileHeader
          initial={initial}
          displayName={displayName}
          email={email}
          volunteerStatus={volunteerStatus}
          city={city}
        />

        <ProfileMetrics metrics={metrics} />

        <ProfileActivity reports={myReports} />

        <ProfileSettings
          backendUser={backendUser}
          navigation={navigation}
          onLogout={handleLogout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  title: {
    ...typography.title,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
});

import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme';
import { fetchMyProfile, submitVolunteerApplication } from '../api/volunteer';
import VolunteerApplyState from '../components/volunteer/VolunteerApplyState';
import VolunteerPendingState from '../components/volunteer/VolunteerPendingState';
import VolunteerApprovedState from '../components/volunteer/VolunteerApprovedState';
import VolunteerRejectedState from '../components/volunteer/VolunteerRejectedState';
import VolunteerSuspendedState from '../components/volunteer/VolunteerSuspendedState';

export default function VolunteerApplicationScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await fetchMyProfile();
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    load(true);
  };

  const handleApply = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      const updated = await submitVolunteerApplication(profile);
      setProfile(updated);
    } catch (err) {
      Alert.alert('Submission failed', err.message || 'Could not submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const volunteerStatus = profile?.volunteerStatus || 'none';
  const suspensionReason = profile?.volunteerSuspensionReason || null;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Back button row */}
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Status-specific content */}
        {volunteerStatus === 'none' && (
          <VolunteerApplyState onApply={handleApply} submitting={submitting} />
        )}
        {volunteerStatus === 'pending' && (
          <VolunteerPendingState />
        )}
        {volunteerStatus === 'approved' && (
          <VolunteerApprovedState />
        )}
        {volunteerStatus === 'rejected' && (
          <VolunteerRejectedState
            onReapply={handleApply}
            submitting={submitting}
            rejectionReason={suspensionReason}
          />
        )}
        {volunteerStatus === 'suspended' && (
          <VolunteerSuspendedState suspensionReason={suspensionReason} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  backRow: {
    marginBottom: spacing.md,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
  },
  errorText: {
    color: colors.critical,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  retryButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
  },
});

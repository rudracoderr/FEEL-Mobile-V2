import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { Bell } from 'lucide-react-native';
import { BACKEND_BASE_URL, fetchPublicWithTimeout } from '../../apiClient';
import RescueCard from '../../components/RescueCard';
import PaidVolunteerRescueDetailsModal from '../../components/paidVolunteer/PaidVolunteerRescueDetailsModal';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import { calculateDistanceKm, formatDistanceLabel } from '../../utils/locationHelpers';
import { getTimeAgo } from '../../utils/dateHelpers';
import { colors, spacing, typography } from '../../theme';

const TABS = ['unclaimed', 'accepted'];
const TAB_LABELS = { unclaimed: '🔴 Unclaimed', accepted: '🟡 Accepted Nearby' };
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function normalizeReports(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  return [];
}

export default function NearbyReportsScreen({ currentUserProfile }) {
  const navigation = useNavigation();
  const uid = currentUserProfile?.uid || null;
  const userCoordinates = currentUserProfile?.location?.coordinates || null; // [lng, lat]

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('unclaimed');
  const [selectedReport, setSelectedReport] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }

  const horizontalScrollRef = useRef(null);
  const [pagerHeight, setPagerHeight] = useState(0);

  // ── Get device location on mount ─────────────────────────────────────────
  useEffect(() => {
    let isActive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isActive) {
            setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          }
        }
      } catch (_) {
        // Location unavailable — feed still works without radius filter
      }
    })();
    return () => { isActive = false; };
  }, []);

  // ── Fetch reports when location ready ────────────────────────────────────
  useEffect(() => {
    fetchReports(false, userLocation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  const fetchReports = async (isRefresh = false, location = userLocation) => {
    try {
      if (!isRefresh) setLoading(true);

      // Fetch a radius-filtered feed if we have the user's location.
      // Use the paid volunteer's rescueRadius if set, otherwise default to 25 km.
      const radiusKm = currentUserProfile?.rescueRadius || 25;
      let url = `${BACKEND_BASE_URL}/api/reports`;
      if (location) {
        url += `?lat=${location.latitude}&lng=${location.longitude}&radius=${radiusKm}`;
      }

      const response = await fetchPublicWithTimeout(url);
      const data = await response.json();
      const fetched = normalizeReports(data);
      // Sort newest first
      fetched.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
      setReports(fetched);
    } catch (error) {
      console.error('NearbyReportsScreen: failed to fetch reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Derive user coordinates for distance calc ─────────────────────────────
  // Prefer live device location; fall back to profile stored coordinates.
  const effectiveCoordinates = useMemo(() => {
    if (userLocation) return [userLocation.longitude, userLocation.latitude];
    if (Array.isArray(userCoordinates) && userCoordinates.length === 2) return userCoordinates;
    return null;
  }, [userLocation, userCoordinates]);

  // ── Enrich reports with distance label ───────────────────────────────────
  const enrichedReports = useMemo(() => reports.map((report) => {
    const distanceKm = calculateDistanceKm(effectiveCoordinates, report.location?.coordinates);
    return { ...report, distanceKm, distanceLabel: formatDistanceLabel(distanceKm) };
  }), [reports, effectiveCoordinates]);

  // ── Group into unclaimed / accepted — excluding own reports & self-accepts ─
  const groupedReports = useMemo(() => {
    const unclaimed = [];
    const accepted = [];

    enrichedReports.forEach((report) => {
      const status = (report.status || 'pending').toLowerCase();

      // Exclude resolved reports — paid volunteers act on live cases only
      if (status === 'resolved') return;

      // Exclude reports submitted by this user
      if (report.reporterUid && report.reporterUid === uid) return;

      if (status === 'pending') {
        unclaimed.push(report);
      } else if (status === 'accepted') {
        // Exclude reports this paid volunteer already claimed themselves
        if (report.assignedVolunteer?.uid && report.assignedVolunteer.uid === uid) return;
        accepted.push(report);
      }
    });

    return { unclaimed, accepted };
  }, [enrichedReports, uid]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchReports(true, userLocation);
  };

  const handleAcceptSuccess = (refreshedReport) => {
    // Replace the stale list entry with the freshly-accepted report.
    // This causes useMemo to re-evaluate: the report leaves Unclaimed
    // (status is now 'accepted') and — because the paid volunteer is the
    // assignedVolunteer — it is also excluded from Accepted Nearby.
    // Net effect: the report disappears from both visible tabs immediately.
    setReports((prev) =>
      prev.map((r) => (r._id === refreshedReport._id ? refreshedReport : r))
    );
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    const index = TABS.indexOf(tab);
    if (index !== -1) {
      horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
  };

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SCREEN_WIDTH);
    if (index >= 0 && index < TABS.length) {
      setActiveTab((prev) => (prev !== TABS[index] ? TABS[index] : prev));
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState message="Loading nearby reports..." />
      </View>
    );
  }

  const activeCount = (groupedReports[activeTab] || []).length;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title} numberOfLines={1}>Nearby Reports</Text>
          <Text style={styles.subtitle}>{activeCount} report{activeCount !== 1 ? 's' : ''} in this view</Text>
        </View>
        <TouchableOpacity style={styles.headerBellBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.82}>
          <Bell size={20} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Tab Chips */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          const count = (groupedReports[tab] || []).length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => handleTabPress(tab)}
              activeOpacity={0.82}
            >
              <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                {TAB_LABELS[tab]}  ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Swipeable Paged FlatLists */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onLayout={(e) => setPagerHeight(e.nativeEvent.layout.height)}
        style={styles.pager}
        contentContainerStyle={{ width: SCREEN_WIDTH * TABS.length }}
        scrollEventThrottle={16}
      >
        {TABS.map((tab) => {
          const list = groupedReports[tab] || [];
          const emptyMessages = {
            unclaimed: 'No unclaimed rescues nearby.',
            accepted: 'No accepted rescues nearby.',
          };

          return (
            <View key={tab} style={{ width: SCREEN_WIDTH, height: pagerHeight }}>
              {pagerHeight > 0 && (
                <FlatList
                  data={list}
                  keyExtractor={(item, index) => item._id || String(index)}
                  contentContainerStyle={list.length === 0 ? styles.emptyContainer : styles.feedContainer}
                  ListEmptyComponent={
                    <EmptyState
                      title="All clear"
                      message={emptyMessages[tab]}
                    />
                  }
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor={colors.primary}
                      colors={[colors.primary]}
                    />
                  }
                  initialNumToRender={6}
                  maxToRenderPerBatch={8}
                  windowSize={5}
                  removeClippedSubviews={Platform.OS === 'android'}
                  renderItem={({ item: report }) => (
                    <RescueCard
                      report={report}
                      imageUrls={report.imageUrls || []}
                      title={report.title}
                      description={report.description}
                      severity={report.severity || 'medium'}
                      reporterName={report.reporterName}
                      status={report.status || 'pending'}
                      distance={report.distanceLabel}
                      timeAgo={getTimeAgo(report.date || report.createdAt)}
                      assignedVolunteerName={report.assignedVolunteer?.fullName}
                      // Show the primary action button based on tab context
                      showAcceptButton={tab === 'unclaimed'}
                      onAccept={() => setSelectedReport(report)}
                      onPress={() => setSelectedReport(report)}
                    />
                  )}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Detail Modal */}
      <PaidVolunteerRescueDetailsModal
        visible={Boolean(selectedReport)}
        report={selectedReport}
        currentUserUid={uid}
        onClose={() => setSelectedReport(null)}
        onAcceptSuccess={handleAcceptSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  headerBellBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.meta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
  pager: {
    flex: 1,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingBottom: 108,
  },
  feedContainer: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
});

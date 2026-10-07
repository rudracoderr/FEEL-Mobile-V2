import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { onAuthStateChanged } from 'firebase/auth';
import * as Location from 'expo-location';
import { auth } from '../firebase';
import { BACKEND_BASE_URL, UnauthenticatedError, fetchPublicWithTimeout, fetchWithTimeout } from '../apiClient';
import RescueCard from '../components/RescueCard';
import RescueDetailsModal from '../components/RescueDetailsModal';
import EmptyState from '../components/ui/EmptyState';
import LoadingState from '../components/ui/LoadingState';
import StatusModal from '../components/ui/StatusModal';
import RescueFeedFilters from '../components/feed/RescueFeedFilters';
import RadiusActionSheet from '../components/feed/RadiusActionSheet';
import { normalizeApiError } from '../utils/apiErrorHandler';
import { calculateDistanceKm, formatDistanceLabel } from '../utils/locationHelpers';
import { getTimeAgo } from '../utils/dateHelpers';
import { isOwnReport } from '../utils/reportHelpers';
import { colors, radius, spacing, typography } from '../theme';

const FILTERS = ['pending', 'accepted', 'resolved'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');

function normalizeReports(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.reports)) return data.reports;
  return [];
}

// Initial per-tab pagination state — one entry per status tab.
const INITIAL_PAGE_STATE = () => Object.fromEntries(FILTERS.map((f) => [f, 1]));
const INITIAL_HAS_MORE_STATE = () => Object.fromEntries(FILTERS.map((f) => [f, true]));
const INITIAL_LOADING_MORE_STATE = () => Object.fromEntries(FILTERS.map((f) => [f, false]));
const INITIAL_REPORTS_STATE = () => Object.fromEntries(FILTERS.map((f) => [f, []]));

export default function RescueFeedScreen() {
  // Per-tab report lists: { pending: [], accepted: [], resolved: [] }
  const [reportsByTab, setReportsByTab] = useState(INITIAL_REPORTS_STATE);
  // Per-tab pagination state
  const [tabPage, setTabPage]           = useState(INITIAL_PAGE_STATE);
  const [tabHasMore, setTabHasMore]     = useState(INITIAL_HAS_MORE_STATE);
  const [tabLoadingMore, setTabLoadingMore] = useState(INITIAL_LOADING_MORE_STATE);

  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [currentFirebaseUser, setCurrentFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeFilter, setActiveFilter] = useState('pending');
  const [activeRadius, setActiveRadius] = useState(null); // null = All
  const [radiusSheetVisible, setRadiusSheetVisible] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // { latitude, longitude }
  const horizontalScrollRef = useRef(null);
  // Synchronous in-flight lock for the claim action — prevents concurrent
  // HTTP requests from rapid taps causing contradictory UI modal responses.
  // A ref is used (not state) so the guard is set synchronously before the
  // first await, immune to stale-closure issues.
  const claimInFlightRef = useRef(false);

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

  useEffect(() => {
    let isMounted = true;

    // Request location permission and get current position.
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (isMounted) setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch (_) {
        // Location unavailable — radius filter will stay hidden.
      }
    })();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setCurrentFirebaseUser(user || null);

      if (user) {
        // Authenticated: load this user's profile for volunteer features.
        try {
          const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/users/${user.uid}`);
          const responseText = await response.text();
          if (response.status === 404) {
            if (isMounted) setCurrentUserProfile(null);
          } else if (response.ok && responseText && isMounted) {
            setCurrentUserProfile(JSON.parse(responseText));
          }
        } catch (error) {
          console.error('Failed to load current user profile:', error);
          if (isMounted) setCurrentUserProfile(null);
        }
      } else {
        // Guest: no profile to load.
        if (isMounted) setCurrentUserProfile(null);
      }

      // Always fetch reports — guests see the feed too.
      // Load page 1 of all tabs in parallel on auth state resolve.
      fetchAllTabsPage1();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // ── Core paginated fetch ──────────────────────────────────────────────────
  // Fetches one page of reports for a specific status tab.
  // pageNum=1 replaces the tab list; pageNum>1 appends (infinite scroll).
  // All existing filters (radius, assistancePending, assistanceAcceptedBy)
  // are preserved and forwarded to the backend.
  const fetchReports = useCallback(async ({
    pageNum      = 1,
    statusFilter = activeFilter,
    radiusKm     = activeRadius,
    location     = userLocation,
    isRefresh    = false,
  } = {}) => {
    const isFirstPage = pageNum === 1;

    try {
      if (isFirstPage && !isRefresh) setLoading(true);

      // Build URL — status is now sent to the server so it filters at DB level.
      const params = new URLSearchParams({
        page:   String(pageNum),
        limit:  '20',
        status: statusFilter,
      });
      if (radiusKm && location) {
        params.set('lat',    String(location.latitude));
        params.set('lng',    String(location.longitude));
        params.set('radius', String(radiusKm));
      }

      // Public endpoint — no auth required, works for guests and signed-in users.
      const response = await fetchPublicWithTimeout(
        `${BACKEND_BASE_URL}/api/reports?${params.toString()}`
      );
      const data = await response.json();

      // Backend returns { reports: [...], pagination: { hasMore, ... } }
      // normalizeReports handles the old plain-array shape as a fallback.
      const incoming  = normalizeReports(data);
      const paginMeta = data?.pagination ?? null;
      const more      = paginMeta != null ? paginMeta.hasMore : incoming.length === 20;

      setReportsByTab((prev) => ({
        ...prev,
        [statusFilter]: isFirstPage ? incoming : [...prev[statusFilter], ...incoming],
      }));
      setTabPage((prev)    => ({ ...prev, [statusFilter]: pageNum }));
      setTabHasMore((prev) => ({ ...prev, [statusFilter]: more }));
    } catch (error) {
      if (error instanceof UnauthenticatedError) {
        // User logged out — expected, suppress silently.
        return;
      }
      console.error('Failed to fetch rescue reports:', error);
      const apiError = normalizeApiError(error, { fallbackMessage: 'Could not load rescue feed' });
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
      // Clear loadingMore flag for this tab regardless of success/failure.
      setTabLoadingMore((prev) => ({ ...prev, [statusFilter]: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeRadius, userLocation]);

  // Loads page 1 of every tab in parallel — used on initial mount and refresh.
  const fetchAllTabsPage1 = useCallback((
    radiusKm = activeRadius,
    location = userLocation,
    isRefresh = false,
  ) => {
    FILTERS.forEach((filter) => {
      fetchReports({ pageNum: 1, statusFilter: filter, radiusKm, location, isRefresh });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchReports]);

  // Loads the next page for a specific tab (called by onEndReached).
  const fetchNextPage = useCallback((filter) => {
    if (tabLoadingMore[filter] || !tabHasMore[filter]) return;
    setTabLoadingMore((prev) => ({ ...prev, [filter]: true }));
    fetchReports({
      pageNum:      tabPage[filter] + 1,
      statusFilter: filter,
    });
  }, [fetchReports, tabHasMore, tabLoadingMore, tabPage]);

  const handleAcceptReport = async (report) => {
    // Block immediately — prevents rapid taps from firing multiple concurrent
    // claim requests whose out-of-order responses produce contradictory modals.
    if (claimInFlightRef.current) return;

    if (!currentFirebaseUser?.uid) {
      openStatusModal({
        type: 'warning',
        title: 'Sign in required',
        message: 'Please sign in again to accept this rescue.',
      });
      return;
    }

    claimInFlightRef.current = true;
    const rescueAlreadyClaimedMessage = 'Rescue already claimed by another volunteer.';

    try {
      const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${report._id}/accept`, {
        method: 'PATCH',
        body: JSON.stringify({ uid: currentFirebaseUser.uid }),
      });
      const data = await response.json();

      if (response.status === 409 || response.status === 403 || data?.success === false) {
        openStatusModal({
          type: 'warning',
          title: 'Unable to accept',
          message: data?.message || rescueAlreadyClaimedMessage,
        });
        // ponytail: reconcile stale card — re-fetch the single report and
        // merge into every tab's list, same as the success path below.
        try {
          const staleRefreshRes = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${report._id}`);
          const staleRefreshed = await staleRefreshRes.json();
          if (staleRefreshRes.ok && staleRefreshed?._id) {
            setReportsByTab((prev) => {
              const next = { ...prev };
              Object.keys(next).forEach((tab) => {
                next[tab] = next[tab].map((item) =>
                  item._id === staleRefreshed._id ? staleRefreshed : item
                );
              });
              return next;
            });
            if (selectedReport?._id === staleRefreshed._id) setSelectedReport(staleRefreshed);
          }
        } catch (_) { /* best-effort, silent */ }
        return;
      }

      const refreshResponse = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/reports/${report._id}`);
      const refreshedReport = await refreshResponse.json();
      if (!refreshResponse.ok) {
        throw new Error(refreshedReport?.error || refreshedReport?.message || 'Failed to refresh rescue status');
      }

      setReportsByTab((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((tab) => {
          next[tab] = next[tab].map((item) => (item._id === refreshedReport._id ? refreshedReport : item));
        });
        return next;
      });
      if (selectedReport?._id === refreshedReport._id) setSelectedReport(refreshedReport);

      if (refreshedReport?.assignedVolunteer?.uid !== currentFirebaseUser.uid) {
        openStatusModal({
          type: 'warning',
          title: 'Unable to accept',
          message: rescueAlreadyClaimedMessage,
        });
        return;
      }

      openStatusModal({
        type: 'success',
        title: 'Accepted',
        message: 'You are now assigned to this rescue.',
      });
    } catch (error) {
      const apiError = normalizeApiError(error, { fallbackMessage: 'Please try again.' });
      openStatusModal({
        type: 'error',
        title: 'Unable to accept',
        message: apiError.message,
      });
    } finally {
      // Release the lock — allows retry on error, and ensures state is always
      // cleaned up even if the function returns early via an unhandled path.
      claimInFlightRef.current = false;
    }
  };

  const currentUserCoordinates = currentUserProfile?.location?.coordinates;
  const currentUserIsVolunteer = Boolean(currentUserProfile?.isVolunteer);

  // Augment each tab's reports with client-side distanceKm/distanceLabel.
  // Server now handles status grouping; we only need the distance annotation.
  const displayReportsByTab = useMemo(() => {
    const result = {};
    FILTERS.forEach((filter) => {
      result[filter] = (reportsByTab[filter] || []).map((report) => {
        const distanceKm = calculateDistanceKm(currentUserCoordinates, report.location?.coordinates);
        return { ...report, distanceKm, distanceLabel: formatDistanceLabel(distanceKm) };
      });
    });
    return result;
  }, [reportsByTab, currentUserCoordinates]);

  // Count shown in the header — reflects the currently loaded page count for the active tab.
  const filteredReportsCount = (displayReportsByTab[activeFilter] || []).length;

  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    // Reset pagination counters so infinite scroll restarts from page 1.
    // Do NOT clear reportsByTab — keep existing data visible during the fetch
    // so the horizontal ScrollView never collapses and the filter bubbles
    // never resize. The tab lists are replaced naturally when fetchReports
    // returns page 1 (isFirstPage=true → setReportsByTab replaces, not appends).
    setTabPage(INITIAL_PAGE_STATE());
    setTabHasMore(INITIAL_HAS_MORE_STATE());
    setTabLoadingMore(INITIAL_LOADING_MORE_STATE());
    fetchAllTabsPage1(activeRadius, userLocation, true);
  };

  const handleRadiusChange = (value) => {
    setRadiusSheetVisible(false);
    setActiveRadius(value);
    // Reset pagination counters only — keep existing data visible while the
    // new radius-filtered fetch is in flight (same layout-stability reason
    // as onRefresh above). Tab lists are replaced when page 1 arrives.
    setTabPage(INITIAL_PAGE_STATE());
    setTabHasMore(INITIAL_HAS_MORE_STATE());
    setTabLoadingMore(INITIAL_LOADING_MORE_STATE());
    fetchAllTabsPage1(value, userLocation);
  };

  const activeRadiusLabel = activeRadius == null
    ? 'All'
    : `${activeRadius} km`;

  // ── Swipe ↔ Chip synchronization ──────────────────────────────────────────
  const handleFilterPress = (filter) => {
    // Tab change does NOT reset reports — each tab maintains its own list.
    // The tab's list is already loaded (all tabs load page 1 on mount/refresh).
    setActiveFilter(filter);
    const index = FILTERS.indexOf(filter);
    if (index !== -1) {
      horizontalScrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    }
  };

  const onScroll = (e) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    if (xOffset < 0 || xOffset > SCREEN_WIDTH * (FILTERS.length - 1)) return;
    const index = Math.round(xOffset / SCREEN_WIDTH);
    if (index >= 0 && index < FILTERS.length) {
      setActiveFilter((prev) => (prev !== FILTERS[index] ? FILTERS[index] : prev));
    }
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState message="Loading rescue alerts..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
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

      {/* ── Compact header ─────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Rescue Feed</Text>
          <Text style={styles.subtitle}>{filteredReportsCount} reports nearby</Text>
        </View>
        {userLocation ? (
          <TouchableOpacity
            style={styles.radiusPill}
            onPress={() => setRadiusSheetVisible(true)}
            activeOpacity={0.82}
          >
            <Text style={styles.radiusPillText}>📍 {activeRadiusLabel} ▼</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {(currentUserProfile?.isSuspended || currentUserProfile?.volunteerStatus === 'suspended') ? (
        <View style={styles.suspensionBanner}>
          <Text style={styles.suspensionText}>Your volunteer account has been suspended.</Text>
        </View>
      ) : null}

      {/* ── Status filter chips ─────────────────────────────── */}
      <RescueFeedFilters activeFilter={activeFilter} onFilterPress={handleFilterPress} />

      {/* ── Paging ScrollView with per-status FlatLists ────── */}
      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        contentContainerStyle={{ width: SCREEN_WIDTH * FILTERS.length }}
        scrollEventThrottle={16}
      >
        {FILTERS.map((filter) => {
          const list        = displayReportsByTab[filter] || [];
          const isLoadMore  = tabLoadingMore[filter];
          const canLoadMore = tabHasMore[filter];
          return (
            <View key={filter} style={{ width: SCREEN_WIDTH }}>
              {list.length === 0 && !loading ? (
                <View style={styles.emptyWrap}>
                  <EmptyState
                    title="No rescue alerts"
                    message={`No ${filter} rescues found.`}
                  />
                </View>
              ) : (
                <FlatList
                  data={list}
                  keyExtractor={(item, index) => item._id || String(index)}
                  contentContainerStyle={styles.feedContainer}
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
                  // ── Infinite scroll ──────────────────────────────────────
                  onEndReachedThreshold={0.4}
                  onEndReached={() => {
                    if (!isLoadMore && canLoadMore) {
                      fetchNextPage(filter);
                    }
                  }}
                  ListFooterComponent={
                    isLoadMore
                      ? <ActivityIndicator size="small" color={colors.primary} style={styles.loadMoreIndicator} />
                      : null
                  }
                  // ────────────────────────────────────────────────────────
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
                      showAcceptButton={
                        currentUserIsVolunteer &&
                        !currentUserProfile?.isSuspended &&
                        currentUserProfile?.volunteerStatus !== 'suspended' &&
                        (report.status || 'pending') === 'pending' &&
                        typeof report.distanceKm === 'number' &&
                        report.distanceKm <= 10 &&
                        !isOwnReport(report, currentFirebaseUser?.uid)
                      }
                      onAccept={() => handleAcceptReport(report)}
                      onPress={() => setSelectedReport(report)}
                    />
                  )}
                />
              )}
            </View>
          );
        })}
      </ScrollView>

      <RescueDetailsModal
        visible={Boolean(selectedReport)}
        report={selectedReport}
        currentUserUid={currentFirebaseUser?.uid || null}
        onClose={() => setSelectedReport(null)}
      />

      {/* ── Radius action sheet ─────────────────────────────── */}
      <RadiusActionSheet
        visible={radiusSheetVisible}
        activeRadius={activeRadius}
        onSelect={handleRadiusChange}
        onClose={() => setRadiusSheetVisible(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.meta,
    marginTop: 2,
    fontWeight: '700',
  },
  radiusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    marginLeft: spacing.md,
  },
  radiusPillText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  suspensionBanner: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  suspensionText: {
    color: colors.critical,
    fontWeight: '800',
    fontSize: 13,
  },
  feedContainer: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  emptyWrap: {
    padding: spacing.lg,
  },
  loadMoreIndicator: {
    paddingVertical: spacing.lg,
  },
});

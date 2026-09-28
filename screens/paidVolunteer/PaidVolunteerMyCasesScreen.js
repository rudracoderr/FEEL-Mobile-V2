import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation } from '@react-navigation/native';
import { MapPin } from 'lucide-react-native';
import ReportImageGallery from '../../components/ReportImageGallery';
import PaidVolunteerRescueDetailsModal from '../../components/paidVolunteer/PaidVolunteerRescueDetailsModal';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import { fetchMyCases } from '../../api/reports';
import { getTimeAgo } from '../../utils/dateHelpers';
import { calculateDistanceKm, formatDistanceLabel } from '../../utils/locationHelpers';
import { colors, radius, spacing, typography } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ['active', 'completed'];

// ── Case Card ─────────────────────────────────────────────────────────────────
function MyCaseCard({ report, distanceLabel, isAssisting, onPress }) {
  const progress = report.volunteerProgress || (report.status === 'resolved' ? 'Resolved' : 'Assigned');

  const handleNavigate = () => {
    const coords = report?.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) {
      Alert.alert('Location unavailable for this rescue.');
      return;
    }
    const [lng, lat] = coords;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`).catch(() =>
      Alert.alert('Location unavailable for this rescue.')
    );
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Card style={styles.card}>
        <ReportImageGallery imageUrls={report.imageUrls || []} height={160} />

        <View style={styles.badgeRow}>
          <StatusBadge status={report.status} />
          <SeverityBadge severity={report.severity || 'medium'} />
          {isAssisting && (
            <View style={styles.assistingPill}>
              <Text style={styles.assistingPillText}>Assisting</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{report.title}</Text>

        <View style={styles.progressBox}>
          <Text style={styles.progressLabel}>Current status</Text>
          <Text style={styles.progressValue}>{progress}</Text>
        </View>

        <View style={styles.metaRow}>
          <MapPin size={14} color={colors.textSecondary} strokeWidth={2.2} />
          <Text style={styles.metaText}>{distanceLabel}</Text>
        </View>
        {report.address ? (
          <Text style={styles.meta} numberOfLines={1}>{report.address}</Text>
        ) : null}
        <Text style={styles.meta}>Reported {getTimeAgo(report.date || report.createdAt)}</Text>

        <View style={styles.cardActions}>
          <Button label="View Details" onPress={onPress} style={styles.cardActionButton} />
          <Button label="Navigate" variant="outline" onPress={handleNavigate} style={styles.cardActionButton} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function PaidVolunteerMyCasesScreen({ currentUserProfile }) {
  const route = useRoute();
  const navigation = useNavigation();
  const uid = currentUserProfile?.uid || null;
  const userCoordinates = currentUserProfile?.location?.coordinates || null;

  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedReport, setSelectedReport] = useState(null);

  const horizontalScrollRef = useRef(null);

  const loadCases = useCallback(async (isRefresh = false) => {
    if (!uid) {
      setLoading(false);
      return;
    }
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await fetchMyCases(uid);
      setCases(data);

      // Handle deep link redirect
      if (route.params?.autoOpenReportId) {
        const targetReport = data.find(r => r._id === route.params.autoOpenReportId);
        if (targetReport) {
          setSelectedReport(targetReport);
          
          // Switch tab to completed if the case is done
          const isCompleted = targetReport.status === 'resolved' || targetReport.assistance?.status === 'completed';
          if (isCompleted) {
            setActiveTab('completed');
            horizontalScrollRef.current?.scrollTo({ x: SCREEN_WIDTH, animated: true });
          }
        }
        navigation.setParams({ autoOpenReportId: undefined });
      }
    } catch (err) {
      setError(err.message || 'Failed to load your cases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [uid]);

  // Initial load
  useEffect(() => {
    loadCases(false);
  }, [loadCases]);

  // Refresh when tab comes into focus (e.g. after accepting a rescue/assistance)
  useFocusEffect(
    useCallback(() => {
      loadCases(false);
    }, [loadCases])
  );

  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadCases(true);
  };

  // Split into active / completed.
  //
  // For directly-assigned PVs the report's own status is the source of truth.
  // For assisting PVs the assistance.status is used as the decisive signal:
  //   • assistance.status === 'completed'  → NGO accepted the transfer; the PV's
  //     role is done even though report.status is still 'accepted' while the NGO
  //     works the case.  Move it out of Active immediately.
  //   • report.status === 'resolved'       → the whole case is closed (either by
  //     the volunteer or by the NGO via close).
  const { activeCases, completedCases } = useMemo(() => ({
    activeCases: cases.filter(
      (r) => r.status === 'accepted' && r.assistance?.status !== 'completed',
    ),
    completedCases: cases.filter(
      (r) => r.status === 'resolved' || r.assistance?.status === 'completed',
    ),
  }), [cases]);

  // Determine if user is assisting (not directly assigned) for a given report
  const isAssistingCase = (report) =>
    report.assistance?.acceptedByUid === uid && report.assignedVolunteer?.uid !== uid;

  const distanceFor = (report) =>
    formatDistanceLabel(calculateDistanceKm(userCoordinates, report.location?.coordinates));

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    const idx = TABS.indexOf(tab);
    if (idx !== -1) horizontalScrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const onScroll = (e) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / SCREEN_WIDTH);
    if (idx >= 0 && idx < TABS.length) {
      setActiveTab(prev => (prev !== TABS[idx] ? TABS[idx] : prev));
    }
  };

  // Called by modal after any action that changes report state
  const handleCaseUpdated = (updatedReport) => {
    setCases(prev => prev.map(r => (r._id === updatedReport._id ? updatedReport : r)));
    setSelectedReport(updatedReport);
  };

  // Called when a case is fully resolved/closed — moves it off the active list
  const handleCaseClosed = (updatedReport) => {
    setCases(prev => prev.map(r => (r._id === updatedReport._id ? updatedReport : r)));
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState message="Loading your cases..." />
      </View>
    );
  }

  const currentList = activeTab === 'active' ? activeCases : completedCases;

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Cases</Text>
        <Text style={styles.subtitle}>
          {activeCases.length} active · {completedCases.length} completed
        </Text>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadCases(false)} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Tab chips */}
      {!error ? (
        <>
          <View style={styles.tabRow}>
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              const count = tab === 'active' ? activeCases.length : completedCases.length;
              const label = tab === 'active' ? '🟡 Active' : '✅ Completed';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabChip, isActive && styles.tabChipActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                    {label}  ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            ref={horizontalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            contentContainerStyle={{ width: SCREEN_WIDTH * TABS.length }}
            scrollEventThrottle={16}
          >
            {TABS.map(tab => {
              const list = tab === 'active' ? activeCases : completedCases;
              const emptyMsg = tab === 'active'
                ? 'No active cases. Accept a rescue or assistance request to see it here.'
                : 'No completed cases yet.';
              return (
                <View key={tab} style={{ width: SCREEN_WIDTH }}>
                  {list.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <EmptyState title="Nothing here" message={emptyMsg} />
                    </View>
                  ) : (
                    <FlatList
                      data={list}
                      keyExtractor={item => item._id}
                      contentContainerStyle={styles.listContent}
                      showsVerticalScrollIndicator={false}
                      refreshControl={
                        <RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                          tintColor={colors.primary}
                          colors={[colors.primary]}
                        />
                      }
                      renderItem={({ item }) => (
                        <MyCaseCard
                          report={item}
                          distanceLabel={distanceFor(item)}
                          isAssisting={isAssistingCase(item)}
                          onPress={() => setSelectedReport(item)}
                        />
                      )}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>
        </>
      ) : null}

      {/* Detail modal */}
      <PaidVolunteerRescueDetailsModal
        visible={Boolean(selectedReport)}
        report={selectedReport}
        currentUserUid={uid}
        mode="mycase"
        onClose={() => setSelectedReport(null)}
        onCaseUpdated={handleCaseUpdated}
        onCaseClosed={handleCaseClosed}
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
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.meta,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '700',
  },
  errorBox: {
    margin: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.critical,
    fontSize: 13,
    fontWeight: '700',
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.critical,
    borderRadius: radius.sm,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
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
  emptyWrap: {
    padding: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  cardTitle: {
    ...typography.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  progressBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  progressValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  metaText: {
    flex: 1,
    ...typography.meta,
    fontWeight: '700',
  },
  meta: {
    ...typography.meta,
    fontWeight: '700',
    marginTop: 3,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cardActionButton: {
    flex: 1,
    minHeight: 44,
  },
});

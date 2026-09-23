import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Clock, MapPin, Navigation, ShieldAlert, UserRound } from 'lucide-react-native';
import ReportImageGallery from '../../components/ReportImageGallery';
import Card from '../../components/ui/Card';
import SeverityBadge from '../../components/ui/SeverityBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingState from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import PaidVolunteerRescueDetailsModal from '../../components/paidVolunteer/PaidVolunteerRescueDetailsModal';
import { fetchAssistanceRequests } from '../../api/reports';
import { getTimeAgo } from '../../utils/dateHelpers';
import { colors, radius, spacing, typography } from '../../theme';

// ── Assistance Request Card ───────────────────────────────────────────────────
function AssistanceRequestCard({ report, onViewDetails }) {
  const volunteerName = report.assignedVolunteer?.fullName || 'Unknown volunteer';
  const timeAgo = getTimeAgo(report.assistance?.requestedAt || report.date || report.createdAt);
  const location = report.address || report.landmark || 'Location shared';

  return (
    <TouchableOpacity onPress={() => onViewDetails(report)} activeOpacity={0.88}>
      <Card style={styles.card}>
        <ReportImageGallery imageUrls={report.imageUrls || []} height={160} />

        <View style={styles.badgeRow}>
          <StatusBadge status={report.status} />
          <SeverityBadge severity={report.severity || 'medium'} />
          {/* Assistance pending pill */}
          <View style={styles.assistancePill}>
            <ShieldAlert size={12} color="#92400E" strokeWidth={2.5} />
            <Text style={styles.assistancePillText}>Needs Assistance</Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>{report.title}</Text>

        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <UserRound size={14} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.metaText}>Assigned: {volunteerName}</Text>
          </View>
          <View style={styles.metaRow}>
            <MapPin size={14} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Clock size={14} color={colors.textSecondary} strokeWidth={2.2} />
            <Text style={styles.metaText}>Requested {timeAgo}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            label="View & Accept"
            onPress={() => onViewDetails(report)}
            style={styles.actionButton}
          />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AssistanceRequestsScreen({ currentUserProfile }) {
  const uid = currentUserProfile?.uid || null;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  const loadRequests = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await fetchAssistanceRequests();
      setRequests(data);
    } catch (err) {
      setError(err.message || 'Failed to load assistance requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(false);
  }, [loadRequests]);

  const onRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    loadRequests(true);
  };

  // Called by PaidVolunteerRescueDetailsModal after a successful accept-assistance.
  // The accepted report should no longer appear in the list (its assistance.status is now "accepted").
  const handleAcceptSuccess = (refreshedReport) => {
    setRequests((prev) => prev.filter((r) => r._id !== refreshedReport._id));
    setSelectedReport(null);
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <LoadingState message="Loading assistance requests..." />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Assistance Requests</Text>
        <Text style={styles.subtitle}>
          {requests.length > 0
            ? `${requests.length} volunteer${requests.length !== 1 ? 's' : ''} need${requests.length === 1 ? 's' : ''} your help`
            : 'Requests from regular volunteers'}
        </Text>
      </View>

      {/* Error state */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => loadRequests(false)} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* List */}
      {!error && (
        <FlatList
          data={requests}
          keyExtractor={(item) => item._id}
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
          ListEmptyComponent={
            <EmptyState
              title="No assistance requests"
              message="When a volunteer needs help with their rescue, their request will appear here."
              style={styles.empty}
            />
          }
          renderItem={({ item }) => (
            <AssistanceRequestCard
              report={item}
              onViewDetails={setSelectedReport}
            />
          )}
        />
      )}

      {/* Detail modal — passes mode="assistance" so Accept Assistance is used */}
      <PaidVolunteerRescueDetailsModal
        visible={Boolean(selectedReport)}
        report={selectedReport}
        currentUserUid={uid}
        mode="assistance"
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
    paddingBottom: spacing.md,
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
  listContent: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  empty: {
    marginTop: spacing.xxxl,
  },
  // ── Card styles ──────────────────────────────────────────────────────────
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
  assistancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warningSoft,
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  assistancePillText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
  },
  cardTitle: {
    ...typography.heading,
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  metaList: {
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  metaText: {
    flex: 1,
    ...typography.meta,
    fontWeight: '700',
  },
  actions: {
    marginTop: spacing.md,
  },
  actionButton: {
    minHeight: 44,
  },
});

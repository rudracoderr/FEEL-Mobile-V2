import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';
import { getTimeAgo } from '../../utils/dateHelpers';
import { colors, spacing, typography } from '../../theme';

/**
 * Timeline card showing the last 3 recent rescue events.
 * Purely presentational.
 *
 * @param {Array}   recentActivity  Array of up to 3 recent report objects.
 * @param {boolean} reportsLoading  Shows a spinner while reports load.
 */
export default function RecentActivityCard({ recentActivity, reportsLoading }) {
  return (
    <Card style={styles.timelineCard}>
      {reportsLoading ? (
        <ActivityIndicator style={{ paddingVertical: 20 }} size="small" color={colors.primary} />
      ) : recentActivity.length ? recentActivity.map((report) => (
        <View key={report._id} style={styles.timelineItem}>
          <View style={styles.timelineDot} />
          <View style={styles.timelineBody}>
            <Text style={styles.timelineTitle}>{report.title}</Text>
            <Text style={styles.timelineMeta}>
              {getTimeAgo(report.resolvedAt || report.acceptedAt || report.date)} · {report.status || 'pending'}
            </Text>
          </View>
        </View>
      )) : (
        <Text style={styles.emptyText}>No recent rescue activity yet.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  timelineCard: {
    marginBottom: spacing.xxl,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  timelineBody: {
    flex: 1,
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  timelineMeta: {
    ...typography.meta,
    marginTop: 2,
  },
  emptyText: {
    ...typography.meta,
    marginTop: spacing.sm,
  },
});

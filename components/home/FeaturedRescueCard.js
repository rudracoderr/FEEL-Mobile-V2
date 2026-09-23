import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SeverityBadge from '../ui/SeverityBadge';
import StatusBadge from '../ui/StatusBadge';
import { getTimeAgo } from '../../utils/dateHelpers';
import { colors, spacing, typography } from '../../theme';

/**
 * The highest-priority active rescue card shown on the HomeScreen.
 * Purely presentational.
 *
 * @param {object|null} featuredReport   The most urgent active report, or null.
 * @param {boolean}     reportsLoading   Shows a spinner while reports load.
 * @param {Function}    onViewDetails    Navigates to the RescueFeed screen.
 */
export default function FeaturedRescueCard({ featuredReport, reportsLoading, onViewDetails }) {
  if (reportsLoading) {
    return (
      <Card style={styles.featuredCard}>
        <ActivityIndicator style={{ paddingVertical: 40 }} size="large" color={colors.primary} />
      </Card>
    );
  }

  if (!featuredReport) {
    return (
      <Card style={styles.featuredCard}>
        <Text style={styles.emptyTitle}>No rescue reports nearby.</Text>
        <Text style={styles.emptyText}>Be the first to report an animal in your area.</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.featuredCard}>
      <View style={styles.featuredTop}>
        <View style={styles.badges}>
          <StatusBadge status={featuredReport.status} />
          <SeverityBadge severity={featuredReport.severity} />
        </View>
        <Text style={styles.featuredTime}>{getTimeAgo(featuredReport.date || featuredReport.createdAt)}</Text>
      </View>
      <Text style={styles.featuredTitle}>{featuredReport.title}</Text>
      <Text style={styles.featuredMeta}>
        {featuredReport.address || featuredReport.landmark || 'Location shared with volunteers'}
      </Text>
      <Text style={styles.featuredDescription} numberOfLines={3}>{featuredReport.description}</Text>
      <Button label="View Details & Navigate" onPress={onViewDetails} style={styles.featuredButton} />
    </Card>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    marginBottom: spacing.xxl,
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
    flex: 1,
  },
  featuredTime: {
    ...typography.meta,
    fontWeight: '800',
  },
  featuredTitle: {
    ...typography.heading,
  },
  featuredMeta: {
    ...typography.meta,
    marginTop: spacing.xs,
    fontWeight: '800',
  },
  featuredDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  featuredButton: {
    marginTop: spacing.lg,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  emptyText: {
    ...typography.meta,
    marginTop: spacing.sm,
  },
});

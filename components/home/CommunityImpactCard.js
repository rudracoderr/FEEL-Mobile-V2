import { StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';
import { colors, spacing } from '../../theme';

/**
 * Compact stats row showing Active / Critical / Medium / Low report counts.
 * Purely presentational.
 *
 * @param {{ active: number, critical: number, medium: number, low: number }} summary
 */
export default function CommunityImpactCard({ summary }) {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryStatsRow}>
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: colors.text }]}>{summary.active}</Text>
          <Text style={styles.summaryStatLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: colors.critical }]}>{summary.critical}</Text>
          <Text style={styles.summaryStatLabel}>Critical</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: colors.medium }]}>{summary.medium}</Text>
          <Text style={styles.summaryStatLabel}>Medium</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryStatItem}>
          <Text style={[styles.summaryStatValue, { color: colors.success }]}>{summary.low}</Text>
          <Text style={styles.summaryStatLabel}>Low</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xxl,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
});

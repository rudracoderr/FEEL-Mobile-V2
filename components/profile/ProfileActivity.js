import { StyleSheet, Text, View } from 'react-native';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { colors, spacing, typography } from '../../theme';

/**
 * @param {Array} reports - The full array of the user's reports; only the
 *   first 3 are shown. Filtering is intentionally kept here since this
 *   component defines the "show 3" display contract.
 */
export default function ProfileActivity({ reports }) {
  const recent = reports.slice(0, 3);

  return (
    <>
      <SectionHeader title="Recent activity" />
      <Card style={styles.activityCard}>
        {recent.length ? recent.map((report) => (
          <View key={report._id} style={styles.activityRow}>
            <View style={styles.activityDot} />
            <View style={styles.activityText}>
              <Text style={styles.activityTitle}>{report.title}</Text>
              <Text style={styles.activityMeta}>{report.status || 'pending'}</Text>
            </View>
          </View>
        )) : (
          <Text style={styles.activityMeta}>No recent submitted reports yet.</Text>
        )}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  activityCard: {
    marginBottom: spacing.xxl,
  },
  activityRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  activityText: {
    flex: 1,
  },
  activityTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  activityMeta: {
    ...typography.meta,
    marginTop: 2,
  },
});

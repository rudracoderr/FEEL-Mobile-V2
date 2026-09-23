import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle, FileText, ShieldCheck } from 'lucide-react-native';
import Card from '../ui/Card';
import { formatDateLabel } from '../../utils/dateHelpers';
import { colors, spacing, typography } from '../../theme';

/**
 * Renders the rescue timeline card (Created → Accepted → Resolved).
 * Purely presentational — no state.
 *
 * @param {object} report - The hydrated rescue report.
 */
export default function RescueTimeline({ report }) {
  if (!report) return null;

  return (
    <Card style={styles.timelineCard}>
      <Text style={styles.sectionHeading}>Rescue Timeline</Text>

      <View style={styles.timelineItem}>
        <View style={styles.timelineDot} />
        <View style={styles.timelineBody}>
          <View style={styles.timelineLabelRow}>
            <FileText size={15} color={colors.primary} strokeWidth={2.3} />
            <Text style={styles.timelineLabel}>Report Created</Text>
          </View>
          <Text style={styles.timelineDate}>{formatDateLabel(report.date || report.createdAt)}</Text>
        </View>
      </View>

      {report.acceptedAt ? (
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.timelineDotPrimary]} />
          <View style={styles.timelineBody}>
            <View style={styles.timelineLabelRow}>
              <ShieldCheck size={15} color={colors.primary} strokeWidth={2.3} />
              <Text style={styles.timelineLabel}>Volunteer Accepted</Text>
            </View>
            <Text style={styles.timelineDate}>{formatDateLabel(report.acceptedAt)}</Text>
          </View>
        </View>
      ) : null}

      {report.resolvedAt ? (
        <View style={styles.timelineItem}>
          <View style={[styles.timelineDot, styles.timelineDotSuccess]} />
          <View style={styles.timelineBody}>
            <View style={styles.timelineLabelRow}>
              <CheckCircle size={15} color={colors.success} strokeWidth={2.3} />
              <Text style={styles.timelineLabel}>Rescue Resolved</Text>
            </View>
            <Text style={styles.timelineDate}>{formatDateLabel(report.resolvedAt)}</Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  timelineCard: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    ...typography.body,
    fontWeight: '900',
    fontSize: 15,
    marginBottom: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
    marginTop: 5,
  },
  timelineDotPrimary: {
    backgroundColor: colors.primary,
  },
  timelineDotSuccess: {
    backgroundColor: colors.success,
  },
  timelineBody: {
    flex: 1,
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  timelineLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  timelineDate: {
    ...typography.meta,
    marginTop: 2,
  },
});

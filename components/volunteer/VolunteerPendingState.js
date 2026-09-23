import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { HeroIcon } from './shared';

export default function VolunteerPendingState() {
  return (
    <View style={styles.centeredSection}>
      <HeroIcon bg={colors.warningSoft}>
        <Clock size={40} color={colors.medium} strokeWidth={2} />
      </HeroIcon>
      <Text style={styles.stateTitle}>Application Under Review</Text>
      <Text style={styles.stateSubtitle}>
        Your volunteer application has been submitted and is currently being reviewed by the FEEL admin team.
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: colors.warningSoft }]}>
        <Text style={[styles.statusBadgeText, { color: colors.medium }]}>
          ⏳  Pending Approval
        </Text>
      </View>
      <Text style={styles.stateNote}>
        You'll gain volunteer access once an admin approves your application. This usually takes 1–3 days.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredSection: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  stateTitle: {
    ...typography.heading,
    textAlign: 'center',
  },
  stateSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    maxWidth: 320,
  },
  statusBadge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stateNote: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
});

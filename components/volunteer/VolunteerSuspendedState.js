import { StyleSheet, Text, View } from 'react-native';
import { ShieldOff } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { HeroIcon } from './shared';

export default function VolunteerSuspendedState({ suspensionReason }) {
  return (
    <View style={styles.centeredSection}>
      <HeroIcon bg={colors.dangerSoft}>
        <ShieldOff size={40} color={colors.critical} strokeWidth={2} />
      </HeroIcon>
      <Text style={styles.stateTitle}>Volunteer Access Suspended</Text>
      <Text style={styles.stateSubtitle}>
        Your volunteer account has been temporarily suspended by the FEEL admin team.
      </Text>
      {suspensionReason ? (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonLabel}>Reason</Text>
          <Text style={styles.reasonText}>{suspensionReason}</Text>
        </View>
      ) : null}
      <View style={[styles.statusBadge, { backgroundColor: colors.dangerSoft }]}>
        <Text style={[styles.statusBadgeText, { color: colors.critical }]}>
          ⛔  Suspended
        </Text>
      </View>
      <Text style={styles.stateNote}>
        If you believe this is a mistake, please contact the FEEL support team for assistance.
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
  reasonCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.critical,
    marginBottom: spacing.xs,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
    fontWeight: '600',
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

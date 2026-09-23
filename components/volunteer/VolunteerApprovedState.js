import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { HeroIcon, RoleRow } from './shared';

export default function VolunteerApprovedState() {
  return (
    <View style={styles.centeredSection}>
      <HeroIcon bg={colors.successSoft}>
        <CheckCircle size={40} color={colors.success} strokeWidth={2} />
      </HeroIcon>
      <Text style={styles.stateTitle}>You're a Volunteer!</Text>
      <Text style={styles.stateSubtitle}>
        Your application has been approved. You can now respond to rescue alerts in your area.
      </Text>
      <View style={[styles.statusBadge, { backgroundColor: colors.successSoft }]}>
        <Text style={[styles.statusBadgeText, { color: colors.success }]}>
          ✅  Active Volunteer
        </Text>
      </View>
      {/* Bug fix: original had two style props on this View — merged into array */}
      <View style={[styles.card, { marginTop: spacing.xl }]}>
        <Text style={styles.cardTitle}>Your volunteer perks</Text>
        <RoleRow emoji="🗂️" label="Access the Claimed Rescues tab" />
        <RoleRow emoji="🔔" label="Get notified of nearby rescue alerts" />
        <RoleRow emoji="🏆" label="Track your rescue impact on your profile" />
      </View>
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
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});

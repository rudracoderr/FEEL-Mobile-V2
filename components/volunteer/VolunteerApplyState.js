import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HeartHandshake } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { HeroIcon, RoleRow } from './shared';

export default function VolunteerApplyState({ onApply, submitting }) {
  return (
    <>
      <View style={styles.hero}>
        <HeroIcon bg={colors.primarySoft}>
          <HeartHandshake size={40} color={colors.primary} strokeWidth={2} />
        </HeroIcon>
        <Text style={styles.kicker}>FEEL Volunteer Program</Text>
        <Text style={styles.heroTitle}>Become a Volunteer</Text>
        <Text style={styles.heroSubtitle}>
          Help rescue animals in your community by becoming a certified FEEL volunteer.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What volunteers do</Text>
        <RoleRow emoji="🚨" label="Respond to nearby rescue alerts" />
        <RoleRow emoji="📍" label="Travel to the animal's location" />
        <RoleRow emoji="🤝" label="Coordinate with reporters on-site" />
        <RoleRow emoji="📸" label="Document and resolve rescues" />
        <RoleRow emoji="❤️" label="Make a real difference every day" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Requirements</Text>
        <RoleRow emoji="📱" label="Must have location access enabled" />
        <RoleRow emoji="🏙️" label="Must be in a city with active rescues" />
        <RoleRow emoji="⏱️" label="Available to respond within 60 minutes" />
        <RoleRow emoji="🔒" label="Application reviewed by FEEL admin team" />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        onPress={onApply}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>Apply to Volunteer</Text>
        )}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    ...typography.body,
    textAlign: 'center',
    color: colors.textSecondary,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});

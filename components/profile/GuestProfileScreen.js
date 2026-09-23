import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../../theme';

function FeatureRow({ emoji, label }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

export default function GuestProfileScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        {/* Mascot paw */}
        <View style={styles.pawContainer}>
          <Text style={styles.pawEmoji}>🐾</Text>
        </View>

        {/* Brand name */}
        <Text style={styles.brand}>FEEL</Text>
        <Text style={styles.tagline}>Welcome to FEEL</Text>
        <Text style={styles.description}>
          Join the FEEL community to report animals, track rescues, and help animals in need.
        </Text>

        {/* Feature highlights */}
        <View style={styles.featuresCard}>
          <FeatureRow emoji="🚨" label="Report animals in distress" />
          <FeatureRow emoji="📍" label="Track active rescues near you" />
          <FeatureRow emoji="🤝" label="Connect with local volunteers" />
          <FeatureRow emoji="❤️" label="Make a difference every day" />
        </View>

        {/* Sign In */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.87}
        >
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Create Account — standard signup, no volunteer intent */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.87}
        >
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Become a Volunteer — signup with volunteer intent stored as route param */}
        <TouchableOpacity
          style={styles.volunteerButton}
          onPress={() => navigation.navigate('Signup', { volunteerIntent: true })}
          activeOpacity={0.87}
        >
          <Text style={styles.volunteerButtonText}>🤝  Become a Volunteer</Text>
        </TouchableOpacity>

        <Text style={styles.browsingNote}>
          You're browsing as a guest. Sign in to unlock full features.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg + 8,
    paddingBottom: 60,
  },
  pawContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  pawEmoji: {
    fontSize: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2.5,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 34,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 10,
  },
  featureEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  secondaryButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  volunteerButton: {
    width: '100%',
    height: 52,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  volunteerButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  browsingNote: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

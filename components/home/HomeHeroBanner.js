import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, HeartHandshake } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

/**
 * Hero banner at the top of HomeScreen.
 * Purely presentational — navigation callbacks are passed from the orchestrator.
 *
 * @param {string}   username            Greeting name (first name or email prefix).
 * @param {Function} onDonationsPress    Navigate to Donations screen.
 * @param {Function} onBellPress         (Future) notification handler.
 */
export default function HomeHeroBanner({ username, onDonationsPress, onBellPress }) {
  return (
    <View style={styles.heroBanner}>
      {/* Soft background swoosh */}
      <View style={styles.heroSwoosh} />
      {/* Paw print decorations */}
      <Text style={styles.pawTopRight}>🐾</Text>
      <Text style={styles.pawBottomLeft}>🐾</Text>

      {/* Top-right icon buttons — absolutely positioned */}
      <View style={styles.heroIconRow}>
        <TouchableOpacity style={styles.heroIconButton} onPress={onDonationsPress} activeOpacity={0.82}>
          <HeartHandshake size={19} color={colors.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.heroIconButton} onPress={onBellPress} activeOpacity={0.82}>
          <Bell size={19} color={colors.text} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Left: greeting + tagline */}
      <View style={styles.heroLeft}>
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.userName}>{username} 👋</Text>
        <Text style={styles.heroTagline}>
          Every rescue brings hope.{`\n`}Let's make a difference today. 🧡
        </Text>
      </View>

      {/* Right: mascot */}
      <Image
        source={require('../../assets/image.png')}
        style={styles.heroMascot}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    backgroundColor: '#FFF1EA',
    marginBottom: spacing.xl,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    overflow: 'hidden',
    minHeight: 180,
  },
  heroSwoosh: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#FFE4D4',
    top: -90,
    right: -60,
  },
  pawTopRight: {
    position: 'absolute',
    top: spacing.sm,
    right: 100,
    fontSize: 18,
    opacity: 0.22,
    transform: [{ rotate: '20deg' }],
  },
  pawBottomLeft: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    fontSize: 14,
    opacity: 0.15,
    transform: [{ rotate: '-15deg' }],
  },
  heroLeft: {
    flex: 1,
    paddingRight: spacing.md,
    alignSelf: 'flex-start',
    paddingTop: 10,
  },
  heroIconRow: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    zIndex: 10,
  },
  heroIconButton: {
    marginTop: 18,
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    marginTop: 10,
    lineHeight: 42,
  },
  heroTagline: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  heroMascot: {
    width: 120,
    height: 150,
    alignSelf: 'flex-end',
    marginBottom: -25,
  },
});

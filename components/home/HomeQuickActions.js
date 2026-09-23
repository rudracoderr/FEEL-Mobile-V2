import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HeartHandshake, PawPrint, Plus } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

/**
 * Three-card quick-action row on the HomeScreen.
 * Purely presentational — all press handlers are injected from the orchestrator.
 *
 * @param {Function} onReportPress       Opens the Report Rescue flow.
 * @param {Function} onViewRescuesPress  Navigates to RescueFeed.
 * @param {Function} onAdoptionsPress    Opens the Adoption action sheet.
 */
export default function HomeQuickActions({ onReportPress, onViewRescuesPress, onAdoptionsPress }) {
  return (
    <View style={styles.quickActionsRow}>
      <TouchableOpacity style={styles.quickActionCard} onPress={onReportPress} activeOpacity={0.86}>
        <View style={styles.quickIconCircle}>
          <Plus size={22} color={colors.primary} strokeWidth={2.8} />
        </View>
        <Text style={styles.quickActionLabel}>Report Rescue</Text>
        <Text style={styles.quickActionSub}>Report animal in distress</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionCard} onPress={onViewRescuesPress} activeOpacity={0.86}>
        <View style={styles.quickIconCircle}>
          <HeartHandshake size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.quickActionLabel}>View Rescues</Text>
        <Text style={styles.quickActionSub}>Explore active cases</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.quickActionCard} onPress={onAdoptionsPress} activeOpacity={0.86}>
        <View style={styles.quickIconCircle}>
          <PawPrint size={22} color={colors.primary} strokeWidth={2.2} />
        </View>
        <Text style={styles.quickActionLabel}>Adoptions</Text>
        <Text style={styles.quickActionSub}>Adopt or Rehome</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },
  quickActionSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
});

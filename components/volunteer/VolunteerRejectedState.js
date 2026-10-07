import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RefreshCw, X, XCircle } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { HeroIcon } from './shared';

export default function VolunteerRejectedState({ onReapply, submitting, rejectionReason }) {
  return (
    <View style={styles.centeredSection}>
      <HeroIcon bg={colors.dangerSoft}>
        <XCircle size={40} color={colors.critical} strokeWidth={2} />
      </HeroIcon>
      <Text style={styles.stateTitle}>Application Not Approved</Text>
      <Text style={styles.stateSubtitle}>
        Unfortunately your previous application was not approved at this time.
      </Text>
      {rejectionReason ? (
        <View style={styles.reasonCard}>
          <Text style={styles.reasonLabel}>Reason from admin</Text>
          <Text style={styles.reasonText}>{rejectionReason}</Text>
        </View>
      ) : null}
      <View style={[styles.statusBadge, { backgroundColor: colors.dangerSoft }]}>
        <X
          size={14}
          color={colors.critical}
          strokeWidth={3}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        <Text style={[styles.statusBadgeText, { color: colors.critical }]}>
          Application Rejected
        </Text>
      </View>
      <Text style={styles.stateNote}>
        You may reapply. If your circumstances have changed, please submit a new application.
      </Text>
      <TouchableOpacity
        style={[styles.primaryButton, submitting && styles.buttonDisabled, { marginTop: spacing.xl }]}
        onPress={onReapply}
        disabled={submitting}
        activeOpacity={0.85}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <RefreshCw size={16} color="#fff" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Reapply Now</Text>
          </>
        )}
      </TouchableOpacity>
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
    borderColor: colors.dangerBorder,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  primaryButton: {
    height: 54,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
    width: '100%',
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

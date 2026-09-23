import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const REASONS = ['Fake Report', 'Spam', 'Wrong Location', 'Duplicate Report', 'Other'];

/**
 * Report Abuse bottom-modal.
 * Owns its own radio UI rendering only; abuse submission API call stays in parent.
 *
 * @param {boolean}       visible          Whether the modal is open.
 * @param {string|null}   selectedReason   The currently selected reason.
 * @param {boolean}       submitting       Whether the submit API call is in flight.
 * @param {Function}      onSelectReason   Called with the selected reason string.
 * @param {Function}      onSubmit         Called when user confirms.
 * @param {Function}      onClose          Called when user cancels.
 */
export default function ReportAbuseModal({
  visible,
  selectedReason,
  submitting,
  onSelectReason,
  onSubmit,
  onClose,
}) {
  const handleClose = () => {
    if (!submitting) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Report Abuse</Text>
          <Text style={styles.modalSubtitle}>
            Why are you reporting this rescue report? Your report helps us keep the community safe.
          </Text>

          {REASONS.map((reason) => {
            const isSelected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                onPress={() => onSelectReason(reason)}
                activeOpacity={0.8}
                disabled={submitting}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text style={[styles.reasonText, isSelected && styles.reasonTextActive]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            );
          })}

          {submitting && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalCancelButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalActionButton,
                styles.modalSubmitButton,
                (!selectedReason || submitting) && styles.modalSubmitButtonDisabled,
              ]}
              onPress={onSubmit}
              disabled={!selectedReason || submitting}
            >
              <Text style={styles.modalSubmitText}>Submit Report</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  modalTitle: {
    ...typography.body,
    fontWeight: '900',
    fontSize: 20,
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.meta,
    marginBottom: spacing.xl,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: colors.surfaceAlt,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  reasonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  reasonTextActive: {
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.45,
    backgroundColor: colors.primary,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

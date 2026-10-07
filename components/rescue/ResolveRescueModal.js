import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * "Mark as Resolved" form modal.
 * Owns only the photo picker UI and note input rendering.
 * The actual ImagePicker call and Cloudinary upload stay in the parent.
 *
 * @param {boolean}         visible              Whether the modal is open.
 * @param {object|null}     resolutionPhotoAsset The currently selected photo asset (or null).
 * @param {string}          resolutionNote       Current value of the note input.
 * @param {boolean}         submitting           Whether the resolution API call is in flight.
 * @param {Function}        onPickPhoto          Called when user taps "Add Resolution Photo".
 * @param {Function}        onRemovePhoto        Called when user taps "Remove photo".
 * @param {Function}        onNoteChange         Called with updated note string.
 * @param {Function}        onSubmit             Called when user confirms.
 * @param {Function}        onClose              Called when user cancels.
 */
export default function ResolveRescueModal({
  visible,
  resolutionPhotoAsset,
  resolutionNote,
  submitting,
  onPickPhoto,
  onRemovePhoto,
  onNoteChange,
  onSubmit,
  onClose,
}) {
  const canSubmit = resolutionPhotoAsset && resolutionNote.trim() && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContainer} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Mark as Resolved</Text>
          <Text style={styles.modalSubtitle}>
            Provide a photo and note to document the rescue outcome.
          </Text>

          {/* Photo picker */}
          <TouchableOpacity
            style={styles.photoButton}
            onPress={onPickPhoto}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {resolutionPhotoAsset ? (
              <Image source={{ uri: resolutionPhotoAsset.uri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Camera size={28} color={colors.primary} strokeWidth={2.2} />
                <Text style={styles.photoButtonText}>Add Resolution Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {resolutionPhotoAsset && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={onRemovePhoto}
              disabled={submitting}
            >
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </TouchableOpacity>
          )}

          {/* Note input */}
          <TextInput
            style={styles.noteInput}
            placeholder="Rescue outcome notes..."
            placeholderTextColor={colors.textMuted}
            value={resolutionNote}
            onChangeText={onNoteChange}
            multiline
            textAlignVertical="top"
            editable={!submitting}
            maxLength={2000}
          />

          {submitting && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: spacing.md }} />
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalActionButton, styles.modalCancelButton]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalActionButton,
                styles.resolutionSubmitButton,
                !canSubmit && styles.modalSubmitButtonDisabled,
              ]}
              onPress={onSubmit}
              disabled={!canSubmit}
            >
              <Text style={styles.modalSubmitText}>Confirm Resolve</Text>
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
  photoButton: {
    height: 150,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
  },
  photoButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  removePhotoButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  removePhotoText: {
    color: colors.critical,
    fontSize: 13,
    fontWeight: '700',
  },
  noteInput: {
    height: 110,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    marginBottom: spacing.sm,
    fontSize: 15,
    textAlignVertical: 'top',
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
  resolutionSubmitButton: {
    backgroundColor: colors.success,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.45,
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

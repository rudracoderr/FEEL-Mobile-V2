import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Home, PawPrint } from 'lucide-react-native';
import { colors, radius, spacing, typography } from '../../theme';

/**
 * Bottom-sheet modal for the Adoption Center.
 * Purely presentational — navigation callbacks are injected from HomeScreen.
 *
 * @param {boolean}  visible    Whether the sheet is open.
 * @param {Function} onClose    Dismiss the sheet.
 * @param {Function} onAdopt    Navigate to the Adopt screen.
 * @param {Function} onRehome   Navigate to the Rehome screen.
 */
export default function AdoptionActionSheet({ visible, onClose, onAdopt, onRehome }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Adoption Center</Text>

          <TouchableOpacity style={styles.sheetOption} onPress={onAdopt} activeOpacity={0.82}>
            <View style={styles.sheetOptionIcon}>
              <PawPrint size={22} color={colors.primary} strokeWidth={2.3} />
            </View>
            <View style={styles.sheetOptionText}>
              <Text style={styles.sheetOptionLabel}>🐶 I Want to Adopt</Text>
              <Text style={styles.sheetOptionSub}>Find a loving companion in need of a home</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={onRehome} activeOpacity={0.82}>
            <View style={styles.sheetOptionIcon}>
              <Home size={22} color={colors.primary} strokeWidth={2.3} />
            </View>
            <View style={styles.sheetOptionText}>
              <Text style={styles.sheetOptionLabel}>🏠 I Want to Rehome an Animal</Text>
              <Text style={styles.sheetOptionSub}>Submit an animal to find them a safe home</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose} activeOpacity={0.82}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 12,
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: {
    ...typography.heading,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionText: {
    flex: 1,
  },
  sheetOptionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  sheetOptionSub: {
    ...typography.meta,
    marginTop: 2,
  },
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  sheetCancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '900',
  },
});

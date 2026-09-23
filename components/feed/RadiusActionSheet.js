import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

const RADIUS_FILTERS = [
  { label: 'All', value: null },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: '20 km', value: 20 },
];

/**
 * Bottom-sheet modal for selecting the search radius on the Rescue Feed.
 *
 * @param {boolean}       visible          Whether the sheet is open.
 * @param {number|null}   activeRadius     Currently selected radius value (null = All).
 * @param {Function}      onSelect         Called with the selected radius value.
 * @param {Function}      onClose          Called when the user dismisses the sheet.
 */
export default function RadiusActionSheet({ visible, activeRadius, onSelect, onClose }) {
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
          <Text style={styles.sheetTitle}>Search Radius</Text>
          {RADIUS_FILTERS.map((rf) => {
            const isActive = activeRadius === rf.value;
            return (
              <TouchableOpacity
                key={String(rf.value)}
                style={[styles.sheetOption, isActive && styles.sheetOptionActive]}
                onPress={() => onSelect(rf.value)}
                activeOpacity={0.82}
              >
                <Text style={[styles.sheetOptionText, isActive && styles.sheetOptionTextActive]}>
                  {rf.label === 'All' ? '🌍  All distances' : `📍  Within ${rf.label}`}
                </Text>
                {isActive && <Text style={styles.sheetOptionCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
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
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  sheetOptionActive: {
    backgroundColor: colors.primarySoft,
  },
  sheetOptionText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  sheetOptionTextActive: {
    color: colors.primary,
  },
  sheetOptionCheck: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
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

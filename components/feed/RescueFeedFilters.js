import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../../theme';

const FILTERS = ['pending', 'accepted', 'resolved'];

/**
 * Horizontal scrolling filter chip row for the Rescue Feed.
 *
 * @param {string}   activeFilter     The currently selected filter value.
 * @param {Function} onFilterPress    Called with the selected filter string.
 */
export default function RescueFeedFilters({ activeFilter, onFilterPress }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      style={styles.filterWrap}
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter;
        const label = filter.charAt(0).toUpperCase() + filter.slice(1);
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onFilterPress(filter)}
            activeOpacity={0.85}
            style={[styles.filterChip, isActive && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  filterRow: {
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});

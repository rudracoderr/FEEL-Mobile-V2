import { StyleSheet, Text, View } from 'react-native';

/**
 * Circular icon container used by all volunteer status state components.
 */
export function HeroIcon({ children, bg }) {
  return (
    <View style={[styles.iconRing, { backgroundColor: bg }]}>
      {children}
    </View>
  );
}

/**
 * Single emoji + label row used inside info cards.
 */
export function RoleRow({ emoji, label }) {
  return (
    <View style={styles.roleRow}>
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={styles.roleLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  roleEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  roleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
  },
});

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors } from '../../theme';

/**
 * CameraFAB — integrated centre tab bar button with wave notch.
 *
 * The FAB sits inside the tab bar's flex slot but visually overflows
 * upward with a smooth curved notch effect. A larger white "notch ring"
 * sits behind the button, matching the tab bar background so it blends
 * seamlessly and creates the wave/arch cutout appearance.
 */
export default function CameraFAB({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Report an animal"
    >
      {/* Notch ring — white disc that blends with tab bar background
          and creates the curved wave arch behind the FAB */}
      <View style={styles.notchRing} />

      {/* The actual FAB circle */}
      <View style={styles.fab}>
        <Camera size={26} color="#FFFFFF" strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

const FAB_SIZE = 58;
const NOTCH_SIZE = FAB_SIZE + 16; // 74px — the wave ring
const OVERFLOW = 24;              // how far FAB protrudes above the tab bar

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Allow content to render above the tab bar boundary
    overflow: 'visible',
    // Pull the whole slot upward so FAB overflows
    marginTop: -OVERFLOW,
  },
  notchRing: {
    position: 'absolute',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: colors.card,
    top: 4,
    // Add upward shadow to simulate the tab bar curving up
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 0,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    // iOS shadow
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    // Android elevation
    elevation: 8,
  },
});

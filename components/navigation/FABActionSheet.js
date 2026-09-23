import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HeartHandshake, Home as HomeIcon, X } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

const ACTIONS = [
  {
    id: 'injury',
    icon: HeartHandshake,
    iconColor: colors.primary,
    label: '🚑 Injury Report',
    subtitle: 'Report an injured or sick animal.',
  },
  {
    id: 'rehome',
    icon: HomeIcon,
    iconColor: '#6366F1',
    label: '🏠 Rehome / Adoption',
    subtitle: 'Help an animal find a new home.',
  },
];

/**
 * FABActionSheet
 *
 * A bottom sheet that slides up when the centre FAB is tapped.
 *
 * Props:
 *  visible      {boolean}  — whether the sheet is open
 *  onClose      {function} — called when the sheet should close
 *  onInjury     {function} — called when "Injury Report" is selected
 *  onRehome     {function} — called when "Rehome / Adoption" is selected
 */
export default function FABActionSheet({ visible, onClose, onInjury, onRehome }) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Android back button dismisses the sheet
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const handleAction = (action) => {
    onClose();
    // Small delay so sheet animates out before navigation fires
    setTimeout(() => {
      if (action === 'injury') onInjury?.();
      if (action === 'rehome') onRehome?.();
    }, 120);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? 'auto' : 'none'}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        pointerEvents="box-none"
      >
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>🐾 What would you like to do?</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Action rows */}
        <View style={styles.actionsContainer}>
          {ACTIONS.map((action) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                activeOpacity={0.8}
                onPress={() => handleAction(action.id)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.iconColor + '18' }]}>
                  <IconComponent size={24} color={action.iconColor} strokeWidth={2.2} />
                </View>
                <View style={styles.actionText}>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cancel */}
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: spacing.xl,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

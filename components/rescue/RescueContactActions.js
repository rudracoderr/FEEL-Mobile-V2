import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MessageCircle, Phone } from 'lucide-react-native';
import { handleCall, handleWhatsApp } from '../../utils/contactHelpers';
import { colors, radius, spacing } from '../../theme';

/**
 * Reusable "Call" and "WhatsApp" button pair.
 * Used by both ReporterSection and VolunteerSection.
 *
 * @param {string} phone      - The E.164-compatible phone string.
 * @param {string} callLabel  - Label for the call button (e.g. "Call Reporter").
 */
export default function RescueContactActions({ phone, callLabel }) {
  return (
    <View style={styles.contactActions}>
      <TouchableOpacity
        style={[styles.contactButton, styles.callButton]}
        onPress={() => handleCall(phone)}
        activeOpacity={0.85}
      >
        <Phone size={16} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.contactButtonText}>{callLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.contactButton, styles.whatsappButton]}
        onPress={() => handleWhatsApp(phone)}
        activeOpacity={0.85}
      >
        <MessageCircle size={16} color="#FFFFFF" strokeWidth={2.4} />
        <Text style={styles.contactButtonText}>WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  contactActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: 11,
  },
  callButton: {
    backgroundColor: '#2563EB',
  },
  whatsappButton: {
    backgroundColor: colors.success,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});

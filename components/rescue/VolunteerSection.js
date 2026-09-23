import { StyleSheet, Text, View } from 'react-native';
import { Phone, UserRound } from 'lucide-react-native';
import RescueContactActions from './RescueContactActions';
import { colors, spacing, typography } from '../../theme';

/**
 * Reporter's view of the assigned volunteer.
 * Shows volunteer name, phone, and Call/WhatsApp buttons.
 * Purely presentational — no state.
 *
 * @param {string} fullName       - Volunteer's full name.
 * @param {string} phone          - Volunteer's phone number.
 */
export default function VolunteerSection({ fullName, phone }) {
  return (
    <>
      <View style={styles.metaRow}>
        <Phone size={15} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.metaText}>Phone: {phone || 'Not available'}</Text>
      </View>
      <View style={styles.metaRow}>
        <UserRound size={15} color={colors.textSecondary} strokeWidth={2.2} />
        <Text style={styles.metaText}>
          Name: {fullName || 'Unknown volunteer'}
        </Text>
      </View>
      <RescueContactActions phone={phone} callLabel="Call Volunteer" />
    </>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  metaText: {
    ...typography.meta,
    fontWeight: '700',
    flex: 1,
  },
});

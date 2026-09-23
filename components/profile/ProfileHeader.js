import { StyleSheet, Text, View } from 'react-native';
import { MapPin, ShieldCheck } from 'lucide-react-native';
import Card from '../ui/Card';
import { colors, radius, spacing, typography } from '../../theme';

export default function ProfileHeader({ initial, displayName, email, volunteerStatus, city }) {
  return (
    <Card style={styles.profileCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{email}</Text>
      <View style={styles.profileMeta}>
        <View style={styles.metaPill}>
          <ShieldCheck size={14} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.metaPillText}>{volunteerStatus}</Text>
        </View>
        <View style={styles.metaPill}>
          <MapPin size={14} color={colors.primary} strokeWidth={2.4} />
          <Text style={styles.metaPillText}>{city}</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
  },
  name: {
    ...typography.heading,
    textAlign: 'center',
  },
  email: {
    ...typography.meta,
    marginTop: 4,
    textAlign: 'center',
  },
  profileMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});

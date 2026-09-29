import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bell, ChevronRight, HeartHandshake, HelpCircle, Info, Lock, UserRound, ListChecks, Heart } from 'lucide-react-native';
import Button from '../ui/Button';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import { colors, radius, spacing } from '../../theme';

function SettingsRow({ icon: Icon, label, onPress, iconColor }) {
  const tint = iconColor || colors.primary;
  return (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress} activeOpacity={onPress ? 0.8 : 1}>
      <View style={[styles.settingsIcon, { backgroundColor: tint === colors.primary ? colors.primarySoft : `${tint}18` }]}>
        <Icon size={18} color={tint} strokeWidth={2.3} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      {onPress ? <ChevronRight size={18} color={colors.textSecondary} /> : null}
    </TouchableOpacity>
  );
}

/**
 * @param {object} backendUser - Used to determine whether to show the volunteer CTA.
 * @param {object} navigation  - React Navigation object for internal screen transitions.
 * @param {function} onLogout  - Callback invoked when the user confirms logout.
 */
export default function ProfileSettings({ backendUser, navigation, onLogout }) {
  const showVolunteerCTA =
    backendUser?.volunteerStatus === 'none' ||
    backendUser?.volunteerStatus === 'rejected' ||
    !backendUser?.volunteerStatus;

  const isVolunteer = Boolean(backendUser?.isVolunteer);

  return (
    <>
      <SectionHeader title="Settings" />
      <Card style={styles.settingsCard}>
        {/* Volunteer entry point — shown when user hasn't applied or was rejected */}
        {showVolunteerCTA ? (
          <SettingsRow
            icon={HeartHandshake}
            label="Become a Volunteer"
            iconColor={colors.primary}
            onPress={() => navigation.navigate('VolunteerApplication')}
          />
        ) : null}
        
        {isVolunteer ? (
          <SettingsRow 
            icon={ListChecks} 
            label="My Rescue Cases" 
            onPress={() => navigation.navigate('ClaimedRescues')} 
          />
        ) : null}

        <SettingsRow icon={UserRound} label="My Reports" onPress={() => navigation.navigate('MyReports')} />
        <SettingsRow icon={Heart} label="Your Adoptions" onPress={() => navigation.navigate('YourAdoptions')} />
        <SettingsRow icon={Bell} label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        <SettingsRow icon={Lock} label="Privacy" />
        <SettingsRow icon={HelpCircle} label="Help" />
        <SettingsRow icon={Info} label="About FEEL" />
      </Card>

      <View style={styles.logoutSection}>
        <Button label="Logout" variant="danger" onPress={onLogout} />
        <Text style={styles.footerText}>You will be returned to the home screen.</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  logoutSection: {
    marginTop: spacing.xxl,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

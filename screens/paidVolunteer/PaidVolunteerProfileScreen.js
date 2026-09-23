import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import * as Location from 'expo-location';
import ProfileHeader from '../../components/profile/ProfileHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import SectionHeader from '../../components/ui/SectionHeader';
import LoadingOverlay from '../../components/ui/LoadingOverlay';
import { updateAvailability } from '../../api/user';
import { colors, spacing, typography } from '../../theme';

export default function PaidVolunteerProfileScreen({ onLogout, currentUserProfile }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUserProfile) {
      setIsAvailable(Boolean(currentUserProfile.isAvailable));
    }
  }, [currentUserProfile]);

  const handleToggleAvailability = async (newValue) => {
    setIsAvailable(newValue); // Optimistic update
    setLoading(true);

    try {
      let locationPayload = null;

      if (newValue === true) {
        // Request location when turning ON availability
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Location permission is required to become available.');
        }

        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = currentLocation.coords;
        locationPayload = {
          type: 'Point',
          coordinates: [longitude, latitude],
        };
      }

      await updateAvailability(currentUserProfile.uid, newValue, locationPayload);

      // If needed, we could notify parent or refresh currentUserProfile here.
      // But typically, the next re-fetch of user data will reflect this.
    } catch (error) {
      console.error('Failed to update availability:', error);
      Alert.alert('Update Failed', error.message || 'Could not update your availability.');
      setIsAvailable(!newValue); // Revert on failure
    } finally {
      setLoading(false);
    }
  };

  if (!currentUserProfile) {
    return <View style={styles.container} />;
  }

  // Reuse existing ProfileHeader. 
  // We substitute email with phone number for Paid Volunteers per requirements.
  const initial = currentUserProfile?.fullName ? currentUserProfile.fullName.charAt(0).toUpperCase() : 'V';

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} title="Updating" message="Please wait..." />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <ProfileHeader
          initial={initial}
          displayName={currentUserProfile.fullName || 'Volunteer'}
          email={currentUserProfile.phone || 'No phone number'}
          volunteerStatus="Paid Volunteer"
          city={currentUserProfile.city || 'Unknown City'}
        />

        <SectionHeader title="Availability" />
        <Card style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsText}>
              <Text style={styles.settingsLabel}>Active on Duty</Text>
              <Text style={styles.settingsSub}>
                {isAvailable
                  ? 'You are available to receive nearby assistance requests.'
                  : 'You are currently offline. Turn on to receive requests.'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Card>

        <View style={styles.logoutSection}>
          <Button label="Logout" variant="danger" onPress={onLogout} />
          <Text style={styles.footerText}>You will be returned to the home screen.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 108,
  },
  title: {
    ...typography.title,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  settingsText: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingsLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  settingsSub: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
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

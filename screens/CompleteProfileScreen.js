import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useForm, Controller } from 'react-hook-form';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';
import { colors, radius, spacing } from '../theme';

const MIN_AGE = 1;
const MAX_AGE = 120;

async function postUserToBackend(payload) {
  const url = `${BACKEND_BASE_URL}/api/users`;
  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Backend request failed with status ${response.status}`);
  }

  return responseText ? JSON.parse(responseText) : null;
}

async function getCurrentGeoJsonLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Location permission denied. Please allow location access to continue.');
  }

  const currentLocation = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const { latitude, longitude } = currentLocation.coords;

  return {
    type: 'Point',
    coordinates: [longitude, latitude],
  };
}

export default function CompleteProfileScreen({ route, profile, onComplete }) {
  const signupProfile = profile || route?.params || null;
  // When the user arrived via the "Become a Volunteer" path, submit their
  // application at the same time as profile creation. The backend converts
  // isVolunteer:true → volunteerStatus:"pending" automatically.
  const volunteerIntent = Boolean(route?.params?.volunteerIntent || profile?.volunteerIntent);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      fullName: '',
      age: '',
      phone: '',
      city: ''
    }
  });

  const [loading, setLoading] = useState(false);

  const handleSaveProfile = async (formData) => {
    if (!signupProfile?.uid || !signupProfile?.email) {
      Alert.alert('Missing signup data', 'Please restart signup so we can continue with your profile.');
      return;
    }

    const { fullName, age, phone, city } = formData;
    const parsedAge = Number(age);

    setLoading(true);
    try {
      const location = await getCurrentGeoJsonLocation();

      const payload = {
        uid: signupProfile.uid,
        email: signupProfile.email,
        fullName: fullName.trim(),
        age: parsedAge,
        phone: phone.trim(),
        city: city.trim(),
        location,
        // Sending isVolunteer:true signals to the backend that this user wants
        // to apply. The backend sets volunteerStatus:"pending" and keeps
        // isVolunteer:false until an admin approves.
        ...(volunteerIntent ? { isVolunteer: true } : {}),
      };

      const data = await postUserToBackend(payload);

      Alert.alert('Success', 'Profile completed successfully.', [
        {
          text: 'Go to Home',
          onPress: () => onComplete?.(data),
        },
      ]);
    } catch (error) {
      console.error('Complete profile save failed:', error);
      Alert.alert('Save failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!signupProfile) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>Complete Profile</Text>
        <Text style={styles.fallbackText}>Missing signup details. Please sign up again.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerCard}>
        <Text style={styles.headerLabel}>One more step</Text>
        <Text style={styles.headerTitle}>Complete your profile</Text>
        <Text style={styles.headerText}>We will save your extra details and current location automatically.</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionLabel}>Account</Text>
        <Text style={styles.accountText}>Email: {signupProfile.email}</Text>

        <Text style={styles.fieldLabel}>Full Name</Text>
        <Controller
          control={control}
          rules={{
            required: 'Full name is required',
            pattern: {
              value: /^[a-zA-Z\s'-]{2,50}$/,
              message: 'Name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Enter full name"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="fullName"
        />
        {errors.fullName && <Text style={styles.errorText}>{errors.fullName.message}</Text>}

        <Text style={styles.fieldLabel}>Age</Text>
        <Controller
          control={control}
          rules={{
            required: 'Age is required',
            pattern: {
              value: /^[1-9]\d*$/,
              message: 'Age must be a positive number'
            },
            validate: value => {
              const parsedAge = Number(value);
              if (!Number.isFinite(parsedAge) || parsedAge < MIN_AGE || parsedAge > MAX_AGE) {
                return `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
              }
              return true;
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="Enter age"
              keyboardType="numeric"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="age"
        />
        {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}

        <Text style={styles.fieldLabel}>Phone Number</Text>
        <Controller
          control={control}
          rules={{
            required: 'Phone number is required',
            pattern: {
              value: /^[0-9]{10}$/,
              message: 'Phone number must be exactly 10 digits'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="phone"
        />
        {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

        <Text style={styles.fieldLabel}>City</Text>
        <Controller
          control={control}
          rules={{ 
            required: 'City is required',
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: 'City must contain only letters and spaces'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.city && styles.inputError]}
              placeholder="Enter city"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
          )}
          name="city"
        />
        {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit(handleSaveProfile)}
          disabled={loading}
        >
          {loading && <ActivityIndicator color={colors.textSecondary} />}
          <Text style={[styles.buttonText, loading && styles.buttonTextDisabled]}>
            {loading ? 'Saving Profile...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  headerCard: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  headerLabel: {
    color: colors.primarySoft,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  headerTitle: {
    color: colors.card,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
  },
  headerText: {
    color: colors.primarySoft,
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  accountText: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.text,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
  },
  inputError: {
    borderColor: colors.critical,
  },
  errorText: {
    color: colors.critical,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchHint: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12,
  },
  button: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xxl,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.card,
    fontWeight: '700',
    fontSize: 16,
  },
  buttonTextDisabled: {
    color: colors.textSecondary,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  fallbackTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 10,
  },
  fallbackText: {
    textAlign: 'center',
    color: colors.textSecondary,
  },
});
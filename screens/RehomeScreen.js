import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import Button from '../components/ui/Button';
import ImageSelectionArea from '../components/ui/ImageSelectionArea';
import { colors, radius, spacing, typography } from '../theme';
import { BACKEND_BASE_URL, fetchWithTimeout } from '../apiClient';
import { uploadImageToCloudinary } from '../utils/cloudinaryHelper';

export default function RehomeScreen() {
  const navigation = useNavigation();

  const { control, handleSubmit: hookFormSubmit, formState: { errors } } = useForm({
    defaultValues: {
      animalName: '',
      species: '',
      breed: '',
      age: '',
      gender: '',
      description: '',
      stateName: '',
      city: '',
      area: ''
    }
  });

  const [vaccinated, setVaccinated] = useState(false);
  const [sterilized, setSterilized] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const onSubmitForm = async (formData) => {
    setSubmitting(true);
    try {
      let imageUrls = [];
      if (selectedImages.length > 0) {
        imageUrls = await Promise.all(
          selectedImages.map((asset, index) => uploadImageToCloudinary(asset, index))
        );
      }

      const payload = {
        animalName: formData.animalName.trim(),
        species: formData.species.trim(),
        breed: formData.breed.trim(),
        age: formData.age.trim(),
        gender: formData.gender.trim(),
        description: formData.description.trim(),
        location: {
          state: formData.stateName.trim(),
          city: formData.city.trim(),
          area: formData.area.trim()
        },
        health: {
          vaccinated,
          sterilized
        },
        photos: imageUrls
      };

      const response = await fetchWithTimeout(`${BACKEND_BASE_URL}/api/adoptions`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || `Failed to submit adoption listing (${response.status})`);
      }

      Alert.alert('Success', 'Your adoption listing has been submitted and is awaiting review.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Submission failed:', error);
      Alert.alert('Submission failed', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Button variant="outline" onPress={() => navigation.goBack()} style={styles.backButton} disabled={submitting}>
          <ChevronLeft size={24} color={colors.text} />
        </Button>
        <Text style={styles.headerTitle}>Rehome an Animal</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Basic Info</Text>

        <Controller
          control={control}
          rules={{
            required: 'Animal Name is required',
            pattern: {
              value: /^[a-zA-Z\s'-]{2,50}$/,
              message: 'Name must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.animalName && styles.inputError]}
              placeholder="Animal Name *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="animalName"
        />
        {errors.animalName && <Text style={styles.errorText}>{errors.animalName.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Species is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.species && styles.inputError]}
              placeholder="Species (e.g. Dog, Cat) *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="species"
        />
        {errors.species && <Text style={styles.errorText}>{errors.species.message}</Text>}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Breed (Optional)"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="breed"
        />

        <Controller
          control={control}
          rules={{ required: 'Age is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.age && styles.inputError]}
              placeholder="Age (e.g. 2 months, 3 years) *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="age"
        />
        {errors.age && <Text style={styles.errorText}>{errors.age.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Gender is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.gender && styles.inputError]}
              placeholder="Gender (e.g. Male, Female) *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="gender"
        />
        {errors.gender && <Text style={styles.errorText}>{errors.gender.message}</Text>}

        <Controller
          control={control}
          rules={{ required: 'Description is required' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              placeholder="Describe the animal, behavior, reason for rehoming... *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
          )}
          name="description"
        />
        {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

        <Text style={styles.sectionTitle}>Health &amp; Medical</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Vaccinated</Text>
          <View style={styles.switchOptions}>
            <TouchableOpacity
              style={[styles.chip, vaccinated && styles.chipActive]}
              onPress={() => setVaccinated(true)}
              disabled={submitting}
            >
              <Text style={[styles.chipText, vaccinated && styles.chipTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !vaccinated && styles.chipActive]}
              onPress={() => setVaccinated(false)}
              disabled={submitting}
            >
              <Text style={[styles.chipText, !vaccinated && styles.chipTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Sterilized / Neutered</Text>
          <View style={styles.switchOptions}>
            <TouchableOpacity
              style={[styles.chip, sterilized && styles.chipActive]}
              onPress={() => setSterilized(true)}
              disabled={submitting}
            >
              <Text style={[styles.chipText, sterilized && styles.chipTextActive]}>Yes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, !sterilized && styles.chipActive]}
              onPress={() => setSterilized(false)}
              disabled={submitting}
            >
              <Text style={[styles.chipText, !sterilized && styles.chipTextActive]}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Location</Text>
        <Controller
          control={control}
          rules={{
            required: 'State is required',
            pattern: {
              value: /^[a-zA-Z\s]+$/,
              message: 'State must contain only letters and spaces'
            }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[styles.input, errors.stateName && styles.inputError]}
              placeholder="State *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="stateName"
        />
        {errors.stateName && <Text style={styles.errorText}>{errors.stateName.message}</Text>}

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
              placeholder="City *"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="city"
        />
        {errors.city && <Text style={styles.errorText}>{errors.city.message}</Text>}

        <Controller
          control={control}
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Area / Neighborhood (Optional)"
              placeholderTextColor={colors.textMuted}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              editable={!submitting}
            />
          )}
          name="area"
        />

        <Text style={styles.sectionTitle}>Photos</Text>
        <ImageSelectionArea
          images={selectedImages}
          onImagesChange={setSelectedImages}
          disabled={submitting}
        />

        <View style={styles.footerSpacing} />

        <Button
          label={submitting ? 'Submitting...' : 'Submit Adoption Listing'}
          loading={submitting}
          disabled={submitting}
          onPress={() => hookFormSubmit(onSubmitForm)()}
        />
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    paddingHorizontal: 0,
    borderColor: colors.border,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 18,
  },
  headerPlaceholder: {
    width: 44,
  },
  container: {
    padding: spacing.xl,
  },
  sectionTitle: {
    ...typography.heading,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
  },
  textArea: {
    height: 120,
    paddingTop: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: 4,
  },
  switchLabel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text,
  },
  switchOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary,
  },
  footerSpacing: {
    height: spacing.xl,
  },
  bottomSpacing: {
    height: spacing.xxl * 2,
  },
});

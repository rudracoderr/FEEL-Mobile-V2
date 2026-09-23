import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { Camera, MapPin, RefreshCw } from 'lucide-react-native';
import Button from '../ui/Button';
import ReportImageSection from './ReportImageSection';
import { colors, radius, spacing, typography } from '../../theme';

const SEVERITY_OPTIONS = ['low', 'medium', 'high', 'critical'];

/**
 * Full-screen "Report a Rescue" form modal.
 * Purely presentational — all state, API calls, and handlers are
 * owned by HomeScreen and passed as props.
 *
 * Props:
 * @param {boolean}  visible             Whether the modal is open.
 * @param {Function} onClose             Closes and resets the form (resetReportForm).
 * @param {object}   control             react-hook-form control instance.
 * @param {object}   errors              react-hook-form errors object.
 * @param {string}   severity            Currently selected severity value.
 * @param {Function} onSeverityChange    Called with a new severity string.
 * @param {Array}    selectedImages      Array of picked ImagePicker assets.
 * @param {Function} onAddPhotoPress     Opens the image action sheet.
 * @param {Function} onRemoveImage       Called with asset URI to remove.
 * @param {Function} onRetakePhoto       Launches camera retake flow.
 * @param {boolean}  locationLoading     Location is being fetched.
 * @param {string}   locationError       Location error message (empty if OK).
 * @param {string}   reportAddress       Reverse-geocoded address string.
 * @param {object|null} reportLocation   GeoJSON point object or null.
 * @param {Function} onRefreshLocation   Triggers re-fetch of location.
 * @param {Function} onSubmit            Triggers form submission.
 * @param {boolean}  submitting          Upload + API call is in flight.
 */
export default function ReportRescueModal({
  visible,
  onClose,
  control,
  errors,
  severity,
  onSeverityChange,
  selectedImages,
  onAddPhotoPress,
  onRemoveImage,
  onRetakePhoto,
  locationLoading,
  locationError,
  reportAddress,
  reportLocation,
  onRefreshLocation,
  onSubmit,
  submitting,
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalScreen}>
        <ScrollView contentContainerStyle={styles.modalContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.reportHeader}>
            <Text style={styles.reportTitle}>Report a Rescue</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Controller
            control={control}
            rules={{ required: 'Title is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                placeholder="Rescue title"
                placeholderTextColor={colors.textMuted}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
            name="title"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

          {/* Description */}
          <Controller
            control={control}
            rules={{ required: 'Description is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea, errors.description && styles.inputError]}
                placeholder="Describe the situation..."
                placeholderTextColor={colors.textMuted}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                textAlignVertical="top"
              />
            )}
            name="description"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

          {/* Location row */}
          <View style={styles.locationHeaderRow}>
            <Text style={styles.fieldLabel}>Location</Text>
            <TouchableOpacity
              style={[styles.refreshButton, locationLoading && styles.disabled]}
              onPress={onRefreshLocation}
              disabled={locationLoading}
              activeOpacity={0.85}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <RefreshCw size={14} color={colors.primary} strokeWidth={2.4} />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.locationCard}>
            <MapPin size={17} color={colors.primary} strokeWidth={2.3} />
            <Text style={[styles.locationValue, locationError && styles.locationError]}>
              {locationLoading
                ? 'Fetching current GPS location...'
                : locationError || reportAddress || 'Location will appear here after refresh.'}
            </Text>
          </View>

          {/* Landmark */}
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Nearby landmark (optional)"
                placeholderTextColor={colors.textMuted}
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
              />
            )}
            name="reportLandmark"
          />

          {/* Severity */}
          <Text style={styles.fieldLabel}>Severity</Text>
          <View style={styles.severityRow}>
            {SEVERITY_OPTIONS.map((option) => {
              const isActive = severity === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.severityChip, isActive && styles.severityChipActive]}
                  onPress={() => onSeverityChange(option)}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.severityChipText, isActive && styles.severityChipTextActive]}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Photo trigger */}
          <TouchableOpacity
            style={[styles.imageButton, submitting && styles.disabled]}
            onPress={onAddPhotoPress}
            disabled={submitting}
          >
            <Camera size={18} color={colors.primary} strokeWidth={2.4} />
            <Text style={styles.imageButtonText}>
              {selectedImages.length ? `${selectedImages.length} photo(s) added — Add More` : 'Add Photo'}
            </Text>
          </TouchableOpacity>

          {/* Image preview strip */}
          <ReportImageSection
            images={selectedImages}
            onRemove={onRemoveImage}
            onRetake={onRetakePhoto}
            disabled={submitting}
          />

          {/* Submit */}
          <Button
            label="Submit Report"
            onPress={onSubmit}
            disabled={submitting || locationLoading || !reportLocation}
            style={styles.submitButton}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  reportTitle: {
    ...typography.heading,
  },
  closeButton: {
    color: colors.textSecondary,
    fontWeight: '900',
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
    height: 118,
    paddingVertical: spacing.md,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FFD6C3',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  locationError: {
    color: colors.critical,
  },
  severityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  severityChip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  severityChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  severityChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
  },
  severityChipTextActive: {
    color: '#FFFFFF',
  },
  imageButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  imageButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.55,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
});

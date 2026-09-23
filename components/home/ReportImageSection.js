import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

/**
 * Horizontal image preview strip inside the Report Rescue form.
 * Purely presentational — camera and removal callbacks come from HomeScreen.
 *
 * @param {Array}    images      Array of ImagePicker asset objects.
 * @param {Function} onRemove    Called with the asset URI to remove.
 * @param {Function} onRetake    Called when user taps "Retake" on the camera image.
 * @param {boolean}  disabled    Locks all interactive controls when true.
 */
export default function ReportImageSection({ images, onRemove, onRetake, disabled }) {
  if (!images.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewSection}>
      {images.map((asset) => (
        <View key={asset.uri} style={styles.imagePreview}>
          <Image source={{ uri: asset.uri }} style={styles.preview} />
          {asset._fromCamera && (
            <TouchableOpacity style={styles.retakeButton} onPress={onRetake} disabled={disabled}>
              <Camera size={12} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => onRemove(asset.uri)}
            disabled={disabled}
          >
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  imagePreviewSection: {
    marginBottom: spacing.md,
  },
  imagePreview: {
    marginRight: spacing.md,
  },
  preview: {
    width: 106,
    height: 106,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.critical,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.58)',
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 7,
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});

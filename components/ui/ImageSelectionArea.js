import { useRef, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { colors, radius, spacing } from '../../theme';

/**
 * Fully self-contained image selection area.
 * Manages camera/gallery permissions, the action-sheet modal, the
 * horizontal preview strip, and the Retake / Remove controls.
 *
 * @param {Array}    images          Controlled image asset array.
 * @param {Function} onImagesChange  Called with the full updated array on every change.
 * @param {boolean}  disabled        Locks all interactive controls when true.
 */
export default function ImageSelectionArea({ images, onImagesChange, disabled }) {
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const lastCameraUri = useRef(null);

  // ── Camera ─────────────────────────────────────────────────────────────
  const takePhoto = async () => {
    setActionSheetVisible(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow camera access to take a photo.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
        allowsEditing: false,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      lastCameraUri.current = asset.uri;

      const withoutOldCamera = images.filter((img) => !img._fromCamera);
      onImagesChange([...withoutOldCamera, { ...asset, _fromCamera: true }]);
    } catch (error) {
      console.error('Camera failed:', error);
      Alert.alert('Camera error', error.message);
    }
  };

  // ── Gallery ────────────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    setActionSheetVisible(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow photo access to select images.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      const nextImages = [...images];
      result.assets.forEach((asset) => {
        if (!nextImages.some((existing) => existing.uri === asset.uri)) {
          nextImages.push(asset);
        }
      });
      onImagesChange(nextImages);
    } catch (error) {
      console.error('Image picking failed:', error);
      Alert.alert('Selection failed', error.message);
    }
  };

  // ── Remove ─────────────────────────────────────────────────────────────
  const removeImage = (uriToRemove) => {
    if (lastCameraUri.current === uriToRemove) lastCameraUri.current = null;
    onImagesChange(images.filter((asset) => asset.uri !== uriToRemove));
  };

  return (
    <>
      {/* Add Photo trigger */}
      <TouchableOpacity
        style={[styles.imageButton, disabled && styles.disabled]}
        onPress={() => setActionSheetVisible(true)}
        disabled={disabled}
      >
        <Camera size={18} color={colors.primary} strokeWidth={2.4} />
        <Text style={styles.imageButtonText}>
          {images.length ? `${images.length} photo(s) added — Add More` : 'Add Photo'}
        </Text>
      </TouchableOpacity>

      {/* Horizontal preview strip */}
      {images.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewSection}>
          {images.map((asset) => (
            <View key={asset.uri} style={styles.imagePreview}>
              <Image source={{ uri: asset.uri }} style={styles.preview} />
              {asset._fromCamera && (
                <TouchableOpacity style={styles.retakeButton} onPress={takePhoto}>
                  <Camera size={12} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(asset.uri)}>
                <Text style={styles.removeText}>X</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {/* Photo action sheet */}
      <Modal
        visible={actionSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setActionSheetVisible(false)}
        >
          <View style={styles.sheetContent}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add a Photo</Text>

            <TouchableOpacity style={styles.sheetButton} onPress={takePhoto} activeOpacity={0.8}>
              <Camera size={22} color={colors.text} strokeWidth={2} />
              <Text style={styles.sheetButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetButton} onPress={pickFromGallery} activeOpacity={0.8}>
              <Image
                source={{ uri: 'https://img.icons8.com/ios/50/000000/image-gallery.png' }}
                style={{ width: 22, height: 22, tintColor: colors.text }}
              />
              <Text style={styles.sheetButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sheetButton, styles.sheetCancelButton]}
              onPress={() => setActionSheetVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  imageButtonText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  disabled: {
    opacity: 0.6,
  },
  imagePreviewSection: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  imagePreview: {
    position: 'relative',
    marginRight: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  preview: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  retakeButton: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retakeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  removeImageButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: radius.round,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.text,
  },
  sheetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  sheetButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: spacing.md,
    color: colors.text,
  },
  sheetCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 0,
  },
});

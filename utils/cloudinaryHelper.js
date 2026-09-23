const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
const CLOUDINARY_FOLDER = process.env.EXPO_PUBLIC_CLOUDINARY_FOLDER || 'feel-adoptions';

/**
 * Resolves a stable filename for a Cloudinary upload asset.
 * Falls back to a timestamped name and infers the extension from mimeType.
 */
export function buildCloudinaryFileName(asset, index) {
  const fileName = asset.fileName || `adoption-image-${Date.now()}-${index + 1}`;
  if (fileName.includes('.')) {
    return fileName;
  }
  const mimeType = asset.mimeType || '';
  const extension = mimeType.split('/')[1] || 'jpg';
  return `${fileName}.${extension}`;
}

/**
 * Uploads a single image asset to Cloudinary.
 * Throws on missing credentials, non-OK response, or missing URL in response.
 */
export async function uploadImageToCloudinary(asset, index) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload settings are missing.');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: buildCloudinaryFileName(asset, index),
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (CLOUDINARY_FOLDER) {
    formData.append('folder', CLOUDINARY_FOLDER);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(responseData?.error?.message || 'Failed to upload image to Cloudinary');
  }
  if (!responseData.secure_url) {
    throw new Error('Cloudinary upload did not return an image URL.');
  }
  return responseData.secure_url;
}

/**
 * Uploads a single resolution photo to Cloudinary.
 * Used by the "Mark as Resolved" flow in RescueDetailsModal.
 * Throws on missing credentials, non-OK response, or missing URL in response.
 */
export async function uploadResolutionImage(asset) {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary upload settings are missing.');
  }

  const formData = new FormData();
  const fileName = asset.fileName || `resolution-${Date.now()}.jpg`;
  const finalName = fileName.includes('.') ? fileName : `${fileName}.jpg`;

  formData.append('file', {
    uri: asset.uri,
    type: asset.mimeType || 'image/jpeg',
    name: finalName,
  });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (CLOUDINARY_FOLDER) {
    formData.append('folder', CLOUDINARY_FOLDER);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const responseText = await response.text();
  const responseData = responseText ? JSON.parse(responseText) : {};

  if (!response.ok) {
    throw new Error(responseData?.error?.message || 'Failed to upload resolution image');
  }
  if (!responseData.secure_url) {
    throw new Error('Cloudinary upload did not return an image URL.');
  }
  return responseData.secure_url;
}

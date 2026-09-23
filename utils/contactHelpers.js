import { Alert, Linking } from 'react-native';

export function sanitizePhoneNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

export function isValidPhoneNumber(value) {
  const digitsOnly = sanitizePhoneNumber(value).replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

export function buildDialPhone(value) {
  return sanitizePhoneNumber(value).replace(/(?!^)\+/g, '');
}

export function buildWhatsAppPhone(value) {
  const digitsOnly = sanitizePhoneNumber(value).replace(/\D/g, '');
  if (digitsOnly.length === 10) return `91${digitsOnly}`;
  return digitsOnly;
}

export function getPhoneFromContact(value) {
  if (!value) return '';
  const normalized = String(value).trim();
  return isValidPhoneNumber(normalized) ? normalized : '';
}

export async function handleCall(phone) {
  if (!phone) {
    Alert.alert('Phone unavailable', 'Phone number is not available yet.');
    return;
  }
  if (!isValidPhoneNumber(phone)) {
    Alert.alert('Invalid phone number', 'The phone number looks invalid.');
    return;
  }
  try {
    await Linking.openURL(`tel:${buildDialPhone(phone)}`);
  } catch (_error) {
    Alert.alert('Unable to open dialer', 'Please try calling manually.');
  }
}

export async function handleWhatsApp(phone) {
  const whatsappPhone = buildWhatsAppPhone(phone);
  const webLink = `https://wa.me/${whatsappPhone}`;
  await Linking.openURL(webLink);
}

import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';
import { normalizeForgotPasswordError } from '../utils/authErrorHandler';
import authStyles from '../styles/authStyles';

// Generic message shown for BOTH existing and non-existing accounts.
// This prevents account-enumeration — callers cannot tell whether the email
// is registered with Firebase just by looking at the response.
const GENERIC_SUCCESS_MESSAGE =
  'If an account exists for this email, a password reset link has been sent. ' +
  'Please check your inbox and spam folder.';

export default function ForgotPasswordScreen({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedback, setFeedback] = useState({
    type: 'info',
    title: '',
    message: '',
  });

  const openFeedback = (nextFeedback) => {
    setFeedback(nextFeedback);
    setFeedbackVisible(true);
  };

  const closeFeedback = () => {
    setFeedbackVisible(false);
  };

  const handleSendResetLink = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      openFeedback({
        type: 'warning',
        title: 'Email Required',
        message: 'Please enter your email address.',
      });
      return;
    }

    // Basic format guard before hitting Firebase (avoids unnecessary network
    // round-trip for obviously invalid addresses).
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      openFeedback({
        type: 'warning',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);

      // Show the generic success message regardless of whether the account
      // exists — Firebase silently succeeds for non-existent addresses too,
      // which is what we want. We mirror that behaviour here.
      openFeedback({
        type: 'success',
        title: 'Check Your Email',
        message: GENERIC_SUCCESS_MESSAGE,
      });
    } catch (error) {
      // Extra guard: if somehow user-not-found slips through, treat it as
      // success to avoid leaking account existence.
      if (String(error?.code || '').toLowerCase() === 'auth/user-not-found') {
        openFeedback({
          type: 'success',
          title: 'Check Your Email',
          message: GENERIC_SUCCESS_MESSAGE,
        });
      } else {
        openFeedback(normalizeForgotPasswordError(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={loading}
        title="Sending Reset Link"
        message="Please wait a moment."
      />

      <StatusModal
        visible={feedbackVisible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        primaryButton={{
          label: feedback.type === 'success' ? 'Back to Login' : 'OK',
          onPress: () => {
            closeFeedback();
            if (feedback.type === 'success') {
              onBackToLogin?.();
            }
          },
          variant: 'primary',
        }}
        onRequestClose={closeFeedback}
      />

      <View style={styles.hero}>
        <Text style={styles.kicker}>FEEL Rescue</Text>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Enter the email address you signed up with and we'll send you a reset link.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6b7280"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSendResetLink}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Send Reset Link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onBackToLogin} disabled={loading}>
        <Text style={styles.switchText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = authStyles;

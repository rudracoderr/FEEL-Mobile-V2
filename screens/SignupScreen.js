import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';
import { normalizeSignupError } from '../utils/authErrorHandler';
import authStyles from '../styles/authStyles';


export default function SignupScreen({ onSwitchToLogin, onSignupStart, onSignupSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSignup = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      openFeedback({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please enter your email and password.',
      });
      return;
    }

    // Basic email format check — Firebase validates definitively on the server.
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!emailOk) {
      openFeedback({
        type: 'warning',
        title: 'Invalid Email',
        message: 'Please enter a valid email address.',
      });
      return;
    }

    // Firebase requires at least 6 characters.
    if (password.length < 6) {
      openFeedback({
        type: 'warning',
        title: 'Password Too Short',
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    if (password.length > 128) {
      openFeedback({
        type: 'warning',
        title: 'Password Too Long',
        message: 'Password must be at most 128 characters.',
      });
      return;
    }

    setLoading(true);
    try {
      onSignupStart?.();

      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const user = userCredential.user;

      onSignupSuccess?.({
        uid: user.uid,
        email: user.email,
      });

      openFeedback({
        type: 'success',
        title: 'Success',
        message: 'Account created successfully.',
      });
    } catch (error) {
      openFeedback(normalizeSignupError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={loading}
        title="Creating Account"
        message="Please wait while we set up your account."
      />
      <StatusModal
        visible={feedbackVisible}
        type={feedback.type}
        title={feedback.title}
        message={feedback.message}
        primaryButton={{
          label: 'OK',
          onPress: closeFeedback,
          variant: 'primary',
        }}
        onRequestClose={closeFeedback}
      />
      <View style={styles.hero}>
        <Text style={styles.kicker}>FEEL Rescue</Text>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the rescue network and help respond faster.
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
        maxLength={254}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6b7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        maxLength={128}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwitchToLogin} disabled={loading}>
        <Text style={styles.switchText}>Already have an account? Log In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = authStyles;

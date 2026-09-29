import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import StatusModal from '../components/ui/StatusModal';
import { normalizeLoginError } from '../utils/authErrorHandler';
import authStyles from '../styles/authStyles';


export default function LoginScreen({ onSwitchToSignup, onLoginSuccess, onSwitchToForgotPassword }) {
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

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      openFeedback({
        type: 'warning',
        title: 'Missing Fields',
        message: 'Please enter email and password.',
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      onLoginSuccess?.();
    } catch (error) {
      openFeedback(normalizeLoginError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={loading}
        title="Signing In"
        message="Please wait while we verify your account."
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
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to coordinate rescue alerts and volunteer action.</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6b7280"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#6b7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSwitchToForgotPassword}
        disabled={loading}
        style={styles.forgotPasswordLink}
      >
        <Text style={styles.switchText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onSwitchToSignup} disabled={loading}>
        <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  ...authStyles,
  forgotPasswordLink: {
    marginBottom: 10,
  },
};

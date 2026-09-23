import { StyleSheet } from 'react-native';

/**
 * Shared styles for authentication screens (LoginScreen, SignupScreen).
 * Both screens use an identical layout — any visual change here applies to both.
 */
const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#050505',
  },
  hero: {
    marginBottom: 28,
  },
  kicker: {
    color: '#ff6b2c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#a1a1aa',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: '#232323',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#121212',
    color: '#ffffff',
  },
  button: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ff6b2c',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  switchText: {
    textAlign: 'center',
    color: '#a1a1aa',
    fontWeight: '600',
  },
});

export default authStyles;

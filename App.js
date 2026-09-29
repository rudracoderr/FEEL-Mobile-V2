import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { HeartHandshake, Home, ListChecks, UserRound, WalletCards } from 'lucide-react-native';
import CameraFAB from './components/navigation/CameraFAB';
import FABActionSheet from './components/navigation/FABActionSheet';

import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import RescueFeedScreen from './screens/RescueFeedScreen';
import ReportsHubScreen from './screens/ReportsHubScreen';
import ClaimedRescuesScreen from './screens/ClaimedRescuesScreen';
import ProfileScreen from './screens/ProfileScreen';
import DonationsScreen from './screens/DonationsScreen';
import CompleteProfileScreen from './screens/CompleteProfileScreen';
import MyReportsScreen from './screens/MyReportsScreen';
import YourAdoptionsScreen from './screens/YourAdoptionsScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import VolunteerApplicationScreen from './screens/VolunteerApplicationScreen';
import AdoptScreen from './screens/AdoptScreen';
import RehomeScreen from './screens/RehomeScreen';
import PaidVolunteerTabNavigator from './navigation/PaidVolunteerTabNavigator';
import NotificationScreen from './screens/NotificationScreen';
import ReportDetailScreen from './screens/ReportDetailScreen';
import { navigationRef, navigateWhenReady } from './navigationRef';

import { auth } from './firebase';
import { BACKEND_BASE_URL, fetchJsonWithTimeout } from './apiClient';
import { colors } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function loadBackendUser(uid) {
  const { response, responseText, responseData } = await fetchJsonWithTimeout(
    `${BACKEND_BASE_URL}/api/users/${uid}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      responseData?.error || responseData?.message || responseText || `Failed to load user (${response.status})`
    );
  }

  return responseData;
}


async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: colors.primary,
  });
}

async function ensurePushNotificationPermission() {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical Android device or development build.');
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  let finalStatus = currentPermission.status;

  if (finalStatus !== 'granted') {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermission.status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }
}

async function getNativeDevicePushToken() {
  const tokenResponse = await Notifications.getDevicePushTokenAsync();
  const deviceToken = tokenResponse?.data;

  if (!deviceToken) {
    throw new Error('Expo Notifications did not return an FCM device token.');
  }

  return deviceToken;
}

async function uploadDeviceTokenToBackend(uid, deviceToken) {
  const { response, responseText, responseData } = await fetchJsonWithTimeout(
    `${BACKEND_BASE_URL}/api/users/${uid}/device-token`,
    {
      method: 'PATCH',
      body: JSON.stringify({ deviceToken }),
    }
  );

  if (!response.ok) {
    throw new Error(
      responseData?.error || responseData?.message || responseText || `Failed to save device token (${response.status})`
    );
  }

  return responseData;
}

// ─────────────────────────────────────────────────────────────────────────────
// ProfileStack — wraps ProfileScreen + MyReports as a nested stack
// ─────────────────────────────────────────────────────────────────────────────
function ProfileStack({ onLogout, currentUserProfile }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileMain"
        children={() => (
          <ProfileScreen
            onLogout={onLogout}
            currentUserProfile={currentUserProfile}
          />
        )}
      />
      <Stack.Screen
        name="MyReports"
        component={MyReportsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="YourAdoptions"
        component={YourAdoptionsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ClaimedRescues"
        children={() => <ClaimedRescuesScreen currentUserProfile={currentUserProfile} />}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppTabNavigator — always rendered; guest users land here
// ─────────────────────────────────────────────────────────────────────────────
function AppTabNavigator({ onLogout, currentUserProfile }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [fabSheetVisible, setFabSheetVisible] = useState(false);

  const handleFabPress = useCallback(() => {
    setFabSheetVisible(true);
  }, []);

  const handleFabClose = useCallback(() => {
    setFabSheetVisible(false);
  }, []);

  const handleInjuryReport = useCallback(() => {
    // useNavigation() inside AppTabNavigator gives the ROOT stack navigator.
    // To navigate to a tab screen we must use the nested navigation syntax.
    navigation.navigate('AppTabs', {
      screen: 'Home',
      params: { openReportModal: Date.now() },
    });
  }, [navigation]);

  const handleRehome = useCallback(() => {
    // Rehome is a root-stack screen, so this works directly.
    navigation.navigate('Rehome');
  }, [navigation]);


  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 70 + (insets.bottom || 0),
            paddingBottom: (insets.bottom || 0) + 9,
            paddingTop: 9,
            // Allow the centre FAB notch ring to overflow above the bar
            overflow: 'visible',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            marginTop: 4,
          },
        }}
      >
        <Tab.Screen
          name="Home"
          children={(props) => <HomeScreen currentUserProfile={currentUserProfile} {...props} />}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color }) => <Home size={21} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tab.Screen
          name="ReportsHub"
          component={ReportsHubScreen}
          options={{
            tabBarLabel: 'Reports',
            tabBarIcon: ({ color }) => <HeartHandshake size={21} color={color} strokeWidth={2.3} />,
          }}
        />
        {/* Centre FAB — placeholder screen; actual press handled by tabBarButton */}
        <Tab.Screen
          name="FABPlaceholder"
          component={ReportsHubScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: () => null,
            tabBarButton: (props) => (
              <CameraFAB {...props} onPress={handleFabPress} />
            ),
          }}
        />
        <Tab.Screen
          name="Donations"
          component={DonationsScreen}
          options={{
            tabBarLabel: 'Donations',
            tabBarIcon: ({ color }) => <WalletCards size={21} color={color} strokeWidth={2.3} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          children={() => (
            <ProfileStack
              onLogout={onLogout}
              currentUserProfile={currentUserProfile}
            />
          )}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => <UserRound size={21} color={color} strokeWidth={2.3} />,
          }}
        />
      </Tab.Navigator>

      <FABActionSheet
        visible={fabSheetVisible}
        onClose={handleFabClose}
        onInjury={handleInjuryReport}
        onRehome={handleRehome}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [authState, setAuthState] = useState({
    isSignedIn: false,
    isLoading: true,
  });
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const currentUserProfileRef = useRef(null);
  const pushTokenSyncInFlightRef = useRef(false);
  const lastSyncedTokenRef = useRef(null);

  useEffect(() => {
    currentUserProfileRef.current = currentUserProfile;
  }, [currentUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user || null);
      setAuthState({
        isSignedIn: !!user,
        isLoading: false,
      });

      if (!user) {
        setCurrentUserProfile(null);
        lastSyncedTokenRef.current = null;
        return;
      }

      try {
        const userData = await loadBackendUser(user.uid);
        console.log("USER DATA FROM API:", userData);
        setCurrentUserProfile(userData);
        lastSyncedTokenRef.current = userData?.deviceToken || null;
      } catch (error) {
        console.error('Failed to load current user profile in App:', error);
        setCurrentUserProfile(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    lastSyncedTokenRef.current = currentUserProfile?.deviceToken || null;
  }, [currentUserProfile?.deviceToken]);

  useEffect(() => {
    let isActive = true;
    let pushTokenSubscription = null;

    const syncDeviceToken = async (source) => {
      if (!firebaseUser?.uid || !currentUserProfile?.uid) {
        return;
      }

      if (pushTokenSyncInFlightRef.current) {
        return;
      }

      pushTokenSyncInFlightRef.current = true;

      try {
        await ensureAndroidNotificationChannel();
        await ensurePushNotificationPermission();

        const deviceToken = await getNativeDevicePushToken();

        if (!isActive) {
          return;
        }

        if (lastSyncedTokenRef.current === deviceToken) {
          return;
        }

        await uploadDeviceTokenToBackend(firebaseUser.uid, deviceToken);

        if (!isActive) {
          return;
        }

        lastSyncedTokenRef.current = deviceToken;
        setCurrentUserProfile((previousProfile) =>
          previousProfile ? { ...previousProfile, deviceToken } : previousProfile
        );

        console.log(`FCM device token synced from ${source}:`, deviceToken);
      } catch (error) {
        console.error(`FCM device token sync failed from ${source}:`, error);
      } finally {
        pushTokenSyncInFlightRef.current = false;
      }
    };

    syncDeviceToken('startup');

    pushTokenSubscription = Notifications.addPushTokenListener(async ({ data }) => {
      const refreshedToken = data || null;

      if (!refreshedToken || refreshedToken === lastSyncedTokenRef.current) {
        return;
      }

      if (!firebaseUser?.uid || !currentUserProfile?.uid) {
        return;
      }

      try {
        await uploadDeviceTokenToBackend(firebaseUser.uid, refreshedToken);

        if (!isActive) {
          return;
        }

        lastSyncedTokenRef.current = refreshedToken;
        setCurrentUserProfile((previousProfile) =>
          previousProfile ? { ...previousProfile, deviceToken: refreshedToken } : previousProfile
        );

        console.log('FCM device token refreshed and synced:', refreshedToken);
      } catch (error) {
        console.error('FCM device token refresh sync failed:', error);
      }
    });

    return () => {
      isActive = false;
      pushTokenSubscription?.remove?.();
    };
  }, [firebaseUser?.uid, currentUserProfile?.uid]);

  // ── Push notification tap handler ────────────────────────────────────────
  // Handles foreground, background, and killed-app notification taps.
  // Uses navigateWhenReady so it is safe even if the NavigationContainer
  // isn't mounted yet (e.g., app opened from a killed state).
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response?.notification?.request?.content?.data;
      const reportId = data?.reportId || data?.report_id || null;
      
      if (reportId && typeof reportId === 'string' && reportId.trim()) {
        navigateWhenReady('ReportDetail', { reportId: reportId.trim() });
      }
    });
    return () => subscription?.remove?.();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAuthState({
        isSignedIn: false,
        isLoading: false,
      });
      setCurrentUserProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleCompleteProfileSuccess = (profile) => {
    if (profile) {
      setCurrentUserProfile(profile);
      lastSyncedTokenRef.current = profile.deviceToken || lastSyncedTokenRef.current;
    }
  };

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        {authState.isLoading ? (
          // Blank splash while Firebase restores auth session
          <View style={styles.loadingScreen} />
        ) : (
          // ─── Root Stack ─────────────────────────────────────────────────
          // AppTabs is always the base screen — guests land here directly.
          // Login, Signup, and CompleteProfile are pushed on top of the tabs
          // when needed (e.g., from the guest Profile screen or the
          // "Report Rescue" login prompt in HomeScreen).
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AppTabs">
              {() => {
                if (currentUserProfile?.isPaidVolunteer && currentUserProfile?.paidVolunteerStatus === 'approved') {
                  return (
                    <PaidVolunteerTabNavigator
                      onLogout={handleLogout}
                      currentUserProfile={currentUserProfile}
                    />
                  );
                }
                return (
                  <AppTabNavigator
                    onLogout={handleLogout}
                    currentUserProfile={currentUserProfile}
                  />
                );
              }}
            </Stack.Screen>

            <Stack.Screen
              name="Login"
              options={{ animation: 'slide_from_bottom' }}
            >
              {({ navigation }) => (
                <LoginScreen
                  onSwitchToSignup={() => navigation.replace('Signup')}
                  onLoginSuccess={() => navigation.navigate('AppTabs')}
                  onSwitchToForgotPassword={() => navigation.navigate('ForgotPassword')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="ForgotPassword"
              options={{ animation: 'slide_from_right' }}
            >
              {({ navigation }) => (
                <ForgotPasswordScreen
                  onBackToLogin={() => navigation.navigate('Login')}
                />
              )}
            </Stack.Screen>

            <Stack.Screen
              name="Signup"
              options={{ animation: 'slide_from_bottom' }}
            >
              {({ route, navigation }) => {
                // Preserve volunteerIntent so CompleteProfile can route correctly.
                const volunteerIntent = route.params?.volunteerIntent || false;
                return (
                  <SignupScreen
                    onSwitchToLogin={() => navigation.replace('Login')}
                    onSignupSuccess={(profile) =>
                      navigation.replace('CompleteProfile', {
                        ...profile,
                        volunteerIntent,
                      })
                    }
                    onSignupCancel={() => navigation.goBack()}
                  />
                );
              }}
            </Stack.Screen>

            <Stack.Screen
              name="CompleteProfile"
              options={{ animation: 'slide_from_right' }}
            >
              {({ route, navigation }) => {
                const volunteerIntent = route.params?.volunteerIntent || false;
                return (
                  <CompleteProfileScreen
                    route={route}
                    onComplete={(profile) => {
                      handleCompleteProfileSuccess(profile);
                      // If the user signed up via "Become a Volunteer",
                      // route to the volunteer application screen instead of Home.
                      if (volunteerIntent) {
                        navigation.replace('VolunteerApplication');
                      } else {
                        navigation.navigate('AppTabs');
                      }
                    }}
                  />
                );
              }}
            </Stack.Screen>

            <Stack.Screen
              name="VolunteerApplication"
              options={{ animation: 'slide_from_right' }}
              component={VolunteerApplicationScreen}
            />

            <Stack.Screen
              name="Adopt"
              options={{ animation: 'slide_from_right' }}
              component={AdoptScreen}
            />

            <Stack.Screen
              name="Rehome"
              options={{ animation: 'slide_from_right' }}
              component={RehomeScreen}
            />

            <Stack.Screen
              name="RescueFeed"
              options={{ animation: 'slide_from_right' }}
              component={RescueFeedScreen}
            />

            <Stack.Screen
              name="Notifications"
              options={{ animation: 'slide_from_bottom' }}
              component={NotificationScreen}
            />

            <Stack.Screen
              name="ReportDetail"
              options={{ animation: 'slide_from_bottom' }}
              component={ReportDetailScreen}
            />


          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

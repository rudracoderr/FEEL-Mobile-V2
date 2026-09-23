import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Briefcase, Bell, Home, UserRound } from 'lucide-react-native';

import NearbyReportsScreen from '../screens/paidVolunteer/NearbyReportsScreen';
import PaidVolunteerMyCasesScreen from '../screens/paidVolunteer/PaidVolunteerMyCasesScreen';
import AssistanceRequestsScreen from '../screens/paidVolunteer/AssistanceRequestsScreen';
import PaidVolunteerProfileScreen from '../screens/paidVolunteer/PaidVolunteerProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function PaidVolunteerTabNavigator({ onLogout, currentUserProfile }) {
  const insets = useSafeAreaInsets();

  return (
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
        name="NearbyReports"
        children={() => <NearbyReportsScreen currentUserProfile={currentUserProfile} />}
        options={{
          tabBarLabel: 'Nearby',
          tabBarIcon: ({ color }) => <Home size={21} color={color} strokeWidth={2.3} />,
        }}
      />

      <Tab.Screen
        name="MyCases"
        children={() => <PaidVolunteerMyCasesScreen currentUserProfile={currentUserProfile} />}
        options={{
          tabBarLabel: 'My Cases',
          tabBarIcon: ({ color }) => <Briefcase size={21} color={color} strokeWidth={2.3} />,
        }}
      />

      <Tab.Screen
        name="AssistanceRequests"
        children={() => <AssistanceRequestsScreen currentUserProfile={currentUserProfile} />}
        options={{
          tabBarLabel: 'Assistance',
          tabBarIcon: ({ color }) => <Bell size={21} color={color} strokeWidth={2.3} />,
        }}
      />

      <Tab.Screen
        name="PaidVolunteerProfile"
        children={() => <PaidVolunteerProfileScreen onLogout={onLogout} currentUserProfile={currentUserProfile} />}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <UserRound size={21} color={color} strokeWidth={2.3} />,
        }}
      />
    </Tab.Navigator>
  );
}

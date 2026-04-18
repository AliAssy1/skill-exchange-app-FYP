import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegistrationScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';
import BrowseServicesScreen from '../screens/BrowseServicesScreen';
import ServiceRequestOfferScreen from '../screens/ServiceRequestOfferScreen';
import ServiceCompletionScreen from '../screens/ServiceCompletionScreen';
import FeedbackReputationScreen from '../screens/FeedbackReputationScreen';
import ReportModerationScreen from '../screens/ReportModerationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import ChatScreen from '../screens/ChatScreen';
import CalendarScreen from '../screens/CalendarScreen';
import SkillMatchingScreen from '../screens/SkillMatchingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import MyServicesScreen from '../screens/MyServicesScreen';
import IncomingRequestsScreen from '../screens/IncomingRequestsScreen';
import SentRequestsScreen from '../screens/SentRequestsScreen';
import BuyCreditsScreen from '../screens/BuyCreditsScreen';
import chatService from '../services/chatService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
      <Stack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={{ title: 'Registration' }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ title: 'Profile Setup' }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{
          title: 'Admin Dashboard',
          headerShown: true,
          headerStyle: {
            backgroundColor: AppColors.primary[600],
          },
          headerTintColor: AppColors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

function TabIcon({ name, focused, color }) {
  return <Ionicons name={focused ? name : `${name}-outline`} size={24} color={color} />;
}

function MainTabs() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const poll = async () => {
      const result = await chatService.getUnreadCount();
      if (result.success) setUnreadCount(result.data?.unread_count || 0);
    };
    poll();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: AppColors.primary[600],
        tabBarInactiveTintColor: AppColors.neutral[400],
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: AppColors.white,
          paddingBottom: 8,
          paddingTop: 6,
          height: 68,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: AppColors.primary[600],
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '700',
          color: AppColors.white,
        },
        headerTintColor: AppColors.white,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon name="home" focused={focused} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseServicesScreen}
        options={{
          title: 'Browse Services',
          tabBarLabel: 'Browse',
          tabBarIcon: ({ focused, color }) => <TabIcon name="search" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyServices"
        component={MyServicesScreen}
        options={{
          title: 'My Services',
          tabBarLabel: 'My Services',
          tabBarIcon: ({ focused, color }) => <TabIcon name="briefcase" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
          tabBarIcon: ({ focused, color }) => <TabIcon name="chatbubbles" focused={focused} color={color} />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { fontSize: 10, minWidth: 16, height: 16, lineHeight: 16 },
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon name="person" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#FFFFFF' },
        }}
      >
        <Stack.Screen
          name="Auth"
          component={AuthStack}
          options={{
            headerShown: false,
            animationEnabled: false,
          }}
        />
        <Stack.Screen
          name="MainApp"
          component={MainTabs}
          options={{
            headerShown: false,
            animationEnabled: false,
          }}
        />
        <Stack.Group
          screenOptions={{
            presentation: 'modal',
            headerShown: true,
            headerStyle: {
              backgroundColor: AppColors.white,
              borderBottomWidth: 1,
              borderBottomColor: AppColors.neutral[200],
            },
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
              color: AppColors.neutral[900],
            },
          }}
        >
          <Stack.Screen
            name="ServiceRequestOffer"
            component={ServiceRequestOfferScreen}
            options={{ title: 'Service Details' }}
          />
          <Stack.Screen
            name="ServiceCompletion"
            component={ServiceCompletionScreen}
            options={{ title: 'Completion' }}
          />
          <Stack.Screen
            name="FeedbackReputation"
            component={FeedbackReputationScreen}
            options={{ title: 'Feedback' }}
          />
          <Stack.Screen
            name="ReportModeration"
            component={ReportModerationScreen}
            options={{ title: 'Report Issue' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{ title: 'Calendar' }}
          />
          <Stack.Screen
            name="SkillMatching"
            component={SkillMatchingScreen}
            options={{ title: 'Skill Matches' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="Portfolio"
            component={PortfolioScreen}
            options={{ title: 'Portfolio' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={ProfileSetupScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="IncomingRequests"
            component={IncomingRequestsScreen}
            options={{ title: 'Incoming Requests' }}
          />
          <Stack.Screen
            name="SentRequests"
            component={SentRequestsScreen}
            options={{ title: 'Sent Requests' }}
          />
          <Stack.Screen
            name="BuyCredits"
            component={BuyCreditsScreen}
            options={{ title: 'Buy Credits' }}
          />
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

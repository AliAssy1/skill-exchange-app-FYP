import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: AppColors.primary[600],
        tabBarInactiveTintColor: AppColors.neutral[400],
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: AppColors.neutral[200],
          backgroundColor: AppColors.white,
          paddingBottom: 4,
          height: 60,
        },
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Browse"
        component={BrowseServicesScreen}
        options={{
          title: 'Browse',
          tabBarLabel: 'Browse',
        }}
      />
      <Tab.Screen
        name="MyServices"
        component={BrowseServicesScreen}
        options={{
          title: 'My Services',
          tabBarLabel: 'My Services',
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesListScreen}
        options={{
          title: 'Messages',
          tabBarLabel: 'Messages',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
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
        </Stack.Group>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

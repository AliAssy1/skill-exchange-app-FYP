# Skill & Service Exchange Platform - Wireframe App

A React Native mobile wireframe application for a non-monetary Skill & Service Exchange Platform designed for university students. The app enables students to offer and request skills/services from each other without monetary transactions.

## Features

### Authentication Flow
- **Registration**: Create account with university email, student ID, and validation
- **Login**: Secure login with email and password
- **Profile Setup**: Multi-step profile configuration (photo, skills, academic details)

### Main App Features
- **Home Screen**: Dashboard with credit balance, statistics, and recent activity
- **Browse Services**: Search and filter available services by category
- **Service Details**: View service details and request/offer services
- **Service Completion**: Mark services as complete with verification checklist
- **Feedback & Reputation**: Leave reviews with ratings and tags
- **Report & Moderation**: Report issues with detailed reporting form
- **User Profile**: View and manage user profile with statistics

### Design System
- Professional wireframe design (white/grey color scheme)
- Accessible UI with proper labels and font sizes
- Consistent component library (Button, InputField, Card, Avatar)
- No decorative icons or gradients

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: JavaScript (ES6+)
- **Navigation**: 
  - @react-navigation/native
  - @react-navigation/stack
  - @react-navigation/bottom-tabs
- **Native Support**: React Native Screens, Safe Area Context, Gesture Handler

## Project Structure

```
skill-exchange-wireframe/
├── screens/
│   ├── LoginScreen.js
│   ├── RegistrationScreen.js
│   ├── ProfileSetupScreen.js
│   ├── HomeScreen.js
│   ├── BrowseServicesScreen.js
│   ├── ServiceRequestOfferScreen.js
│   ├── ServiceCompletionScreen.js
│   ├── FeedbackReputationScreen.js
│   ├── ReportModerationScreen.js
│   └── ProfileScreen.js
├── navigation/
│   └── AppNavigator.js
├── components/
│   ├── Button.js
│   ├── InputField.js
│   ├── Card.js
│   └── PlaceholderAvatar.js
├── utils/
│   └── mockData.js
├── App.js
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Steps

1. **Navigate to project directory**:
   ```bash
   cd skill-exchange-wireframe
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

   This will install:
   - @react-navigation/native
   - @react-navigation/stack
   - @react-navigation/bottom-tabs
   - react-native-screens
   - react-native-safe-area-context
   - react-native-gesture-handler

3. **Verify installation**:
   ```bash
   npm list @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
   ```

## Running the App

### Option 1: Start Expo Development Server
```bash
npx expo start
```

This will display a QR code in the terminal.

### Option 2: Run on iOS (Expo Go)
```bash
npx expo start --ios
```

### Option 3: Run on Android (Expo Go)
```bash
npx expo start --android
```

## Using Expo Go

1. **Install Expo Go** app on your iOS/Android device:
   - iOS: App Store
   - Android: Google Play Store

2. **Start the development server**:
   ```bash
   npx expo start
   ```

3. **Scan the QR code** with your device:
   - iOS: Use Camera app or Expo Go app QR scanner
   - Android: Use Expo Go app QR scanner

4. **App will load** on your device

## Navigation Flow

### Authentication Stack
```
Login → Registration → Profile Setup (Step 1 of 3) → Main App
```

### Main App Tabs
- **Home**: Dashboard and activity overview
- **Browse**: Service discovery and search
- **My Services**: User's offered services
- **Profile**: User profile and statistics

### Modal Screens (Accessible from main app)
- Service Details & Request/Offer
- Service Completion Checklist
- Feedback & Reputation Review
- Report & Moderation Form

## Color Palette

| Element | Color |
|---------|-------|
| Background | #FFFFFF |
| Secondary Background | #F5F5F5 |
| Borders | #D1D5DB |
| Text Primary | #1F2937 |
| Text Secondary | #6B7280 |
| Primary Button | #4B5563 |
| Secondary Button | #E5E7EB |

## Component Documentation

### Button
```javascript
<Button
  title="Press Me"
  onPress={() => {}}
  variant="primary" // or "secondary"
  disabled={false}
  accessibilityLabel="Button Label"
/>
```

### InputField
```javascript
<InputField
  label="Label"
  placeholder="Placeholder"
  value={value}
  onChangeText={setValue}
  secureTextEntry={false}
  multiline={false}
  error={errorMessage}
  accessibilityLabel="Input Label"
/>
```

### Card
```javascript
<Card onPress={() => {}} style={{}}>
  <Text>Card Content</Text>
</Card>
```

### PlaceholderAvatar
```javascript
<PlaceholderAvatar size={64} initials="JD" />
```

## Mock Data

The app includes mock data for:
- User profile and statistics
- Available services (6 services with different categories)
- User activities and recent actions
- Reviews and ratings

Mock data is located in `utils/mockData.js`

## Features Implemented

### Form Validation
- Email format validation
- Password strength and matching
- Required field validation
- Real-time error messages

### Interactive Elements
- Button states and feedback
- Checkbox and radio button interactions
- Search and filter functionality
- Tab navigation
- Modal screens for detailed views

### Accessibility
- accessibilityLabel on all interactive elements
- Proper semantic structure
- Minimum font size of 14pt
- Good color contrast (WCAG AA compliant)
- Proper input labels

## Troubleshooting

### Issue: Port 8081 already in use
**Solution**: Kill the process using the port or specify a different port:
```bash
npx expo start --clear
```

### Issue: Dependencies not installed properly
**Solution**: Clear cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Issue: App not loading on Expo Go
**Solution**:
1. Ensure device is on same WiFi network as development machine
2. Restart Expo server: `npx expo start --clear`
3. Generate new QR code and scan again

## Performance Tips

- The app simulates loading states with 1-1.5 second delays
- Modal screens are presented without navigation back to full stack
- State is managed with React hooks (useState)
- Components are optimized for wireframe use case

## Browser Testing

You can also test the app in a web browser:
```bash
npx expo start --web
```

Then press `w` in the terminal to open the browser version.

## Next Steps for Production

To extend this wireframe into a production app:

1. **Backend Integration**: Connect to a real API for user authentication, services, and reviews
2. **Database**: Implement database for users, services, transactions, and reviews
3. **Image Upload**: Implement real image uploading for profile photos
4. **Payment System**: Integrate credit system or payment processing
5. **Real-time Features**: Add push notifications and real-time updates
6. **Enhanced UI**: Add animations, icons, and refined styling
7. **Testing**: Implement unit tests and E2E tests
8. **Analytics**: Add user tracking and analytics

## License

This is a wireframe prototype for educational purposes.

## Support

For issues or questions about the Expo development server, visit:
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [React Native Documentation](https://reactnative.dev/)

import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on both web and mobile
 */
export function showAlert(title, message, buttons) {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      // Confirmation dialog
      const confirmed = window.confirm(`${title}\n\n${message}`);
      if (confirmed) {
        const confirmBtn = buttons.find(b => b.style !== 'cancel');
        if (confirmBtn?.onPress) confirmBtn.onPress();
      } else {
        const cancelBtn = buttons.find(b => b.style === 'cancel');
        if (cancelBtn?.onPress) cancelBtn.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
      if (buttons?.[0]?.onPress) buttons[0].onPress();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}

/**
 * Cross-platform confirm dialog
 * Returns a promise that resolves to true/false
 */
export function showConfirm(title, message) {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'OK', onPress: () => resolve(true) },
      ]);
    }
  });
}

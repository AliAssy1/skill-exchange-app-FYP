import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (userId) => `profile_photo_${userId}`;

export async function saveProfilePhoto(userId, uri) {
  if (!userId || !uri) return;
  await AsyncStorage.setItem(key(userId), uri);
}

export async function loadProfilePhoto(userId) {
  if (!userId) return null;
  return AsyncStorage.getItem(key(userId));
}

export async function clearProfilePhoto(userId) {
  if (!userId) return;
  await AsyncStorage.removeItem(key(userId));
}

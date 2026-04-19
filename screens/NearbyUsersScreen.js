import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import PlaceholderAvatar from '../components/PlaceholderAvatar';
import userService from '../services/userService';
import { AppColors, Shadows, Spacing, Typography, BorderRadius } from '../constants/theme';

const RADIUS_OPTIONS = [2, 5, 10, 25];

export default function NearbyUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [coords, setCoords] = useState(null);
  const [radius, setRadius] = useState(10);

  useEffect(() => {
    requestAndFetch();
  }, []);

  useEffect(() => {
    if (coords) fetchNearby(coords.latitude, coords.longitude, radius);
  }, [radius]);

  const requestAndFetch = async () => {
    setLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Please enable it in your device settings to see nearby students.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      setCoords({ latitude, longitude });
      await userService.updateLocation(latitude, longitude);
      await fetchNearby(latitude, longitude, radius);
    } catch (error) {
      setLocationError('Could not get your location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearby = async (lat, lng, r) => {
    setLoading(true);
    const result = await userService.getNearbyUsers(lat, lng, r).catch(() => ({ success: false }));
    if (result.success) setUsers(result.data || []);
    setLoading(false);
  };

  const formatDistance = (km) => {
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Chat', { userId: item.id, userName: item.full_name })}
      activeOpacity={0.75}
    >
      <PlaceholderAvatar size={52} name={item.full_name} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.full_name}</Text>
        {item.major ? <Text style={styles.major} numberOfLines={1}>{item.major}</Text> : null}
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={AppColors.warning[500]} />
          <Text style={styles.metaText}>{item.reputation_score || '5.0'}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.distanceBadge}>
        <Ionicons name="location" size={13} color={AppColors.primary[600]} />
        <Text style={styles.distanceText}>{formatDistance(item.distance_km)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      {/* Radius selector */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Within:</Text>
        {RADIUS_OPTIONS.map(r => (
          <TouchableOpacity
            key={r}
            style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
            onPress={() => setRadius(r)}
          >
            <Text style={[styles.radiusBtnText, radius === r && styles.radiusBtnTextActive]}>
              {r}km
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.refreshBtn} onPress={requestAndFetch}>
          <Ionicons name="refresh" size={18} color={AppColors.primary[600]} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary[600]} />
          <Text style={styles.loadingText}>Finding nearby students...</Text>
        </View>
      ) : locationError ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={56} color={AppColors.neutral[300]} />
          <Text style={styles.errorTitle}>Location Unavailable</Text>
          <Text style={styles.errorText}>{locationError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={requestAndFetch}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={56} color={AppColors.neutral[300]} />
          <Text style={styles.errorTitle}>No students nearby</Text>
          <Text style={styles.errorText}>No other students found within {radius}km. Try increasing the radius.</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AppColors.neutral[50] },

  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral[100],
  },
  radiusLabel: { fontSize: 13, color: AppColors.neutral[500], fontWeight: '600', marginRight: 4 },
  radiusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.neutral[200],
    backgroundColor: AppColors.white,
  },
  radiusBtnActive: {
    backgroundColor: AppColors.primary[600],
    borderColor: AppColors.primary[600],
  },
  radiusBtnText: { fontSize: 12, fontWeight: '600', color: AppColors.neutral[600] },
  radiusBtnTextActive: { color: AppColors.white },
  refreshBtn: { marginLeft: 'auto', padding: 6 },

  list: { padding: Spacing.base, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '700', color: AppColors.neutral[800] },
  major: { fontSize: 12, color: AppColors.neutral[500], marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: AppColors.neutral[500], marginRight: 6 },
  bio: { fontSize: 12, color: AppColors.neutral[400], flex: 1 },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: AppColors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: { fontSize: 11, fontWeight: '700', color: AppColors.primary[600] },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: AppColors.neutral[400] },
  errorTitle: { fontSize: 18, fontWeight: '600', color: AppColors.neutral[700], marginTop: 16, marginBottom: 8 },
  errorText: { fontSize: 14, color: AppColors.neutral[400], textAlign: 'center', lineHeight: 21 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: AppColors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: { color: AppColors.white, fontWeight: '600', fontSize: 14 },
});

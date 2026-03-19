import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import transactionService from '../services/transactionService';
import { showAlert } from '../utils/alertHelper';

const COLORS = {
  white: '#FFFFFF',
  background: '#F5F5F5',
  text: '#1F2937',
  secondary: '#6B7280',
  border: '#D1D5DB',
  primary: '#4B5563',
};

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = [
  { id: '1', time: '9:00 AM', available: true },
  { id: '2', time: '10:00 AM', available: true },
  { id: '3', time: '11:00 AM', available: true },
  { id: '4', time: '12:00 PM', available: true },
  { id: '5', time: '1:00 PM', available: true },
  { id: '6', time: '2:00 PM', available: true },
  { id: '7', time: '3:00 PM', available: true },
  { id: '8', time: '4:00 PM', available: true },
  { id: '9', time: '5:00 PM', available: true },
];

export default function CalendarScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [selectedTime, setSelectedTime] = useState(null);
  const [view, setView] = useState('calendar');
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const result = await transactionService.getTransactions();
      if (result.success) {
        setBookings(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const now = new Date();
  const currentMonth = now.toLocaleString('default', { month: 'long' });
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, now.getMonth() + 1, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const renderCalendarView = () => (
    <>
      <View style={styles.monthHeader}>
        <Text style={styles.monthText}>{currentMonth} {currentYear}</Text>
      </View>

      <View style={styles.daysHeader}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.dayLabel}>
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.datesGrid}>
        {dates.map((date) => (
          <TouchableOpacity
            key={date}
            style={[
              styles.dateCell,
              selectedDate === date && styles.selectedDate,
            ]}
            onPress={() => setSelectedDate(date)}
            accessible
            accessibilityLabel={`Select date ${date}`}
          >
            <Text
              style={[
                styles.dateText,
                selectedDate === date && styles.selectedDateText,
              ]}
            >
              {date}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Available Time Slots</Text>
      <View style={styles.timeSlotsContainer}>
        {timeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.timeSlot,
              !slot.available && styles.timeSlotUnavailable,
              selectedTime === slot.id && styles.timeSlotSelected,
            ]}
            onPress={() => slot.available && setSelectedTime(slot.id)}
            disabled={!slot.available}
            accessible
            accessibilityLabel={`${slot.time} ${
              slot.available ? 'available' : 'unavailable'
            }`}
          >
            <Text
              style={[
                styles.timeSlotText,
                !slot.available && styles.timeSlotTextUnavailable,
                selectedTime === slot.id && styles.timeSlotTextSelected,
              ]}
            >
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedTime && (
        <View style={styles.bookingAction}>
          <Button
            title="Book This Slot"
            onPress={() => {
              const selectedSlot = timeSlots.find((s) => s.id === selectedTime);
              showAlert(
                'Booking Confirmed',
                `Your session is scheduled for ${currentMonth} ${selectedDate} at ${selectedSlot?.time}.`
              );
              setSelectedTime(null);
            }}
            accessibilityLabel="Confirm Booking"
          />
        </View>
      )}
    </>
  );

  const renderBookingsView = () => (
    <>
      <Text style={styles.sectionTitle}>My Bookings</Text>
      {loadingBookings ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>No bookings yet</Text>
          <Text style={styles.emptySubtext}>Your scheduled sessions will appear here</Text>
        </View>
      ) : (
        bookings.map((booking) => (
          <Card key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <Text style={styles.bookingTitle}>{booking.service_title || 'Session'}</Text>
              <View
                style={[
                  styles.statusBadge,
                  booking.status === 'completed'
                    ? styles.statusConfirmed
                    : styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>
                  {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.bookingUser}>with {booking.provider_name || booking.requester_name || 'User'}</Text>
            <View style={styles.bookingDetails}>
              <Text style={styles.bookingDate}>📅 {booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString() : 'TBD'}</Text>
              <Text style={styles.bookingTime}>💰 {booking.credits_amount} credits</Text>
            </View>
          </Card>
        ))
      )}
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, view === 'calendar' && styles.tabActive]}
          onPress={() => setView('calendar')}
        >
          <Text
            style={[styles.tabText, view === 'calendar' && styles.tabTextActive]}
          >
            Calendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, view === 'bookings' && styles.tabActive]}
          onPress={() => setView('bookings')}
        >
          <Text
            style={[styles.tabText, view === 'bookings' && styles.tabTextActive]}
          >
            My Bookings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {view === 'calendar' ? renderCalendarView() : renderBookingsView()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  monthHeader: {
    marginBottom: 16,
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  dateCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  selectedDate: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.text,
  },
  selectedDateText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  timeSlotUnavailable: {
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },
  timeSlotSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 14,
    color: COLORS.text,
  },
  timeSlotTextUnavailable: {
    color: COLORS.secondary,
  },
  timeSlotTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  bookingAction: {
    marginTop: 20,
  },
  bookingCard: {
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusConfirmed: {
    backgroundColor: '#D1FAE5',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  bookingUser: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 8,
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookingDate: {
    fontSize: 13,
    color: COLORS.text,
  },
  bookingTime: {
    fontSize: 13,
    color: COLORS.text,
  },
  bookingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionButtonDanger: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
  },
  actionButtonTextDanger: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
});

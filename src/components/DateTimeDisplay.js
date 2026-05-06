import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DateTimeDisplay = ({ style, textStyle, showIcon = true }) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    updateDateTime();
    // Update every second
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const updateDateTime = () => {
    const now = new Date();

    const options = {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const formatter = new Intl.DateTimeFormat('en-NZ', options);
    const parts = formatter.formatToParts(now);
    const day = parts.find((part) => part.type === 'day')?.value || '01';
    const month = parts.find((part) => part.type === 'month')?.value || '01';
    const year = parts.find((part) => part.type === 'year')?.value || '1970';
    const hour = parts.find((part) => part.type === 'hour')?.value || '00';
    const minute = parts.find((part) => part.type === 'minute')?.value || '00';
    const dayPeriod = (parts.find((part) => part.type === 'dayPeriod')?.value || 'am').toLowerCase();

    setCurrentDateTime(`${day}/${month}/${year} ${hour}:${minute} ${dayPeriod}`);
  };

  return (
    <View style={[styles.container, style]}>
      {showIcon && <Ionicons name="time-outline" size={16} color="#666" style={styles.icon} />}
      <Text style={[styles.dateTimeText, textStyle]}>{currentDateTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  icon: {
    marginRight: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default DateTimeDisplay;


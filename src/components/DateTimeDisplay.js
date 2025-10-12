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
    
    // Format: "Monday 13 October 2025, at 10:11am NZDT"
    const options = {
      timeZone: 'Pacific/Auckland',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    
    const formatter = new Intl.DateTimeFormat('en-NZ', options);
    const formattedDate = formatter.format(now);
    
    // Get timezone abbreviation (NZST or NZDT)
    const timezoneFormatter = new Intl.DateTimeFormat('en-NZ', {
      timeZone: 'Pacific/Auckland',
      timeZoneName: 'short'
    });
    const parts = timezoneFormatter.formatToParts(now);
    const timeZoneName = parts.find(part => part.type === 'timeZoneName');
    const timezone = timeZoneName ? timeZoneName.value : 'NZT';
    
    // Reformat to match desired format: "Monday 13 October 2025, at 10:11am NZDT"
    const dateRegex = /(\w+),?\s+(\d+)\s+(\w+)\s+(\d+),?\s+(\d+):(\d+)\s*([ap]m)/i;
    const match = formattedDate.match(dateRegex);
    
    if (match) {
      const [, weekday, day, month, year, hour, minute, ampm] = match;
      const formatted = `${weekday} ${day} ${month} ${year}, at ${hour}:${minute}${ampm.toLowerCase()} ${timezone}`;
      setCurrentDateTime(formatted);
    } else {
      // Fallback format
      setCurrentDateTime(`${formattedDate} ${timezone}`);
    }
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


import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimeDisplay from './DateTimeDisplay';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const PortalHeader = ({ actions = [] }) => {
  const { isMobile, isTablet, maxContentWidth, horizontalPadding } = useResponsiveLayout();
  const headerIconSize = isMobile ? 48 : isTablet ? 58 : 70;
  const headerFontSize = isMobile ? 20 : isTablet ? 28 : 32;
  const headerLineHeight = isMobile ? 25 : isTablet ? 32 : 36;
  const headerIconGap = isMobile ? 24 : 30;
  const dateLeftOffset = headerIconSize + headerIconGap;
  const showActionLabels = true;

  const renderActionButton = (action) => (
    <TouchableOpacity
      key={action.id}
      onPress={action.onPress}
      style={[
        styles.actionButton,
        showActionLabels && styles.actionButtonWithLabel,
        { backgroundColor: action.backgroundColor, borderColor: action.borderColor }
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.accessibilityLabel}
    >
      <Ionicons name={action.icon} size={20} color={action.iconColor} />
      {showActionLabels && !!action.label && (
        <Text style={[styles.actionLabel, { color: action.iconColor }]}>{action.label}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.headerShell, !isMobile && styles.headerShellDesktop]}>
      <View
        style={[
          styles.header,
          { maxWidth: maxContentWidth, paddingHorizontal: horizontalPadding },
          isMobile && styles.headerMobile
        ]}
      >
      <View style={styles.brandBlock}>
        <View style={[styles.titleRow, { gap: headerIconGap }]}>
          <Ionicons name="school" size={headerIconSize} color="#4a90e2" />
          <Text style={[styles.title, { fontSize: headerFontSize, lineHeight: headerLineHeight }]}>
            School Class{'\n'}Management System
          </Text>
        </View>
        <DateTimeDisplay
          style={[styles.date, { marginLeft: dateLeftOffset }]}
          textStyle={styles.dateText}
          showIcon={false}
        />
        {isMobile && (
          <View style={[styles.actionsRow, styles.actionsRowMobile]}>
            {actions.map(renderActionButton)}
          </View>
        )}
      </View>

      {!isMobile && (
        <View style={styles.actionsRow}>
          {actions.map(renderActionButton)}
        </View>
      )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerShell: {
    width: '100%',
    alignItems: 'center',
  },
  headerShellDesktop: {
    backgroundColor: '#fff',
  },
  header: {
    width: '100%',
    paddingTop: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerMobile: {
    justifyContent: 'flex-start',
  },
  brandBlock: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 560,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'left',
    flexShrink: 1,
  },
  date: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dateText: {
    color: '#5b6470',
    fontWeight: '500',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionsRowMobile: {
    alignSelf: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonWithLabel: {
    width: 'auto',
    minHeight: 40,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default PortalHeader;

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const PortalIdentity = ({ portalTitle, userName, mobileTopGap = 6 }) => {
  const { isMobile, isTablet } = useResponsiveLayout();

  const titleSize = isMobile ? 20 : isTablet ? 30 : 34;
  const nameSize = isMobile ? 18 : isTablet ? 24 : 28;

  return (
    <View style={[styles.wrap, { marginTop: isMobile ? mobileTopGap : 16 }]}>
      <Text style={[styles.title, { fontSize: titleSize, lineHeight: isMobile ? 24 : isTablet ? 36 : 40 }]}>
        {portalTitle}
      </Text>
      <Text style={[styles.name, { fontSize: nameSize, lineHeight: isMobile ? 22 : isTablet ? 30 : 34 }]}>
        Welcome, {userName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    fontWeight: '700',
    color: '#2f3744',
    textAlign: 'center',
  },
  name: {
    marginTop: 2,
    fontWeight: '600',
    color: '#4a5563',
    textAlign: 'center',
  },
});

export default PortalIdentity;

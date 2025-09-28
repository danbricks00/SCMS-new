import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { Text, View } from 'react-native';

import LandingPage from '../screens/LandingPage';
import StudentPortal from '../screens/StudentPortal';

// Placeholder screens - you'll implement these later
const ParentPortal = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Parent Portal</Text></View>;
const TeacherPortal = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Teacher Portal</Text></View>;
const AdminPortal = () => <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Admin Portal</Text></View>;

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing" component={LandingPage} />
        <Stack.Screen name="StudentPortal" component={StudentPortal} />
        <Stack.Screen name="ParentPortal" component={ParentPortal} />
        <Stack.Screen name="TeacherPortal" component={TeacherPortal} />
        <Stack.Screen name="AdminPortal" component={AdminPortal} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
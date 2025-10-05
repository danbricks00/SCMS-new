import { StyleSheet, Text, View } from 'react-native';

export default function TestScreen() {
  console.log('Test screen mounted');
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Test Screen Working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold'
  }
});
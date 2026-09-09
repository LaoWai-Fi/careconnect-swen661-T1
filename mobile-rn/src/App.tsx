// Placeholder root component — replaced by the navigation shell in the
// screens commit. Kept minimal so the state layer can be committed and tested
// independently.
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Text>CareConnect (React Native) — Week 5 scaffold</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

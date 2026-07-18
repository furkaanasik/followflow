import { StyleSheet, Text, View } from 'react-native';

export default function AyarlarScreen() {
  return (
    <View style={styles.container}>
      <Text>Ayarlar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

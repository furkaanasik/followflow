import { StyleSheet, Text, View } from 'react-native';

export default function AnaSayfaScreen() {
  return (
    <View style={styles.container}>
      <Text>Ana Sayfa</Text>
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

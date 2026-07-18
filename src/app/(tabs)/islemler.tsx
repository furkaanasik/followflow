import { StyleSheet, Text, View } from 'react-native';

export default function IslemlerScreen() {
  return (
    <View style={styles.container}>
      <Text>İşlemler</Text>
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

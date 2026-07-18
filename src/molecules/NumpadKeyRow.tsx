import { StyleSheet, View } from 'react-native';

import { NumpadKey } from './NumpadKey';

export interface NumpadKeyRowProps {
  keys: string[];
  onKeyPress: (key: string) => void;
}

export function NumpadKeyRow({ keys, onKeyPress }: NumpadKeyRowProps) {
  return (
    <View style={styles.container}>
      {keys.map((key) => (
        <NumpadKey key={key} label={key} onPress={() => onKeyPress(key)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between' },
});

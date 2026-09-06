import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { decrement, increment, reset } from './counter';

export default function CounterScreen() {
  const [value, setValue] = useState(reset());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello World</Text>
      <Text style={styles.value}>{value}</Text>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={() => setValue(decrement)}>
          <Text style={styles.buttonLabel}>-</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => setValue(reset)}>
          <Text style={styles.buttonLabel}>0</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => setValue(increment)}>
          <Text style={styles.buttonLabel}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    gap: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  value: {
    fontSize: 72,
    fontWeight: '700',
    color: '#970f06',
    fontVariant: ['tabular-nums'],
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  buttonLabel: {
    fontSize: 30,
    fontWeight: '600',
    color: '#111827',
  },
});

import { StatusBar } from 'expo-status-bar';

import CounterScreen from './src/CounterScreen';

export default function App() {
  return (
    <>
      <CounterScreen />
      <StatusBar style="auto" />
    </>
  );
}

/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ScreenContextProvider } from "./src/services/Context";
import Login from './src/pages/Login';
import InBound from './src/pages/InBound';
import ProductScan from './src/pages/ProductScan';
import CreatePacking from './src/pages/CreatePacking';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <ScreenContextProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <CreatePacking navigation={{} as any} />
      </ScreenContextProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

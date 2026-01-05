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
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from "./src/services/redux/rootRrducer";
import { ScreenContextProvider } from "./src/services/Context";
import Login from './src/Pages/Login';
import InBound from './src/Pages/InBound';
import ProductScan from './src/Pages/ProductScan';
import CreatePacking from './src/Pages/CreatePacking';
import PackingScan from './src/Pages/PackaingScan';
import Navigation from "./src/services/navigation";

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <ScreenContextProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <Navigation />
          </ScreenContextProvider>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;

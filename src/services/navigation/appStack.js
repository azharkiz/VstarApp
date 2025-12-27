import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createStackNavigator} from '@react-navigation/stack';
import 'react-native-gesture-handler';

import Login from '../../Modules/Login';
import Invoice from '../../Modules/Invoice';
import Scanner from '../../Modules/Scanner';
import ProductList from '../../Modules/ProductList';
import UnitScreen from '../../Modules/UnitScreen';
import PrivacyPolicy from '../../Modules/PrivacyPolicy';
import RegisterScreen from '../../Modules/RegisterScreen';
import SearchListScanner from '../../Modules/SearchListScanner';
import DetailsScreen from '../../Modules/DetailsScreen';

const MScreens = createStackNavigator();

function AppStack({isLogged}) {
  if (isLogged === true) {
    return (
      <MScreens.Navigator sceneContainerStyle={{backgroundColor: 'black'}}>
          <MScreens.Screen
          name="SearchListScanner"
          component={SearchListScanner}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="DetailsScreen"
          component={DetailsScreen}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="InvoiceScreen"
          component={Invoice}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="ScannerScreen"
          component={Scanner}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="ProductList"
          component={ProductList}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />

        <MScreens.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicy}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
      </MScreens.Navigator>
    );
  } else {
    return (
      <MScreens.Navigator sceneContainerStyle={{backgroundColor: 'black'}}>
        <MScreens.Screen
          name="LoginScreen"
          component={Login}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="RegisterScreen"
          component={RegisterScreen}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
         <MScreens.Screen
          name="DetailsScreen"
          component={DetailsScreen}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="SearchListScanner"
          component={SearchListScanner}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="UnitScreen"
          component={UnitScreen}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="InvoiceScreen"
          component={Invoice}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="ScannerScreen"
          component={Scanner}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="ProductList"
          component={ProductList}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
        <MScreens.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicy}
          options={{
            title: null,
            headerTransparent: true,
            headerShown: false,
          }}
        />
      </MScreens.Navigator>
    );
  }
}
export default AppStack;

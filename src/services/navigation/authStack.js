import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../../Pages/Login';

const LoginStack = createNativeStackNavigator();
// Login Stack Navigator
const AuthStack = () => (
    <LoginStack.Navigator
    screenOptions={{
      headerShown: false,
    }}>
      <LoginStack.Screen name='Login' component={Login} />
    </LoginStack.Navigator>
  );

export default AuthStack;
import * as React from 'react';
import { AuthProvider } from '../Context/AuthContext';
import AppStack from './appStack';


const Navigation = () => {
  return (
    <AuthProvider>
      <AppStack />
    </AuthProvider>
  );
};

export default Navigation;


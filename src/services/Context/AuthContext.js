import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('isLoggedIn');
        if (savedState !== null) {
          setIsLoggedIn(JSON.parse(savedState));
        }
      } catch (error) { } finally {
        setLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const updateLoginState = async (state) => {
    try {
        console.log("Updating login state:", state);
      setIsLoggedIn(state);
      await AsyncStorage.setItem('isLoggedIn', JSON.stringify(state));
    } catch (error) { }
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn: updateLoginState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthCheck = () => useContext(AuthContext);

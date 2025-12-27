/* eslint-disable react-hooks/exhaustive-deps */
import React, { useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { isTablet } from 'react-native-device-info';

const ScreenContext = React.createContext();

export const useScreenContext = () => useContext(ScreenContext);

export const ScreenContextProvider = ({ children }) => {
  const { width, height, scale, fontScale } = useWindowDimensions();

  const isPortrait = height > width;
  const isTypeTablet = isTablet();

  return (
    <ScreenContext.Provider
      value={{
        windowHeight: height,
        windowWidth: width,
        windowScale: scale,
        windowFontScale: fontScale,
        isPortrait,
        isTypeTablet,
      }}
    >
      {children}
    </ScreenContext.Provider>
  );
};

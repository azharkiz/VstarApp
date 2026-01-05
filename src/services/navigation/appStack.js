import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AdminTab from "./adminStack";
import AuthStack from "./authStack";
import { useAuthCheck } from "../Context/AuthContext";

const AppStack = () => {
      const { isLoggedIn } = useAuthCheck();
     const renderNavigator = () => {
    switch (isLoggedIn) {
      case "admin":
        return <AdminTab />;
      default:
        return <AuthStack />;
    }
  };

    return <NavigationContainer>
        {renderNavigator()}
    </NavigationContainer>;
};

export default AppStack;


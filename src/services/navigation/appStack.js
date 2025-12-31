import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import AdminTab from "./adminStack";

const AppStack = () => {

    return <NavigationContainer>
        <AdminTab />
    </NavigationContainer>;
};

export default AppStack;


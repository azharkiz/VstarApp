import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TouchableOpacity, StyleSheet, Platform, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Entypo from "react-native-vector-icons/Entypo";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";

import InBound from "../../Pages/InBound";
import OutBound from "../../Pages/OutBound";
import IntMove from "../../Pages/IntMove";
import PhysInventry from "../../Pages/PhysInventry";
import ProductScan from "../../Pages/ProductScan";

import { Colors } from "../../thems/Colors";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AdminBottomTab = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        keyboardHidesTabBar: true,
        tabBarStyle: {
          backgroundColor: Colors.name.white,
          borderTopWidth: 0,
          height: Platform.OS === "ios" ? 90 : 80, // 👈 important
          paddingBottom: Platform.OS === "ios" ? 25 : 8, // 👈 fills home indicator
        },
        tabBarActiveTintColor: Colors.name.openFooterGreen,
        tabBarInactiveTintColor: Colors.name.grey,
      }}
    >
      <Tab.Screen
        name="OutBound"
        component={OutBound}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="arrow-back-circle-outline" color={color} size={size} />
          ),
        }}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}

      />

      <Tab.Screen
        name="InBound"
        component={InBound}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="arrow-forward-circle-outline" color={color} size={size} />
          ),
        }}
         screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
      <Tab.Screen
        name="IntMove"
        component={IntMove}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="move-outline" color={color} size={size} />
          ),
        }}
         screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />

      <Tab.Screen
        name="PhysInventry"
        component={PhysInventry}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Entypo name="text-document" color={color} size={size} />
          ),
          tabBarLabel: "Settings",
        }}
         screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
    </Tab.Navigator>
  );
};
const AdminTab = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AdminTab"
        component={AdminBottomTab}
        options={{ headerShown: false }}
         screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
        }}
      />
      <Stack.Screen
        screenOptions={{ headerShown: false }}
        name="ProductScan"
        component={ProductScan}
        options={{
          headerShown: false,
        }}
      />

    </Stack.Navigator>
  );
};

export default AdminTab;

// Styles
const styles = StyleSheet.create({
  tabBarStyle: {
    color: Colors.name.darkBlue,
  },
  container: {
    position: "absolute",
    bottom: 15,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "transparent", // Ensures no white background
    justifyContent: "center",
    alignItems: "center",
    left: 25,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: Colors.name.greyWhite,
    borderWidth: 5,
    backgroundColor: Colors.name.darkBlue,
    justifyContent: "center",
    alignItems: "center",
  },
});

import React from "react";
import { View, Text, Image, TouchableOpacity, TextInput } from "react-native";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { logout } from "../../services/redux/slice/authSlice";
import { useAuthCheck } from "../../services/Context/AuthContext";
import { useDispatch } from "react-redux";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { performLogout } from "../../services/redux/slice/authSlice";
import { resetOutBoundState } from "../../services/redux/slice/outBoundSlice";

const PhysInventry = () => {
    const screenContext = useScreenContext();
    const { setIsLoggedIn } = useAuthCheck();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const screenStyles = styles(
        screenContext,
        screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"],
        screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"]
    );
    const logoutFun = async () => {
        setIsLoggedIn("login");
           // perform async cleanup and redux logout
        await dispatch(performLogout());
        // clear any other slice state if needed
        dispatch(resetOutBoundState());
        // clear local auth context flag
        setIsLoggedIn(false);
    };
    return (
        <View style={screenStyles.container}>
            <View style={screenStyles.header}>
                <TouchableOpacity 
                onPress={logoutFun}
                style={screenStyles.logoutButton}>
                    <MaterialIcons name="logout" size={20} color={Colors.name.white} />
                    <Text style={screenStyles.headerText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <View style={screenStyles.content}>
                <Image source={require('../../assets/vstar.png')} style={screenStyles.logo} />
                <Text>Settings screen</Text>
            </View>
        </View>
    );
};

const styles = (screenContext, width, height) => ({
    container: {
        flex: 1,
    },
    header: {
        flex: 0.1,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        marginRight: width * 0.05,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: Colors.name.VstarRed,
        borderRadius: 5,
        flexDirection: "row",
        alignItems: "center",
    },
    headerText: {
        color: Colors.name.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    content: {
        flex: 0.9,
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
});


export default PhysInventry;

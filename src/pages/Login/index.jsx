import React from "react";
import { View, Text, Image, TouchableOpacity, TextInput } from "react-native";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";

const Login = () => {
    const screenContext = useScreenContext();
    const screenStyles = styles(
        screenContext,
        screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"],
        screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"]
    );
    return (
        <View style={screenStyles.container}>
            <Image source={require('../../assets/vstar.png')} style={screenStyles.logo} />
            <TextInput placeholder="Emp Code" style={screenStyles.input} secureTextEntry />
            <TouchableOpacity onPress={() => setScreen('Home')} style={screenStyles.button}>
                <Text style={screenStyles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = (screenContext, width, height) => ({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        // backgroundColor: Colors.name.darkBlue,
    },
    keyboardContainer: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    cardView: {
        width: "90%",
        padding: width * 0.05,
        // backgroundColor: Colors.name.white,
        borderRadius: width * 0.04,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    titleHead: {
        fontSize: 26,
        fontWeight: "bold",
        // color: Colors.name.darkBlue,
        marginBottom: height * 0.008,
    },
    titleHeadDec: {
        fontSize: 14,
        // color: Colors.name.darkGrey,
        marginBottom: height * 0.025,
        textAlign: "center",
    },
    input: {
        width: width * 0.8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginVertical: 8,
        borderWidth: 1,
        // borderColor: Colors.name.darkGrey,
        borderRadius: 8,
        // backgroundColor: Colors.name.white,
        // color: Colors.name.black,
        fontSize: 16,
    },
    errorText: {
        // color: Colors.name.red,
        fontSize: 14,
        marginBottom: 10,
    },
    button: {
        width: width * 0.5,
        backgroundColor: Colors.name.VstarRed,
        paddingVertical: 14,
        borderRadius: 4,
        borderColor: "#000",
        alignItems: "center",
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    forgotPassword: {
        marginTop: 12,
        fontSize: 14,
        // color: Colors.name.darkBlue,
        textDecorationLine: "underline",
    },
    privacyPolicy: {
        marginTop: 14,
        fontSize: 14,
        // color: Colors.name.darkBlue,
        textDecorationLine: "underline",
    },
    footer: {
        width: "100%",
        // borderTopColor: Colors.name.lightGrey,
        alignItems: "center",
        marginBottom: 12
    },
    footerText: {
        fontSize: 12,
        // color: Colors.name.darkGrey,
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
});


export default Login;

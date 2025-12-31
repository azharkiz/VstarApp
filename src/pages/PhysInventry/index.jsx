import React from "react";
import { View, Text, Image, TouchableOpacity, TextInput } from "react-native";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";

const PhysInventry = () => {
    const screenContext = useScreenContext();
    const screenStyles = styles(
        screenContext,
        screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"],
        screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"]
    );
    return (
        <View style={screenStyles.container}>
            <Image source={require('../../assets/vstar.png')} style={screenStyles.logo} />
            <Text>Physical Inventory</Text>
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
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
    },
});


export default PhysInventry;

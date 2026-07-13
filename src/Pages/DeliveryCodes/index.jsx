import React, { useState, useEffect, use } from "react";
import { View, Text, Image, TouchableOpacity, FlatList, Alert } from "react-native";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { useDispatch, useSelector } from "react-redux";
import { useAuthCheck } from "../../services/Context/AuthContext";
import Ionicons from "react-native-vector-icons/Ionicons";
import { fetchOutBoundFiles, selectOutBound, fetchFileDetails, fetchOutBoundDeliveryCodes, fetchFullRowByMatch } from '../../services/redux/slice/outBoundSlice';

const DeliveryCodes = (props) => {
    const screenContext = useScreenContext();
    const { setIsLoggedIn } = useAuthCheck();
    const screenStyles = styles(
        screenContext,
        screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"],
        screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"]
    );
    const dispatch = useDispatch();
     const { deliveryCodes, status, error } = useSelector(selectOutBound);

    const [employee, setEmployee] = useState("");
useEffect(() => {
    const filename = props.route?.params?.fileName;
    if (!filename) {
        console.error('DeliveryCodes: no filename provided, skipping fetch');
        return;
    }
    const payload = { filename };
    dispatch(fetchOutBoundDeliveryCodes(payload));
}, [dispatch, props.route?.params?.fileName]);
    const handleScan = (item) => {
        try {
            const payload = {
                filename: props.route.params.fileName,
                Delivery: item.Delivery,
                Sold_to_Party: item.Sold_to_Party,
                Name_of_Party: item.Name_of_Party
        };
    dispatch(fetchFullRowByMatch(payload)).unwrap().then((data) => {
        console.log("Full row data fetched successfully:", item.Delivery);
        props.navigation.navigate('ProductScan', { fileName: item.Delivery, productName: props.route?.params?.fileName,  nameofParty: item.Name_of_Party });
    }).catch((error) => {
        console.error("Error fetching full row:", error);
    });
} catch (error) {
    console.error("Error in handleScan:", error);
}
}
    // console.log("deliveryCodes ---", deliveryCodes, props.route.params.fileName);
    return (
        <View style={screenStyles.container}>
           <View style={screenStyles.headerContainer}>
                <TouchableOpacity onPress={() => props.navigation.pop()} style={screenStyles.backButton}>
                    <Ionicons name="arrow-back" size={22} />
                </TouchableOpacity>
                <Text style={screenStyles.headerTitle}>Delivery Codes</Text>
            </View>
            <View style={screenStyles.tableContainer}>
                <View style={screenStyles.headerRow}>
                    <Text style={[screenStyles.headerCell, screenStyles.headerText]}>Delivery code</Text>
                    {/* <Text style={[screenStyles.headerCell, screenStyles.headerText]}>Sold to party</Text> */}
                    <Text style={[screenStyles.headerCell, screenStyles.headerText, { flex: 1.2 }]}>Name of party</Text>
                    <Text style={[screenStyles.headerCell, screenStyles.headerText, { flex: 0.6, textAlign: "center" }]}>Scan</Text>
                </View>

                <FlatList
                    data={deliveryCodes.data}
                    keyExtractor={(item, index) => item.Delivery + "-" + index}
                    renderItem={({ item, index }) => (
                        <View style={[screenStyles.row, index % 2 === 0 ? screenStyles.rowEven : screenStyles.rowOdd]}>
                            <Text style={screenStyles.cell}>{item.Delivery}</Text>
                            {/* <Text style={screenStyles.cell}>{item.Sold_to_Party}</Text> */}
                            <Text style={[screenStyles.cell, { flex: 1.2 }]} numberOfLines={1}>
                                {item.Name_of_Party}
                            </Text>

                            <TouchableOpacity onPress={() => handleScan(item)} style={screenStyles.scanButton} activeOpacity={0.7}>
                                <Text style={screenStyles.scanButtonText}>Scan</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                    style={{ width: "95%", flex: 1 }}
                    scrollEnabled={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </View>
        </View>
    );
};

const styles = (screenContext, width, height) => ({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center"
    },
    logo: {
        width: 150,
        height: 150,
        resizeMode: "contain",
        marginTop: 10
    },

    /* table styles */
    tableContainer: {
        flex: 1,
        width: "100%",
        alignItems: "center",
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 6,
        overflow: "hidden",
        backgroundColor: "#fff"
    },
    headerRow: {
        flexDirection: "row",
        width: "95%",
        paddingVertical: 10,
        backgroundColor: "#ddd",
        paddingHorizontal: 8,
        alignSelf: "center"
    },
    headerCell: {
        flex: 0.8,
        fontWeight: "700"
    },
    headerText: {
        color: "#333",
        fontSize: 14
    },
    row: {
        flexDirection: "row",
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee"
    },
    rowEven: {
        backgroundColor: "#fff"
    },
    rowOdd: {
        backgroundColor: "#f6f6f6"
    },
    cell: {
        flex: 0.8,
        fontSize: 13,
        color: "#333",
        paddingRight: 8,
        paddingVertical: 6
    },

    /* scan button */
    scanButton: {
        flex: 0.6,
        height: 36,
        marginLeft: 8,
        backgroundColor: Colors.name.VstarRed,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 10,
        alignSelf: "center"
    },
    scanButtonText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600"
    },
     headerRow: {
        flexDirection: "row",
        width: "95%",
        paddingVertical: 10,
        backgroundColor: "#ddd",
        paddingHorizontal: 8,
        alignSelf: "center"
    },
// ...existing code...
// add these styles
    headerContainer: {
        width: "95%",
        marginTop: 20,
        marginBottom: 10,
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "center"
    },
    backButton: {
        width: 40,
        justifyContent: "center",
        alignItems: "flex-start"
    },
    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 18,
        fontWeight: "700",
        color: "#333"
    },
});

export default DeliveryCodes;
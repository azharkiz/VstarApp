import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    FlatList,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { useDispatch, useSelector } from 'react-redux';
import { setBoxCode, selectOutBound } from '../../services/redux/slice/outBoundSlice';

const PackingSection = (props) => {
    const dispatch = useDispatch();
    const { boxCode, scannedDataByFile, scannedDataByFileNew } = useSelector(selectOutBound);
    const [boxCodeScanned, setBoxCodeScanned] = useState("");
    const screenContext = useScreenContext();
    const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
    const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
    const s = styles(screenContext, width, height);

    useEffect(() => {
        const boxName = props.route.params?.boxName;
        if (!boxName) return;

        const existingBox = boxCode.find(item => item.boxName === boxName);
        if (!existingBox) return;

        if (existingBox.boxCodeNumber !== boxCodeScanned) {
            setBoxCodeScanned(existingBox.boxCodeNumber || "");
        }
    }, [boxCode, props.route.params?.boxName]);

    useEffect(() => {
        const boxName = props.route.params?.boxName;
        if (!boxName) return;
        if (!boxCodeScanned) return;

        const existingBox = boxCode.find(item => item.boxName === boxName);

        // already synced → do nothing
        if (existingBox?.boxCodeNumber === boxCodeScanned) return;

        dispatch(
            setBoxCode({
                boxName,
                boxCodeNumber: boxCodeScanned,
            })
        );
    }, [boxCodeScanned]);

    const handleQRScan = (scannedCode) => {
        if (boxCodeScanned.length == 0) {
            setBoxCodeScanned(scannedCode);
        }
    }
    console.log("current box code params ---:", props.route.params);
    const onScanPress = (file) => {
        props.navigation.navigate('PackingScan', { file: boxCodeScanned, fileName: Object.keys(scannedDataByFileNew)[0], propDrillParams: props.route.params.productDetails.productDetails });
    };

    return (
        <SafeAreaView style={s.container}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
                <View style={s.header}>
                    <Text style={s.title}>Box Scan</Text>
                </View>

                <View style={s.inputRow}>
                    <TextInput
                        placeholder="Barcode"
                        value={boxCodeScanned}
                        style={s.input}
                        placeholderTextColor="#999"
                        onChangeText={(item) => {
                            if (item !== 0) {
                                handleQRScan(item)
                            }
                        }}
                        autoFocus={true}
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity style={s.barcodeBtn}>
                        <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
                    </TouchableOpacity>
                </View>
                <View style={{ flex: 0.2, justifyContent: "flex-start", alignItems: "center" }}>
                    <Text style={s.instructionsText}>{'Box QR code only need to be scanned here'}</Text>
                </View>
                {boxCodeScanned.length > 0 && (
                    <>
                        <View style={{ flex: 0.2, justifyContent: "flex-start", alignItems: "center" }}>
                            <Text style={s.instructionsText}>{`Scanned box is ${boxCodeScanned}`}</Text>
                        </View>

                        <TouchableOpacity style={s.forwardBtn} onPress={onScanPress}>
                            <Ionicons name="arrow-forward" color={Colors.name.white} size={15} />
                            <Text style={s.forwardText}> Move forward</Text>
                        </TouchableOpacity>
                    </>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = (screenContext, width, height) => ({
    container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backButton: { padding: 8 },
    backText: { fontSize: 20 },
    title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },

    logo: { width: 90, height: 90, resizeMode: "contain", alignSelf: "center", marginBottom: 6 },

    inputRow: {
        flexDirection: "row",
        paddingHorizontal: 18,
        alignItems: "flex-end",
        justifyContent: "flex-end",
        flex: 0.3,
    },
    input: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderColor: "#e6e6e6",
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: "#fff",
    },
    barcodeBtn: {
        marginLeft: 10,
        backgroundColor: Colors.name?.VstarRed || "#e31717",
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: "center",
    },
    barcodeBtnText: { color: "#fff", fontWeight: "700" },
    instructionsText: { 
        fontSize: 16, 
        color: Colors.name.black, 
        marginTop: 8, 
        textAlign: "center", 
        alignSelf: "center",
        fontWeight: "bold",
    },

    rescanBtn: {
        marginLeft: 18,
        marginTop: 12,
        backgroundColor: "#f1c40f",
        alignSelf: "flex-start",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        flexDirection: "row",
    },
    rescanText: { color: "#2c2c2c", fontWeight: "600" },

    tableWrap: {
        marginHorizontal: 18,
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#ececec",
        borderRadius: 10,
        overflow: "hidden",
        backgroundColor: "#fff",
    },

    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
        backgroundColor: "#fafafa",
    },

    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },

    cell: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        justifyContent: "center",
    },

    colProduct: { flex: 2 },
    colCenter: { flex: 1, alignItems: "center" },
    colStatus: { width: 72, alignItems: "center" },

    // vertical column divider (left border for columns after Product)
    colDivider: {
        borderLeftWidth: 1,
        borderColor: "#ececec",
    },

    headerText: { fontWeight: "700", color: "#4b5563" },
    cellText: { color: "#111", fontSize: 15 },

    statusText: { fontSize: 18 },

    forwardBtn: {
        backgroundColor: "#155724",
        alignSelf: "flex-end",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 18,
        marginTop: 20,
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: "row",
    },
    forwardText: { color: "#fff", fontWeight: "700" },
});

export default PackingSection;


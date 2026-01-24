import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { useLinkProps } from "@react-navigation/native";

const initialData = [
  { id: "1", title: "Product 1", qty: 100, scanned: 90 },
  { id: "2", title: "Product 2", qty: 50, scanned: 50 },
  { id: "3", title: "Product 3", qty: 150, scanned: 0 },
  { id: "4", title: "Content 4", qty: 20, scanned: 20 },
];

const PackingScan = (props) => {
  const [boxQrcode, setBoxQrcode] = useState("");
  const [itemQrcode, setItemQrcode] = useState("");
  const [data, setData] = useState(initialData);
  const [boxQRtext, setBoxQRtext] = useState("");

  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(screenContext, width, height);

  const handleBoxQRScan = (scannedCode) => {

    if (boxQrcode.length == 0) {
      setBoxQrcode(scannedCode);
      // props.navigation.navigate("PackingSection", { boxCode: scannedCode });
    }



  }


  useEffect(() => {

    return () => {
      setBoxQRtext("");
    };
  }, [boxQRtext]);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          {/* <TouchableOpacity style={s.backButton}>
            <Ionicons name="arrow-back" color={Colors.name.black} size={25} />
          </TouchableOpacity> */}
          <Text style={s.title}>Packing Scan</Text>
        </View>

        <View style={s.inputRow}>

          <TextInput
            placeholder="Box Barcode"
            value={boxQrcode}
            onChangeText={(item) => {
              if (item !== 0) {
                handleBoxQRScan(item)
              }
            }}
            style={s.input}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={s.barcodeBtn}>
            <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
          </TouchableOpacity>
        </View>


      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (screenContext, width, height) => ({
  container: { flex: 1, backgroundColor: "#fff" },

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
    alignItems: "center",
    marginTop: Math.max(12, height * 0.08),
  },
  inputRowSec: {
    flexDirection: "row",
    paddingHorizontal: 18,
    alignItems: "center",
    marginTop: Math.max(12, height * 0.01),
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

  // vertical column divider (left border on middle and right cols)
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

export default PackingScan;
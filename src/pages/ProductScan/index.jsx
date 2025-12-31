import React, { useState } from "react";
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

const initialData = [
  { id: "1", title: "Product 1", qty: 100, scanned: 90, status: "partial" },
  { id: "2", title: "Product 2", qty: 50, scanned: 50, status: "done" },
  { id: "3", title: "Product 3", qty: 150, scanned: 0, status: "pending" },
  { id: "4", title: "Content 4", qty: 20, scanned: 20, status: "done" },
];

const statusIcon = (status) => {
  if (status === "done") return { name: "checkmark-circle", color: "#155724" };
  if (status === "partial") return { name: "checkmark-circle", color: "#f39c12" };
  return { name: "ellipse-outline", color: "#bdc3c7" };
};

const ProductScan = () => {
  const [barcode, setBarcode] = useState("");
  const [data, setData] = useState(initialData);

  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(screenContext, width, height);

  const onRescan = () => {
    // placeholder: implement rescan logic
    setBarcode("");
  };

  const renderRow = ({ item, index }) => {
    const icon = statusIcon(item.status);
    return (
      <View style={[s.tableRow, index === data.length - 1 && { borderBottomWidth: 0 }]}>
        <View style={[s.cell, s.colProduct]}>
          <Text style={s.cellText}>{item.title}</Text>
        </View>

        {/* Qty with left divider */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.qty}</Text>
        </View>

        {/* Scanned Qty with left divider */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.scanned}</Text>
        </View>

        {/* Status with left divider */}
        <View style={[s.cell, s.colStatus, s.colDivider]}>
          <Ionicons name={icon.name} color={icon.color} size={20} />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={s.header}>
          <TouchableOpacity style={s.backButton}>
            <Ionicons name="arrow-back" color={Colors.name.black} size={25} />
          </TouchableOpacity>
          <Text style={s.title}>Product Scan</Text>
        </View>

        <View style={s.inputRow}>
          <TextInput
            placeholder="Barcode"
            value={barcode}
            onChangeText={setBarcode}
            style={s.input}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={s.barcodeBtn}>
            <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.rescanBtn} onPress={onRescan}>
          <Ionicons name="refresh" color={Colors.name.black} size={20} />
          <Text style={s.rescanText}>Re scan</Text>
        </TouchableOpacity>

        <View style={s.tableWrap}>
          <View style={s.tableHeader}>
            <View style={[s.cell, s.colProduct]}>
              <Text style={s.headerText}>Product</Text>
            </View>
            <View style={[s.cell, s.colCenter, s.colDivider]}>
              <Text style={s.headerText}>Qty</Text>
            </View>
            <View style={[s.cell, s.colCenter, s.colDivider]}>
              <Text style={s.headerText}>Scanned Qty</Text>
            </View>
            <View style={[s.cell, s.colStatus, s.colDivider]}>
              <Text style={s.headerText}>Status</Text>
            </View>
          </View>

          <FlatList data={data} keyExtractor={(i) => i.id} renderItem={renderRow} scrollEnabled={false} />
        </View>

        <TouchableOpacity style={s.forwardBtn}>
          <Ionicons name="arrow-forward" color={Colors.name.white} size={15} />
          <Text style={s.forwardText}> Move forward</Text>
        </TouchableOpacity>
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

export default ProductScan;

 
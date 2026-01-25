import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from 'react-redux';
import Ionicons from "react-native-vector-icons/Ionicons";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { useLinkProps } from "@react-navigation/native";
import { selectOutBound, setPackingData, generatePdf } from '../../services/redux/slice/outBoundSlice';
import { normalizeFileName } from "../../services/helper/common";
import { CommonActions } from "@react-navigation/native";

const initialData = [
  { id: "1", title: "Product 1", qty: 100, scanned: 90 },
  { id: "2", title: "Product 2", qty: 50, scanned: 50 },
  { id: "3", title: "Product 3", qty: 150, scanned: 0 },
  { id: "4", title: "Content 4", qty: 20, scanned: 20 },
];

const PackingScan = (props) => {
  const dispatch = useDispatch();
  const { scannedDataByFile, packingDataByFile } = useSelector(selectOutBound);

  const sourceFileName = props.route.params.fileName; // outbound
  const targetFileName = props.route.params.file;     // packing

  const sourceKey = normalizeFileName(sourceFileName);
  const targetKey = normalizeFileName(targetFileName);

  const sourceData = scannedDataByFile[sourceKey] || [];

  const [qrcode, setQrcode] = useState("");
  const [data, setData] = useState(
    packingDataByFile?.[targetKey] || []
  );

  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(screenContext, width, height);

  useEffect(() => {
    setData(packingDataByFile?.[targetKey] || []);
  }, [targetKey]);

  /* ---------------- QR scan logic ---------------- */

  useEffect(() => {
    if (!qrcode) return;

    const [material] = qrcode.split("_");
    if (!material) {
      setQrcode("");
      return;
    }

    // find from outbound file
    const matchedItem = sourceData.find(
      (item) => item.title === material
    );
    if (!matchedItem) {
      setQrcode("");
      return;
    }

    setData((prev) => {
      // check if material already exists in packing table
      const existingIndex = prev.findIndex(
        (item) => item.title === material
      );

      let updated;

      if (existingIndex > -1) {
        // update existing row (increase packed qty)
        updated = prev.map((item, idx) =>
          idx === existingIndex
            ? {
              ...item,
            }
            : item
        );
      } else {
        // ➕ add new row
        updated = [
          ...prev,
          {
            ...matchedItem
          },
        ];
      }

      // sync to redux (SINGLE source of truth)
      setTimeout(() => {
      dispatch(
        setPackingData({
          fileName: targetKey,
          data: updated,
        })
      );
       }, 0);

      return updated;
    });

    setQrcode("");
  }, [qrcode]);

  /* ---------------- rescan ---------------- */

  const onRescan = () => {
    setQrcode("");
    setData([]);
    dispatch(
      setPackingData({
        fileName: targetKey,
        data: [],
      })
    );
  };

  const onScanPress = () => {
    const payload = {
      company: "V-STAR CREATIONS (P) LTD",
      dealer: "AVENUE MARKETING, KANNUR",
      docNo: "19466",
      page: "1 of 1",
      items: [
        {
          box: targetFileName,
          fileName: sourceFileName,
          boxItems: data
        }
      ]
    };
    dispatch(generatePdf(payload)).unwrap().then(() => {
     
      setTimeout(() => {
         setQrcode("");
      setData([]);
      dispatch(
        setPackingData({
          fileName: targetKey,
          data: [],
        })
      );
      
        props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "CreatePacking" }],
          })
        );
      }, 0);
    });
  };
  /* ---------------- render row ---------------- */

  const renderRow = ({ item, index }) => (
    <View
      style={[
        s.tableRow,
        index === data.length - 1 && { borderBottomWidth: 0 },
      ]}
    >
      <View style={[s.cell, s.colProduct]}>
        <Text style={s.cellText}>{item.title}</Text>
      </View>

      <View style={[s.cell, s.colCenter, s.colDivider]}>
        <Text style={s.cellText}>{item.qty}</Text>
      </View>

      <View style={[s.cell, s.colCenter, s.colDivider]}>
        <Text style={s.cellText}>{item.scanned}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <Text style={s.title}>Packing Scan</Text>

        <View style={s.inputRow}>
          <TextInput
            placeholder="Scan Material QR"
            value={qrcode}
            style={s.input}
            onChangeText={setQrcode}
            autoFocus
          />
          <TouchableOpacity style={s.barcodeBtn}>
            <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
          </TouchableOpacity>
        </View>

        {data.length > 0 && (
          <>
            <TouchableOpacity style={s.rescanBtn} onPress={onRescan}>
              <Ionicons name="refresh" size={16} />
              <Text> Re-scan</Text>
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
                  <Text style={s.headerText}>Packed Qty</Text>
                </View>
              </View>

              <FlatList
                data={data}
                keyExtractor={(i) => i.id || i.title}
                renderItem={renderRow}
                scrollEnabled={false}
              />
            </View>
            <TouchableOpacity style={s.forwardBtn} onPress={onScanPress}>
              <Text style={s.forwardText}>Online Submit</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (width, height) => ({
  container: { flex: 1, backgroundColor: "#fff" },

  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
  },

  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginTop: Math.max(12, height * 0.06),
    alignItems: "center",
  },

  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
  },

  barcodeBtn: {
    marginLeft: 10,
    backgroundColor: Colors.name?.VstarRed || "#e11d48",
    padding: 12,
    borderRadius: 8,
  },

  barcodeBtnText: { color: "#fff", fontWeight: "700" },

  rescanBtn: {
    marginLeft: 18,
    marginTop: 12,
    backgroundColor: "#fde047",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignSelf: "flex-start",
  },

  tableWrap: {
    marginHorizontal: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },

  cell: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    justifyContent: "center",
  },

  colDivider: {
    borderLeftWidth: 1,
    borderColor: "#e5e7eb",
  },

  colProduct: { flex: 2 },
  colCenter: { flex: 1, alignItems: "center" },
  colStatus: { width: 72, alignItems: "center" },

  headerText: { fontWeight: "700", color: "#374151" },
  cellText: { color: "#111827" },

  forwardBtn: {
    marginTop: 20,
    marginRight: 18,
    alignSelf: "flex-end",
    backgroundColor: "#166534",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },

  forwardText: { color: "#fff", fontWeight: "700" },
});

export default PackingScan;
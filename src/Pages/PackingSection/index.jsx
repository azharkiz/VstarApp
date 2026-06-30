import React, { useState, useEffect, useRef } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
  setBoxCode,
  selectOutBound,
    setPackingData,
  setBoxList,
} from "../../services/redux/slice/outBoundSlice";
import { normalizeFileName } from "../../services/helper/common";

const PackingSection = (props) => {
  const dispatch = useDispatch();
  const {
    boxCode,
    scannedDataByFile,
    scannedDataByFileNew,
    productScanDetailsRedux,
  } = useSelector(selectOutBound);
  const [boxCodeScanned, setBoxCodeScanned] = useState("");
  const screenContext = useScreenContext();
  const width =
    screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height =
    screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(screenContext, width, height);

  // ...existing code...
  useEffect(() => {
    const boxName = props.route.params?.boxName;
    const fileNameRaw = props.route.params?.productDetails;
    console.log("PackingSection - fileNameRaw:", props.route.params);
    if (!boxName || !fileNameRaw) return;

    const fileKey =
      typeof normalizeFileName === "function"
        ? normalizeFileName(fileNameRaw)
        : fileNameRaw;
    console.log("PackingSection - fileKey:", fileKey);
    const fileEntry = boxCode?.[fileKey];
    if (!fileEntry) return;

    // support both shapes:
    // 1) legacy array: [{ boxName, boxCodeNumber }, ...]
    // 2) object map: { [boxName]: boxCodeNumber } or { [boxName]: { boxCodeNumber } }
    let existingCode;
    if (Array.isArray(fileEntry)) {
      const entry = fileEntry.find((i) => i.boxName === boxName);
      existingCode = entry?.boxCodeNumber;
    } else {
      const value = fileEntry[boxName];
      if (typeof value === "string" || typeof value === "number") {
        existingCode = value;
      } else {
        existingCode = value?.boxCodeNumber;
      }
    }

    if (existingCode == null) return;
    if (String(existingCode) !== String(boxCodeScanned)) {
      setBoxCodeScanned(existingCode || "");
    }
  }, [
    boxCode,
    props.route.params?.boxName,
    props.route.params?.productDetails,
  ]);

  // ...existing code...
  // ...existing code...
  useEffect(() => {
    const boxName = props.route.params?.boxName;
    const fileNameRaw = props.route.params?.productDetails;
    if (!boxName || !fileNameRaw) return;
    if (!boxCodeScanned) return;

    const fileKey =
      typeof normalizeFileName === "function"
        ? normalizeFileName(fileNameRaw)
        : fileNameRaw;

    // fileEntry may be:
    // - legacy array: [{ boxName, boxCodeNumber, fileName }, ...]
    // - current map: { [boxName]: boxCodeNumber } or { [boxName]: { boxCodeNumber } }
    const fileEntry = boxCode?.[fileKey];

    let existingBox = null;

    if (Array.isArray(fileEntry)) {
      existingBox = fileEntry.find(
        (item) => item.boxName === boxName && item.fileName === fileKey,
      );
    } else if (fileEntry && typeof fileEntry === "object") {
      const val = fileEntry[boxName];
      if (val != null) {
        if (typeof val === "string" || typeof val === "number") {
          existingBox = { boxName, boxCodeNumber: val, fileName: fileKey };
        } else {
          existingBox = {
            boxName,
            boxCodeNumber: val.boxCodeNumber ?? val,
            fileName: fileKey,
          };
        }
      }
    } else if (Array.isArray(boxCode)) {
      // final fallback: top-level array shape
      existingBox = boxCode.find(
        (item) => item.boxName === boxName && item.fileName === fileKey,
      );
    }

    // already synced → do nothing
    if (existingBox?.boxCodeNumber === boxCodeScanned) return;

    dispatch(
      setBoxCode({
        fileName: fileKey,
        boxName,
        boxCodeNumber: boxCodeScanned,
      }),
    );
  }, [
    boxCodeScanned,
    props.route.params?.boxName,
    props.route.params?.productDetails,
    boxCode,
    dispatch,
  ]);
  //
  // ...existing code...

  const handleQRScan = (scannedCode) => {
    if (boxCodeScanned.length == 0) {
      setBoxCodeScanned(scannedCode);
    }
  };

  const onScanPress = (file) => {
    const fileNameRaw = props.route.params?.productDetails;
    const fileKey =
      typeof normalizeFileName === "function"
        ? normalizeFileName(fileNameRaw)
        : fileNameRaw;
    props.navigation.navigate("PackingScan", {
      file: boxCodeScanned,
      fileName: fileKey,
      propDrillParams: productScanDetailsRedux?.productDetails?.productDetails,
      boxName: props.route.params?.boxName,
      productDetails: props.route.params?.productDetails,
    });
  };
  const onRescan = () => {
      const fileNameRaw = props.route.params?.productDetails;
    const fileKey =
      typeof normalizeFileName === "function"
        ? normalizeFileName(fileNameRaw)
        : fileNameRaw;
      const targetKey = normalizeFileName(fileKey + boxCodeScanned);
    setBoxCodeScanned("");
    dispatch(
      setBoxCode({
        fileName:  targetKey,
        boxName: props.route.params?.boxName,
        boxCodeNumber: "",
      })
    );
    dispatch(
      setPackingData({
        fileName: targetKey,
        data: [],
      })
    );
    dispatch(
      setBoxList({
        fileName: targetKey,
        data: [],
      })
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={s.header}>
          <Text style={s.title}>Box Scan</Text>
        </View>
        <TouchableOpacity style={s.rescanBtn} onPress={onRescan}>
          <Ionicons name="refresh" size={16} />
          <Text> Re-scan</Text>
        </TouchableOpacity>
        <View style={s.inputRow}>
          <TextInput
            placeholder="Barcode"
            value={boxCodeScanned}
            style={s.input}
            placeholderTextColor="#999"
            onChangeText={(item) => {
              if (item !== 0) {
                handleQRScan(item);
              }
            }}
            autoFocus={true}
            blurOnSubmit={false}
          />
          <TouchableOpacity style={s.barcodeBtn}>
            <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            flex: 0.2,
            justifyContent: "flex-start",
            alignItems: "center",
          }}
        >
          <Text style={s.instructionsText}>
            {"Box QR code only need to be scanned here"}
          </Text>
        </View>
        {boxCodeScanned.length > 0 && (
          <>
            <View
              style={{
                flex: 0.2,
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Text
                style={s.instructionsText}
              >{`Scanned box is ${boxCodeScanned}`}</Text>
            </View>

            <TouchableOpacity style={s.forwardBtn} onPress={onScanPress}>
              <Ionicons
                name="arrow-forward"
                color={Colors.name.white}
                size={15}
              />
              <Text style={s.forwardText}> Move forward</Text>
            </TouchableOpacity>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (screenContext, width, height) => ({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center" },

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

  logo: {
    width: 90,
    height: 90,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 6,
  },

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
});

export default PackingSection;

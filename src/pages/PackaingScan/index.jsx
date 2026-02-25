import React, { useEffect, useState, useRef } from "react";
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
import Sound from "react-native-sound";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import {
  selectOutBound,
  setPackingData,
} from "../../services/redux/slice/outBoundSlice";
import { normalizeFileName } from "../../services/helper/common";

/* ---------------- helpers ---------------- */

const statusIcon = (status) => {
  if (status === "done") return { name: "checkmark-circle", color: "#155724" };
  if (status === "partial")
    return { name: "checkmark-circle", color: "#f39c12" };
  return { name: "ellipse-outline", color: "#bdc3c7" };
};

/* ---------------- component ---------------- */

const PackingScan = (props) => {
  const dispatch = useDispatch();
  const screenContext = useScreenContext();
  const alertShownRef = useRef(false);
  Sound.setCategory("Playback");
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { scannedDataByFile, packingDataByFile, scannedDataByFileNew } =
    useSelector(selectOutBound);

  const sourceFileName = props.route.params.propDrillParams.fileName; // outbound
  const targetFileName = props.route.params.file; // packing

  const sourceKey = normalizeFileName(sourceFileName);
  const targetKey = normalizeFileName(targetFileName);

  const sourceData = scannedDataByFileNew[sourceKey] || [];
  const reduxPackingData = packingDataByFile[targetKey] || [];
  console.log("PackingScan - sourceData:", sourceData);
  console.log("PackingScan - reduxPackingData:", packingDataByFile);
  console.log("PackingScan - params:", props.route.params);

  const [qrcode, setQrcode] = useState("");
  const [packingLocal, setPackingLocal] = useState([]);
  const [blockedMaterials, setBlockedMaterials] = useState([]);

  const width =
    screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height =
    screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(width, height);

  /* ---------------- redux → local sync (SAFE) ---------------- */

  useEffect(() => {
    setPackingLocal(reduxPackingData);
  }, [targetKey]); // 👈 important

  /* ---------------- QR scan logic (SINGLE SOURCE OF TRUTH) ---------------- */
 useEffect(() => {
    soundRef.current = new Sound(
      "beepwarning.mp3", // place file inside ios main bundle / android raw folder
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log("Failed to load sound", error);
          return;
        }
        console.log("Duration:", soundRef.current.getDuration());
      },
    );

    return () => {
      soundRef.current?.release();
    };
  }, []);
  const playSound = () => {
    soundRef.current?.play((success) => {
      if (success) {
        console.log("Finished playing");
      } else {
        console.log("Playback failed");
      }
      setIsPlaying(false);
    });
    setIsPlaying(true);
  };

  const pauseSound = () => {
    soundRef.current?.pause();
    setIsPlaying(false);
  };

  const stopSound = () => {
    soundRef.current?.stop();
    setIsPlaying(false);
  };
  useEffect(() => {
    if (!qrcode || !targetKey) return;

    const parts = qrcode.split("_");
    const material = parts[0]?.trim();
    const scannedQtyRaw = parts[1]?.trim();

    if (!material || !scannedQtyRaw) {
      showAlert("Invalid QR format");
      setQrcode("");
      return;
    }

    if (
      blockedMaterials.includes(material) ||
      packingLocal.some((i) => i.Material === material && i.status === "done")
    ) {
      playSound();
      setTimeout(() => {
        showAlert("Item already completed", true);
      }, 200);
      setQrcode("");
      return;
    }

    const scannedQty = Number(scannedQtyRaw);
    if (Number.isNaN(scannedQty) || scannedQty <= 0) {
      showAlert("Invalid quantity");
      setQrcode("");
      return;
    }

    const matched = sourceData.find((i) => i.Material === material);

    if (!matched) {
      showAlert("Material not found");
      setQrcode("");
      return;
    }

    let updated;
    const index = packingLocal.findIndex((i) => i.Material === material);

    if (index > -1) {
      const existing = packingLocal[index];
      const newPacked = (existing.packed || 0) + scannedQty;

      const status = newPacked >= existing.Scanned_Qty ? "done" : "partial";

      updated = packingLocal.map((item, i) =>
        i === index ? { ...item, packed: newPacked, status } : item,
      );

      if (status === "done") {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    } else {
      const status = scannedQty >= matched.Scanned_Qty ? "done" : "partial";

      updated = [
        ...packingLocal,
        {
          ...matched,
          packed: scannedQty,
          status,
        },
      ];

      if (status === "done") {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    }

    /* ✅ SINGLE UPDATE + SINGLE DISPATCH */
    setPackingLocal(updated);
    dispatch(
      setPackingData({
        fileName: targetKey,
        data: updated,
      }),
    );

    setQrcode("");
  }, [qrcode]);

  /* ---------------- alert ---------------- */

  const showAlert = (title, message = "",stopSound) => {
    if (alertShownRef.current) return;

    alertShownRef.current = true;

    setTimeout(() => {
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            alertShownRef.current = false;
            if (stopSound) stopSound();
          },
        },
      ]);
    }, 100);
  };

  /* ---------------- actions ---------------- */

  const onRescan = () => {
    setQrcode("");
    setPackingLocal([]);
    setBlockedMaterials([]);
    dispatch(
      setPackingData({
        fileName: targetKey,
        data: [],
      }),
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
          boxItems: packingLocal,
        },
      ],
    };
    // dispatch(generatePdf(payload)).unwrap().then(() => {

    //   setTimeout(() => {
    //      setQrcode("");
    //   setData([]);
    //   dispatch(
    //     setPackingData({
    //       fileName: targetKey,
    //       data: [],
    //     })
    //   );

    props.navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "CreatePacking" }],
      }),
    );
    // }, 0);
    // });
  };

  /* ---------------- render row ---------------- */

  const renderRow = ({ item, index }) => {
    const icon = statusIcon(item.status);

    return (
      <View
        style={[
          s.tableRow,
          index === packingLocal.length - 1 && { borderBottomWidth: 0 },
        ]}
      >
        <View style={[s.cell, s.colProduct]}>
          <Text style={s.cellText}>{item.Material}</Text>
        </View>

        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.Scanned_Qty}</Text>
        </View>

        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.packed}</Text>
        </View>

        <View style={[s.cell, s.colStatus, s.colDivider]}>
          <Ionicons name={icon.name} color={icon.color} size={20} />
        </View>
      </View>
    );
  };

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

        {packingLocal.length > 0 && (
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
                  <Text style={s.headerText}>Packed</Text>
                </View>
                <View style={[s.cell, s.colStatus, s.colDivider]}>
                  <Text style={s.headerText}>Status</Text>
                </View>
              </View>

              <FlatList
                data={packingLocal}
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

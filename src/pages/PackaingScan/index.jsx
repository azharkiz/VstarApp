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
  setitemsScannedProduct,
  setBoxList,
  setScannedDataNew,
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

  const {
    scannedDataByFile,
    packingDataByFile,
    scannedDataByFileNew,
    itemsScannedProduct,
  } = useSelector(selectOutBound);
  const sourceFileName = props?.route?.params?.fileName; // outbound
  const targetFileName = props?.route?.params?.file; // packing
  const sourceKey = normalizeFileName(sourceFileName);
  const targetKey = normalizeFileName(sourceFileName + targetFileName);
  const sourceData = scannedDataByFileNew[sourceKey] || [];
  // const reduxPackingData = packingDataByFile[targetKey] || [];
  // console.log("PackingScan: sourceData", packingDataByFile);
  // console.log("scanning Update ---", scannedDataByFileNew);

  const [qrcode, setQrcode] = useState("");
  const [packingLocal, setPackingLocal] = useState([]);
  const [blockedMaterials, setBlockedMaterials] = useState([]);
  const [reduxPackingData, setReduxPackingData] = useState([]);

  const width =
    screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height =
    screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(width, height);

 useEffect(() => {
  const materialTotals = {};

  // Total packed quantity across all packing files
  Object.values(packingDataByFile)
    .flat()
    .forEach((item) => {
      materialTotals[item.Material] =
        (materialTotals[item.Material] || 0) + Number(item.packed || 0);
    });

  // Flatten latest scanned data
  const scannedItems = Object.values(scannedDataByFileNew || {}).flat();

  const updated = (packingDataByFile[targetKey] || []).map((item) => {
    const matchedScan = scannedItems.find(
      (scan) => String(scan.Material) === String(item.Material)
    );

    // Take latest scanned qty if it has changed
    const scannedQty = matchedScan
      ? Number(matchedScan.Scanned_Qty || 0)
      : Number(item.Scanned_Qty || 0);

    const packedQty = materialTotals[item.Material] || 0;

    const remainingQty = Math.max(0, scannedQty - packedQty);

    return {
      ...item,
      Scanned_Qty: scannedQty,
      remainingQty,
      status:
        remainingQty === 0
          ? "done"
          : packedQty > 0
          ? "partial"
          : "",
    };
  });

  setReduxPackingData(updated);

  // Keep blocked materials in sync
  setBlockedMaterials(
    updated
      .filter((item) => item.status === "done")
      .map((item) => item.Material)
  );
}, [packingDataByFile, scannedDataByFileNew, targetKey]);
  /* ---------------- redux → local sync (SAFE) ---------------- */

  useEffect(() => {
    setPackingLocal(reduxPackingData);
  }, [reduxPackingData]); // 👈 important
  /* ---------------- QR scan logic (SINGLE SOURCE OF TRUTH) ---------------- */
  useEffect(() => {
    soundRef.current = new Sound(
      "beepwarning.mp3", // place file inside ios main bundle / android raw folder
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          // console.log("Failed to load sound", error);
          return;
        }
        // console.log("Duration:", soundRef.current.getDuration());
      },
    );

    return () => {
      soundRef.current?.release();
    };
  }, []);
  const playSound = () => {
    soundRef.current?.play((success) => {
      if (success) {
        // console.log("Finished playing");
      } else {
        // console.log("Playback failed");
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

    /* ---------------- validate QR ---------------- */

    if (!material || !scannedQtyRaw) {
      showAlert("Invalid QR format");
      setQrcode("");
      return;
    }

    /* ---------------- already completed ---------------- */

    if (
      blockedMaterials.includes(material) ||
      packingLocal.some((i) => i.Material === material && i.status === "done")
    ) {
      playSound();

      setTimeout(() => {
        showAlert("Item already completed");
      }, 200);

      setQrcode("");
      return;
    }

    /* ---------------- validate quantity ---------------- */

    const scannedQty = Number(scannedQtyRaw);

    if (Number.isNaN(scannedQty) || scannedQty <= 0) {
      showAlert("Invalid quantity");
      setQrcode("");
      return;
    }

    /* ---------------- source material check ---------------- */

    const matched = sourceData.find((i) => i.Material === material);
    console.log("Scanned QR:--", sourceData);
    if (!matched) {
      showAlert("Material not found");
      setQrcode("");
      return;
    }

    /* ---------------- packing logic ---------------- */

    let updated;

    const index = packingLocal.findIndex((i) => i.Material === material);

    if (index > -1) {
      const existing = packingLocal[index];
      const totalPackedQty =
        Object.values(packingDataByFile)
          .flat()
          .filter((item) => String(item.Material) === String(material))
          .reduce((sum, item) => sum + Number(item.packed || 0), 0) +
        Number(scannedQty);
      const remainingQty =
        existing.remainingQty !== undefined
          ? Number(existing.remainingQty)
          : Number(existing.Scanned_Qty) - Number(existing.packed || 0);

      // Already fully packed
      if (remainingQty <= 0) {
        playSound();

        showAlert(
          "Packing completed",
          "No remaining quantity available for this material",
        );

        setQrcode("");
        return;
      }

      // Prevent over packing
      // if (Number(scannedQty) > remainingQty) {
      //   playSound();

      //   showAlert(
      //     "Packed quantity exceeds remaining quantity",
      //     `Remaining quantity: ${remainingQty}`,
      //   );

      //   setQrcode("");
      //   return;
      // }

      const newPacked = Number(existing.packed || 0) + Number(scannedQty);

      const newRemainingQty = Math.max(0, remainingQty - Number(scannedQty));

      const status = newRemainingQty === 0 ? "done" : "partial";

      // console.log("newPacked", newPacked);
      // console.log("newRemainingQty", newRemainingQty);
      // console.log("status", status);

      updated = packingLocal.map((item, i) =>
        i === index
          ? {
              ...item,
              // packed: totalPackedQty,
              packed: newPacked,
              remainingQty: newRemainingQty,
              status,
            }
          : item,
      );

      if (status === "done") {
        setBlockedMaterials((prev) => [...new Set([...prev, material])]);
      }
    } else {
      // First scan
      const allowedQty = Number(matched.Scanned_Qty);

      // if (Number(scannedQty) > allowedQty) {
      //   playSound();

      //   showAlert(
      //     "Packed quantity exceeds scanned quantity",
      //     `Allowed quantity: ${allowedQty}`,
      //   );

      //   setQrcode("");
      //   return;
      // }

      const remainingQty = Math.max(0, allowedQty - Number(scannedQty));

      const status = remainingQty === 0 ? "done" : "partial";

      updated = [
        ...packingLocal,
        {
          ...matched,
          packed: Number(scannedQty),
          packedLocal: Number(scannedQty),
          remainingQty,
          status,
        },
      ];

      if (status === "done") {
        setBlockedMaterials((prev) => [...new Set([...prev, material])]);
      }
    }

    /* ---------------- update packed items redux ---------------- */

    const existingItems = Array.isArray(itemsScannedProduct?.[sourceKey])
      ? itemsScannedProduct[sourceKey]
      : [];

    /* total packed qty for current material */
    // const totalPackedQty =
    //   packingLocal
    //     .filter((item) => item.Material === material)
    //     .reduce((sum, item) => sum + Number(item.packed || 0), 0) + scannedQty;
    const totalPackedQty =
      Object.values(packingDataByFile)
        .flat()
        .filter((item) => String(item.Material) === String(material))
        .reduce((sum, item) => sum + Number(item.packed || 0), 0) +
      Number(scannedQty);

    /* update existing items */
    const updateItemsScanned = existingItems.map((item) => {
      if (item.Material === material) {
        return {
          ...item,
          packed_qty: totalPackedQty,
          Packed_Diff_Qty: Number(item.Scanned_Qty || 0) - totalPackedQty,
        };
      }

      return item;
    });
    /* dispatch */
    dispatch(
      setitemsScannedProduct({
        fileName: sourceKey,
        data: updateItemsScanned,
      }),
    );

    // dispatch(
    //   setitemsScannedProduct(
    //     scannedProductPayload,
    //   ),
    // );

    /* ---------------- update packing redux ---------------- */

    setPackingLocal(updated);

    dispatch(
      setPackingData({
        fileName: targetKey,
        data: updated,
      }),
    );

    /* ---------------- reset input ---------------- */

    setQrcode("");
  }, [qrcode]);
  /* ---------------- alert ---------------- */

  const showAlert = (title, message = "") => {
    if (alertShownRef.current) return;

    alertShownRef.current = true;

    setTimeout(() => {
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            alertShownRef.current = false;
            stopSound();
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
      setBoxList({
        fileName: targetKey,
        data: [],
      }),
    );
  };

  const onScanPress = () => {
    console.log("Navigating to CreatePacking", { ...props.route.params });
    props.navigation.navigate("CreatePacking", {
      ...props.route.params,
    });

    // props.navigation.dispatch(
    //   CommonActions.reset({
    //     index: 0,
    //     routes: [{ name: "CreatePacking" }],
    //   }),
    // );
  };
  const handleDeleteItem = (itemToDelete) => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this packed item?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          // ...existing code...
          onPress: () => {
            // remove from packingLocal (per-targetKey)
            const updated = packingLocal.filter(
              (item) => item.Material !== itemToDelete.Material,
            );
            setPackingLocal(updated);

            setBlockedMaterials((prev) =>
              prev.filter((m) => m !== itemToDelete.Material),
            );

            // persist packing change for this target file
            dispatch(
              setPackingData({
                fileName: targetKey,
                data: updated.length ? updated : null, // remove key if array empty
              }),
            );

            // also remove from scannedDataNew for the source file (compare Material)
            // const existingSource = Array.isArray(
            //   scannedDataByFileNew?.[sourceKey],
            // )
            //   ? scannedDataByFileNew[sourceKey]
            //   : [];

            // const updatedSource = existingSource.filter(
            //   (i) => i.Material !== itemToDelete.Material,
            // );

            // dispatch(
            //   setScannedDataNew({
            //     fileName: sourceKey,
            //     data: updatedSource.length ? updatedSource : null, // delete entry if empty
            //   }),
            // );
            setTimeout(() => {
              props.navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: "AdminTab" }],
                }),
              );
            }, 0);
          },
          // ...existing
        },
      ],
    );
  };
  /* ---------------- render row ---------------- */

  const renderRow = ({ item, index }) => {
    const icon = statusIcon(item.status);

    return (
      <View style={s.tableRow}>
        {/* Product */}
        <View style={[s.cell, s.colProduct]}>
          <Text style={s.cellText}>{item.Material}</Text>
        </View>

        {/* Qty */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>
            {item.remainingQty ?? item.Scanned_Qty}
          </Text>
        </View>

        {/* Packed */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.packed}</Text>
        </View>

        {/* Status */}
        <View style={[s.cell, s.colStatus, s.colDivider]}>
          <Ionicons name={icon.name} color={icon.color} size={20} />
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={s.deleteBtn}
          onPress={() => handleDeleteItem(item)}
        >
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
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

                <View style={s.deleteBtn}>
                  <Text style={s.headerText}>Delete</Text>
                </View>
              </View>

              <FlatList
                data={packingLocal}
                keyExtractor={(i) => i.id || i.title}
                renderItem={renderRow}
                showsVerticalScrollIndicator
              />
            </View>
            <TouchableOpacity style={s.forwardBtn} onPress={onScanPress}>
              <Text style={s.forwardText}>Add to packing list</Text>
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
    height: height * 0.5,
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
  deleteBtn: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderColor: "#e5e7eb",
  },
  forwardText: { color: "#fff", fontWeight: "700" },
});

export default PackingScan;

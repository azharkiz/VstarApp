import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { normalizeFileName } from "../../services/helper/common";
import {
  fetchFileDetails,
  selectOutBound,
  setScannedData,
  resetScannedData,
  saveProductScans,
  setScannedDataNew,
} from "../../services/redux/slice/outBoundSlice";

/* ---------------- helpers ---------------- */

const statusIcon = (status) => {
  if (status === "done") return { name: "checkmark-circle", color: "#155724" };
  if (status === "partial")
    return { name: "checkmark-circle", color: "#f39c12" };
  return { name: "ellipse-outline", color: "#bdc3c7" };
};

/* ---------------- component ---------------- */

const ProductScan = (props) => {
  const dispatch = useDispatch();
  const screenContext = useScreenContext();
  const alertShownRef = useRef(false);
  const fileName = props.route.params?.fileName;

  const {
    details,
    detailsStatus,
    scannedDataByFile,
    scannedDataByFileNew,
    itemsScanning,
    itemsScanningStatus,
    packingDataByFile,
  } = useSelector(selectOutBound);
  console.log("ProductScan - Need tofileName:", itemsScanning);

  const key = normalizeFileName(fileName);
  const productFileName = normalizeFileName(props.route.params?.productName);
  const reduxScannedData = scannedDataByFileNew[key] || [];
  console.log("reduxScannedData", reduxScannedData, fileName);

  const [barcode, setBarcode] = useState("");
  const [scannedDataLocal, setScannedDataLocal] = useState([]);
  const [blockedMaterials, setBlockedMaterials] = useState([]);
  const [showMoveForward, setShowMoveForward] = useState(false);

  const width =
    screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height =
    screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const s = styles(screenContext, width, height);

  /* ---------------- fetch file details ---------------- */

  useEffect(() => {
    if (itemsScanningStatus === "idle" && fileName) {
      dispatch(fetchFileDetails(fileName));
    }
  }, [itemsScanningStatus, fileName, dispatch]);

  /* ---------------- redux → local sync (SAFE, ONE TIME) ---------------- */

  useEffect(() => {
    setScannedDataLocal(reduxScannedData);
  }, [fileName]); // 👈 important: NOT watching reduxScannedData

  /* ---------------- barcode scan logic (SINGLE SOURCE OF TRUTH) ---------------- */
  // ...existing code...
  useEffect(() => {
    if (!barcode || !fileName) return;

    // Block processing while an alert is open
    if (alertShownRef.current) {
      setBarcode("");
      return;
    }

    const parts = barcode.split("_");
    const material = parts[0]?.trim();
    const scannedQtyRaw = parts[1]?.trim();

    if (!material || !scannedQtyRaw) {
      showAlert("Invalid barcode format");
      setBarcode("");
      return;
    }

    const scannedQty = Number(scannedQtyRaw);
    if (Number.isNaN(scannedQty) || scannedQty <= 0) {
      showAlert("Invalid scanned quantity");
      setBarcode("");
      return;
    }

    // Find matching items (used to compute totalQty and check tolerance)
    const matching = Array.isArray(itemsScanning?.data)
      ? itemsScanning.data.filter((i) => i.Material === material)
      : [];

    const totalQty = matching.reduce(
      (sum, item) => sum + Number(item.Delivery_Quantity || 0),
      0,
    );

    // If any matching item has Tolerance === '*' allow over-scans
    const toleranceStar = matching.some((i) => String(i.Tolerance) === "*");

    // Block if item is already completed (unless tolerance is '*')
    if (
      blockedMaterials.includes(material) ||
      (scannedDataLocal.some(
        (i) => i.Material === material && i.status === "done",
      ) &&
        !toleranceStar)
    ) {
      showAlert("Item already completed", "This item is fully scanned");
      setBarcode("");
      return;
    }

    let updated;
    const index = scannedDataLocal.findIndex((i) => i.Material === material);

    if (index > -1) {
      const existing = scannedDataLocal[index];
      const newScanned = existing.Scanned_Qty + scannedQty;

      // BLOCK: prevent adding a scan that would push total beyond allowed when no tolerance star
      if (!toleranceStar && newScanned > existing.qty) {
        showAlert(
          "Scanned quantity exceeds allowed quantity",
          `Remaining quantity: ${Math.max(
            0,
            existing.qty - existing.Scanned_Qty,
          )}`,
        );
        setBarcode("");
        return;
      }

      // If tolerance is '*', don't block further scanning — still show a sensible status
      const status =
        newScanned >= existing.qty && !toleranceStar ? "done" : "partial";

      updated = scannedDataLocal.map((item, i) =>
        i === index ? { ...item, Scanned_Qty: newScanned, status } : item,
      );

      if (status === "done" && !toleranceStar) {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    } else {
      // BLOCK: prevent initial scan that already exceeds totalQty when no tolerance star
      if (!toleranceStar && scannedQty > totalQty) {
        showAlert(
          "Scanned quantity exceeds allowed quantity",
          `Total required: ${totalQty}`,
        );
        setBarcode("");
        return;
      }

      const status =
        scannedQty >= totalQty && !toleranceStar ? "done" : "partial";

      updated = [
        ...scannedDataLocal,
        {
          id: Math.random().toString(36).slice(2),
          Material: material,
          qty: totalQty,
          Scanned_Qty: scannedQty,
          Item_Description: matching[0]?.Item_Description || "",
          status,
        },
      ];

      if (status === "done" && !toleranceStar) {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    }

    /* ✅ SINGLE UPDATE + SINGLE DISPATCH */
    setScannedDataLocal(updated);
    dispatch(
      // setScannedData({
      //   fileName,
      //   data: updated,
      // })
      setScannedDataNew({
        fileName,
        data: updated,
      }),
    );

    setBarcode("");
  }, [barcode]); // 👈 ONLY barcode triggers this
  // ...existing code...

  // useEffect(() => {
  //   if (!barcode || !fileName) return;

  //   const parts = barcode.split("_");
  //   const material = parts[0]?.trim();
  //   const scannedQtyRaw = parts[1]?.trim();

  //   if (!material || !scannedQtyRaw) {
  //     showAlert("Invalid barcode format");
  //     setBarcode("");
  //     return;
  //   }

  //   if (
  //     blockedMaterials.includes(material) ||
  //     scannedDataLocal.some(
  //       (i) => i.title === material && i.status === "done"
  //     )
  //   ) {
  //     showAlert("Item already completed", "This item is fully scanned");
  //     setBarcode("");
  //     return;
  //   }

  //   const scannedQty = Number(scannedQtyRaw);
  //   if (Number.isNaN(scannedQty) || scannedQty <= 0) {
  //     showAlert("Invalid scanned quantity");
  //     setBarcode("");
  //     return;
  //   }

  //   const matching = Array.isArray(itemsScanning?.data)
  //     ? itemsScanning.data.filter((i) => i.Material === material)
  //     : [];

  //   const totalQty = matching.reduce(
  //     (sum, item) => sum + Number(item.Delivery_Quantity || 0),
  //     0
  //   );

  //   let updated;
  //   const index = scannedDataLocal.findIndex(
  //     (i) => i.title === material
  //   );

  //   if (index > -1) {
  //     const existing = scannedDataLocal[index];
  //     const newScanned = existing.scanned + scannedQty;

  //     const status =
  //       newScanned >= existing.qty
  //         ? "done"
  //         : "partial";

  //     updated = scannedDataLocal.map((item, i) =>
  //       i === index
  //         ? { ...item, scanned: newScanned, status }
  //         : item
  //     );

  //     if (status === "done") {
  //       setBlockedMaterials((p) => [...new Set([...p, material])]);
  //     }
  //   } else {
  //     const status =
  //       scannedQty >= totalQty ? "done" : "partial";

  //     updated = [
  //       ...scannedDataLocal,
  //       {
  //         id: Math.random().toString(36).slice(2),
  //         title: material,
  //         qty: totalQty,
  //         scanned: scannedQty,
  //         status,
  //       },
  //     ];

  //     if (status === "done") {
  //       setBlockedMaterials((p) => [...new Set([...p, material])]);
  //     }
  //   }

  //   /* ✅ SINGLE UPDATE + SINGLE DISPATCH */
  //   setScannedDataLocal(updated);
  //   dispatch(
  //     // setScannedData({
  //     //   fileName,
  //     //   data: updated,
  //     // })
  //     setScannedDataNew({
  //       fileName,
  //       data: updated,
  //     })
  //   );

  //   setBarcode("");
  // }, [barcode]); // 👈 ONLY barcode triggers this

  const showAlert = (title, message = "") => {
    if (alertShownRef.current) return;

    alertShownRef.current = true;

    setTimeout(() => {
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            alertShownRef.current = false;
          },
        },
      ]);
    }, 100);
  };

  /* ---------------- actions ---------------- */

  const onRescan = () => {
    setBarcode("");
    setScannedDataLocal([]);
    setBlockedMaterials([]);
     dispatch(
    setScannedDataNew({
      fileName: key,
      data: [],
    }),
  );
  };

  /* ---------------- render ---------------- */
  const onScanPress = () => {
    props.navigation.navigate("CreatePacking", {
      productDetails: props.route.params,
    });
  };
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };
  const onlineSubmitApi = async () => {
    const scannedMap = scannedDataLocal.reduce((acc, item) => {
      acc[item.Material] = item.Scanned_Qty;
      return acc;
    }, {});
    const updatedData = itemsScanning.data
      .filter((item) => scannedMap[item.Material] != null)
      .map((item) => ({
        ...item,
        Scanned_Qty: scannedMap[item.Material],
      }));
    const BATCH_SIZE = 50;
    const chunks = chunkArray(updatedData, BATCH_SIZE);
    console.log("ProductScan - key:", key);

    for (let i = 0; i < chunks.length; i++) {
      const payload = {
        filename: productFileName,
        status: "true",
        data: chunks[i],
      };
      console.log("payload ----", payload);
      await dispatch(saveProductScans(payload))
        .unwrap()
        .then(() => {
          // waits for API response
          setShowMoveForward(true);
        });
    }
  };

  const renderRow = ({ item, index }) => {
    const icon = statusIcon(item.status);

    return (
      <View
        style={[
          s.tableRow,
          index === scannedDataLocal.length - 1 && { borderBottomWidth: 0 },
        ]}
      >
        <View style={[s.cell, s.colProduct]}>
          <Text style={s.cellText}>{item.Material}</Text>
        </View>

        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.qty}</Text>
        </View>

        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.Scanned_Qty}</Text>
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Text style={s.title}>Product Scan</Text>

        <View style={s.inputRow}>
          <TextInput
            placeholder="Barcode"
            value={barcode}
            style={s.input}
            onChangeText={setBarcode}
            autoFocus
          />
          <TouchableOpacity style={s.barcodeBtn}>
            <Text style={s.barcodeBtnText}>▮▮▮▮▮▮▮</Text>
          </TouchableOpacity>
        </View>

        {scannedDataLocal.length > 0 && (
          <>
            <TouchableOpacity style={s.rescanBtn} onPress={onRescan}>
              <Ionicons name="refresh" size={16} />
              <Text> {"Re-scan"}</Text>
            </TouchableOpacity>
            <ScrollView>
              <View style={s.tableWrap}>
                {/* HEADER */}
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

                {/* BODY */}
                <FlatList
                  data={scannedDataLocal}
                  keyExtractor={(i) => i.id}
                  renderItem={renderRow}
                  scrollEnabled
                />
              </View>
            </ScrollView>
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <TouchableOpacity
                style={[s.forwardBtn, { backgroundColor: "#166534" }]}
                onPress={onlineSubmitApi}
              >
                <Text style={s.forwardText}>{"Online submit"}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.forwardBtn,
                  {
                    backgroundColor:
                      showMoveForward ||
                      Object.keys(packingDataByFile || {}).length > 0
                        ? "#166534"
                        : "#e5e7eb",
                  },
                ]}
                onPress={
                  showMoveForward ||
                  Object.keys(packingDataByFile || {}).length > 0
                    ? onScanPress
                    : undefined
                }
              >
                <Text style={s.forwardText}>{"Move forward"}</Text>{" "}
              </TouchableOpacity>{" "}
            </View>{" "}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
/* ---------------- styles ---------------- */

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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },

  forwardText: { color: "#fff", fontWeight: "700" },
});

export default ProductScan;

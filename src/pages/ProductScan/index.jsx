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
} from "react-native";
import Sound from "react-native-sound";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import { normalizeFileName } from "../../services/helper/common";

import {
  fetchFileDetails,
  selectOutBound,
  saveProductScans,
  setScannedDataNew,
  localProduct,
  setProductSaved,
  setitemsScannedProduct,
  setProductScanDetails,
  setBoxList,
  setPackingData,
  setBoxCode,
} from "../../services/redux/slice/outBoundSlice";

/* ---------------- helpers ---------------- */

const statusIcon = (status) => {
  if (status === "done") {
    return {
      name: "checkmark-circle",
      color: "#155724",
    };
  }

  if (status === "partial") {
    return {
      name: "checkmark-circle",
      color: "#f39c12",
    };
  }

  return {
    name: "ellipse-outline",
    color: "#bdc3c7",
  };
};

Sound.setCategory("Playback");

/* ---------------- component ---------------- */

const ProductScan = (props) => {
  const dispatch = useDispatch();
  const screenContext = useScreenContext();

  const alertShownRef = useRef(false);
  const soundRef = useRef(null);

  const fileName = props.route.params?.fileName;

  const {
    scannedDataByFileNew,
    itemsScanning,
    itemsScanningStatus,
    productSavedSatus,
    packingDataByFile,
    itemsScannedProduct,
  } = useSelector(selectOutBound);
  const key = normalizeFileName(fileName);
  console.log("itemsScanning -:", itemsScanning);
  console.log("scannedDataByFileNew -:", itemsScannedProduct[key]);

  const productFileName = normalizeFileName(props.route.params?.productName);

  const reduxScannedData = scannedDataByFileNew[key] || [];

  const [barcode, setBarcode] = useState("");
  const [scannedDataLocal, setScannedDataLocal] = useState([]);
  const [blockedMaterials, setBlockedMaterials] = useState([]);

  const width =
    screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];

  const height =
    screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];

  const s = styles(width, height);

  /* ---------------- fetch file details ---------------- */

  useEffect(() => {
    if (itemsScanningStatus === "idle" && fileName) {
      dispatch(fetchFileDetails(fileName));
    }
  }, [itemsScanningStatus, fileName, dispatch]);

  /* ---------------- redux sync ---------------- */

  useEffect(() => {
    setScannedDataLocal(reduxScannedData);
  }, [fileName]);

  useEffect(() => {
    dispatch(localProduct(props.route.params));
  }, []);

  /* ---------------- sound setup ---------------- */

  useEffect(() => {
    soundRef.current = new Sound(
      "beepwarning.mp3",
      Sound.MAIN_BUNDLE,
      (error) => {
        if (error) {
          console.log("Sound load error", error);
        }
      },
    );

    return () => {
      soundRef.current?.release();
    };
  }, []);

  const playSound = () => {
    soundRef.current?.play();
  };

  const stopSound = () => {
    soundRef.current?.stop();
  };

  /* ---------------- alert ---------------- */

  const showAlert = (title, message = "") => {
    if (alertShownRef.current) return;

    alertShownRef.current = true;

    Alert.alert(title, message, [
      {
        text: "OK",
        onPress: () => {
          alertShownRef.current = false;
          stopSound();
        },
      },
    ]);
  };

  /* ---------------- barcode scan logic ---------------- */

  useEffect(() => {
    if (!barcode || !fileName) return;

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

    const matching = Array.isArray(itemsScanning?.data)
      ? itemsScanning.data.filter((i) => i.Material === material)
      : [];

    const totalQty = matching.reduce(
      (sum, item) => sum + Number(item.Delivery_Quantity || 0),
      0,
    );

    const toleranceStar = matching.some((i) => String(i.Tolerance) === "X");

    if (
      blockedMaterials.includes(material) ||
      (scannedDataLocal.some(
        (i) => i.Material === material && i.status === "done",
      ) &&
        !toleranceStar)
    ) {
      playSound();

      showAlert("Item already completed", "This item is fully scanned");

      setBarcode("");
      return;
    }

    let updated = [];

    const index = scannedDataLocal.findIndex((i) => i.Material === material);

    if (index > -1) {
      const existing = scannedDataLocal[index];

      const newScanned = existing.Scanned_Qty + scannedQty;

      if (!toleranceStar && newScanned > existing.qty) {
        playSound();

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

      const status =
        newScanned >= existing.qty && !toleranceStar ? "done" : "partial";

      updated = scannedDataLocal.map((item, i) =>
        i === index
          ? {
              ...item,
              Scanned_Qty: newScanned,
              status,
            }
          : item,
      );

      if (status === "done" && !toleranceStar) {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    } else {
      if (!toleranceStar && scannedQty > totalQty) {
        playSound();

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
          Product: matching[0]?.Product,
          status,
        },
      ];

      if (status === "done" && !toleranceStar) {
        setBlockedMaterials((p) => [...new Set([...p, material])]);
      }
    }

    setScannedDataLocal(updated);

    dispatch(
      setScannedDataNew({
        fileName,
        data: updated,
      }),
    );

    setBarcode("");
  }, [barcode]);

  /* ---------------- delete item ---------------- */

  const handleDeleteItem = (itemToDelete) => {
    const dataUpdateSource =
      itemsScannedProduct[key]?.length > 0
        ? itemsScannedProduct[key]
        : itemsScanning?.data;
    Alert.alert("Delete Item", "Are you sure you want to delete this scan?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",

        onPress: () => {
          const updated = scannedDataLocal.filter(
            (item) => item.id !== itemToDelete.id,
          );

          const updatedSource = dataUpdateSource.map((item) => {
            if (item.Material === itemToDelete.Material) {
              return {
                ...item,
                Scanned_Qty: 0,
                Diff_Qty: 0,
                packed_qty: 0,
                Packed_Diff_Qty: 0, // optional if you also want to reset this
              };
            }

            return item;
          });
          const delivery = itemsScanning?.data[0]?.Delivery;
          const scannedProductPayload = {
            data: updatedSource,
            fileName: delivery,
          };
          dispatch(setitemsScannedProduct(scannedProductPayload));
          // find which file key (eg "BX-002") contains this item
          const fileEntries = packingDataByFile || {};
          let targetFileKey = null;
          for (const [fKey, arr] of Object.entries(fileEntries)) {
            if (
              Array.isArray(arr) &&
              arr.some((i) => i.id === itemToDelete.id)
            ) {
              targetFileKey = fKey;
              break;
            }
          }

          // remove item from that file's array (fallback to empty array)
          const updatedPackingData = targetFileKey
            ? (fileEntries[targetFileKey] || []).filter(
                (i) => i.id !== itemToDelete.id,
              )
            : [];
          setScannedDataLocal(updated);

          setBlockedMaterials((prev) =>
            prev.filter((m) => m !== itemToDelete.Material),
          );

          dispatch(
            setScannedDataNew({
              fileName,
              data: updated,
            }),
          );
          // save back to redux under the right file key; if not found, optionally save under current key
          if (targetFileKey) {
            dispatch(
              setPackingData({
                fileName: targetFileKey,
                data: updatedPackingData,
              }),
            );
          } else {
            // fallback: use current normalized key if that makes sense for your flow
            dispatch(
              setPackingData({
                fileName: key,
                data: updatedPackingData,
              }),
            );
          }
        },
      },
    ]);
  };

  /* ---------------- rescan ---------------- */

  const onRescan = () => {
    setBarcode("");
    setScannedDataLocal([]);
    setBlockedMaterials([]);
    console.log("Rescanning...", key);
    dispatch(
      setScannedDataNew({
        fileName: key,
        data: null,
      }),
    );

    dispatch(
      setBoxList({
        fileName: key,
        data: null,
      }),
    );
    dispatch(
      setBoxCode({
        fileName: key,
        remove: true,
      }),
    );
    dispatch(
      setPackingData({
        fileName: key,
        data: null,
      }),
    );

    dispatch(setProductSaved(false));
  };

  /* ---------------- submit ---------------- */

  const onlineSubmitApi = async () => {
    const scannedMap = scannedDataLocal.reduce((acc, item) => {
      acc[item.Material] = item.Scanned_Qty;
      return acc;
    }, {});

    const dataUpdateSource =
      itemsScannedProduct[key]?.length > 0
        ? itemsScannedProduct[key]
        : itemsScanning?.data;
    const updatedData = dataUpdateSource.map((item) => {
      if (scannedMap[item.Material] != null) {
        return {
          ...item,
          Scanned_Qty: scannedMap[item.Material],
        };
      }

      return item;
    });

    const payload = {
      filename: productFileName,
      status: "true",
      data: updatedData,
    };
    const delivery = itemsScanning?.data[0].Delivery;
    const scannedProductPayload = {
      data: updatedData,
      fileName: delivery,
    };
    console.log("scannedProductPayload ----", payload);
    dispatch(setitemsScannedProduct(scannedProductPayload));
    await dispatch(saveProductScans(payload))
      .unwrap()
      .then(() => {
        dispatch(setProductSaved(true));
      });
  };

  /* ---------------- move forward ---------------- */

  // ...existing code...
  const onScanPress = async () => {
    const action = dispatch(
      setProductScanDetails({
        productDetails: props.route.params,
        productName: productFileName,
      }),
    );

    if (typeof action?.unwrap === "function") {
      try {
        await action.unwrap();
      } catch (err) {
        console.warn("setProductScanDetails failed:", err);
        return;
      }
    }

    props.navigation.navigate("CreatePacking", {
      productDetails: props.route.params,
      productName: productFileName,
    });
  };

  /* ---------------- render row ---------------- */
  console.log("scannedProduct local ----", scannedDataLocal);
  const renderRow = ({ item }) => {
    const icon = statusIcon(item.status);

    return (
      <View style={s.tableRow}>
        {/* Product */}
        <View style={[s.cell, s.colProduct]}>
          <Text style={s.cellText}>{item.Material}</Text>
        </View>

        {/* Qty */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.qty}</Text>
        </View>

        {/* Scanned Qty */}
        <View style={[s.cell, s.colCenter, s.colDivider]}>
          <Text style={s.cellText}>{item.Scanned_Qty}</Text>
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

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <Text style={s.title}>Product Scan</Text>

        {/* Input */}
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

        {/* Table */}
        {scannedDataLocal.length > 0 && (
          <>
            <TouchableOpacity style={s.rescanBtn} onPress={onRescan}>
              <Ionicons name="refresh" size={16} />

              <Text> Re-scan</Text>
            </TouchableOpacity>

            <View style={s.tableWrap}>
              {/* Header */}
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

                <View style={s.deleteBtn}>
                  <Text style={s.headerText}>Delete</Text>
                </View>
              </View>

              {/* Body */}
              <FlatList
                data={scannedDataLocal}
                keyExtractor={(i) => i.id}
                renderItem={renderRow}
              />
            </View>

            {/* Buttons */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <TouchableOpacity
                style={[
                  s.forwardBtn,
                  {
                    backgroundColor: "#166534",
                  },
                ]}
                onPress={onlineSubmitApi}
              >
                <Text style={s.forwardText}>Online submit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  s.forwardBtn,
                  {
                    backgroundColor:
                      itemsScannedProduct[key]?.length > 0
                        ? "#166534"
                        : "#e5e7eb",
                  },
                ]}
                onPress={
                  itemsScannedProduct[key]?.length > 0 ? onScanPress : undefined
                }
              >
                <Text style={s.forwardText}>Move forward</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------------- styles ---------------- */

const styles = (width, height) => ({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

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

  barcodeBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

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
    height: height * 0.55,
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

  colProduct: {
    flex: 2,
  },

  colCenter: {
    flex: 1,
    alignItems: "center",
  },

  colStatus: {
    width: 72,
    alignItems: "center",
  },

  deleteBtn: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    borderLeftWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerText: {
    fontWeight: "700",
    color: "#374151",
  },

  cellText: {
    color: "#111827",
  },

  forwardBtn: {
    marginTop: 20,
    marginRight: 18,
    alignSelf: "flex-end",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },

  forwardText: {
    color: "#fff",
    fontWeight: "700",
  },
});

export default ProductScan;

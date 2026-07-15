import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useDispatch, useSelector } from "react-redux";
import { useScreenContext } from "../../services/Context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Colors } from "../../thems/Colors";
import {
  setBoxList,
  selectOutBound,
  generatePdf,
  setPackingData,
  resetOutBoundState,
  submitProductPacked,
  setProductScanDetails
} from "../../services/redux/slice/outBoundSlice";
import { normalizeFileName } from "../../services/helper/common";

const CreatePacking = (props) => {
  const dispatch = useDispatch();

  const {
    BoxList,
    packingDataByFile,
    deliveryCodes,
    localProductDetails,
    itemsScannedProduct,
  } = useSelector(selectOutBound);

  const [showModal, setShowModal] = useState(false);
  const [boxName, setBoxName] = useState("");
  const fileName = props.route.params?.productDetails?.fileName === undefined ? props.route.params?.fileName :props.route.params?.productDetails?.fileName;
  const fileNameFromParams = props.route.params?.propDrillParams?.fileName;
  const rawFileName = fileName ?? fileNameFromParams;
  const key = normalizeFileName(rawFileName);
  const productFileName = normalizeFileName(props.route.params?.productName);
const boxes = React.useMemo(() => {
  if (!BoxList || Array.isArray(BoxList)) return [];
  return BoxList[key] || [];
}, [BoxList, key]); 

 const handleAddBox = () => {
  const name = boxName.trim();

  if (!name) return;

  if (
    boxes.some(
      box => box.label.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    Alert.alert("Duplicate box", "A box with this name already exists.");
    return;
  }

  const updatedBoxes = [
    ...boxes,
    {
      id: Date.now().toString(),
      label: name,
    },
  ];

  dispatch(
    setBoxList({
      fileName: key,
      data: updatedBoxes,
    }),
  );

  setBoxName("");
  setShowModal(false);
};



  const handleBoxPress = React.useCallback(async (box) => {
    // Navigate to the box details screen or perform any action
  const action = dispatch(
      setProductScanDetails({
        productDetails: props.route.params,
        productName: productFileName,
        boxName: box.label,
      }),
    );

    // If this is an asyncThunk, unwrap() will be available and return a promise.
    if (typeof action?.unwrap === "function") {
      try {
        await action.unwrap();
      } catch (err) {
        // optional: handle error (log/show Alert) then return or continue
        console.warn("setProductScanDetails failed:", err);
      }
    }

    // Navigate after dispatch (or regardless if unwrap not available)
     const productDetailsParam = props.route.params?.productDetails;
 
  const resolvedFileName =
    productDetailsParam?.fileName ??
    productDetailsParam?.productDetails?.fileName ??
    productDetailsParam??
    // props.route.params?.propDrillParams?.fileName ??
    "";
  
    props.navigation.navigate("PackingSection", {
      boxName: box.label,
      productDetails: resolvedFileName,
    });
  }, [dispatch, props.route.params, productFileName]);
const onScanPress = React.useCallback(async () => {
  const baseKey = normalizeFileName(localProductDetails?.fileName || "");
  // produce an object like { DED0116059BX-002: [...], ... } keeping arrays intact
  const items = Object.fromEntries(
    Object.entries(packingDataByFile || {}).filter(([k]) =>
      String(k).startsWith(baseKey)
    ),
  );
const modifiedItems = Object.fromEntries(
  Object.entries(items).map(([key, value]) => {
    const newKey = String(key)
      .trim()
      .replace(/^([A-Za-z]+\d+)([A-Za-z].*)$/, "$1#$2");

    return [newKey, value];
  })
);
  // console.log("items", JSON.xstringify(modifiedItems));
    const payload = {
      company: "V-STAR CREATIONS (P) LTD",
      dealer: localProductDetails.nameofParty,
      docNo: localProductDetails.fileName,
      page: "1 of 1",
      items: [modifiedItems]
    };
    //  let dataSubmit = {
    //     // ...itemsScannedProduct,
    //     [localProductDetails?.fileName]: itemsScannedProduct?.[localProductDetails?.fileName],
    //   };
    const packedProductPayload = {
      filename: localProductDetails.productName,
      status: "true",
      data: itemsScannedProduct?.[localProductDetails?.fileName],
    };
    console.log("payload", payload);
    console.log("packedProductPayload", packedProductPayload);
    dispatch(generatePdf(payload))
      .unwrap()
      .then((res) => {
        setTimeout(() => {
          //  dispatch(resetOutBoundState());
          dispatch(submitProductPacked(packedProductPayload));
          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: "AdminTab" }],
            }),
          );
        }, 0);
      });
 }, [
    dispatch,
    packingDataByFile,
    localProductDetails,
    itemsScannedProduct,
]);
 const renderItem = React.useCallback(
  ({ item }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => handleBoxPress(item)}
    >
      <Text style={styles.rowText}>{item.label}</Text>
      <Ionicons name="arrow-forward" size={20} color="#444" />
    </TouchableOpacity>
  ),
  [handleBoxPress],
);
 const baseKey = normalizeFileName(localProductDetails?.fileName || "");
  const entries = Object.entries(packingDataByFile || {}).filter(([k]) =>
    String(k).startsWith(baseKey),
  );
  const dataScanned = Object.fromEntries(entries);

  // Option A: first matching key length
// safer access + handle array-like objects
const firstMatchKey = entries[0]?.[0];
const firstValue = firstMatchKey ? dataScanned[firstMatchKey] : undefined;

const firstMatchLength = entries.length // array-like (has length)
console.log("firstMatchLength ----");
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => props.navigation.pop()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity> */}

        <Text style={styles.title}>Create Packing</Text>

        <TouchableOpacity
          onPress={() => setShowModal(true)}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={26} />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Table */}
      <View style={styles.card}>
        <FlatList
          data={boxes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
        />
      </View>
      {firstMatchLength >=1 && (
        <TouchableOpacity style={styles.forwardBtn} onPress={onScanPress}>
          <Text style={styles.forwardText}>Online Submit</Text>
        </TouchableOpacity>
      )}

      {/* 🔹 Add Box Popup */}
      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Box</Text>

            <TextInput
              placeholder="Enter box name"
              value={boxName}
              onChangeText={setBoxName}
              style={styles.input}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setBoxName("");
                  setShowModal(false);
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddBox}>
                <Text style={styles.saveText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },

  addBtn: { alignItems: "center" },
  addText: { fontSize: 12, marginTop: -4 },

  card: {
    marginHorizontal: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
  },

  rowText: { fontSize: 16 },

  divider: { height: 1, backgroundColor: "#e5e7eb" },

  /* 🔹 Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },

  cancelBtn: { marginRight: 12 },
  cancelText: { color: "#6b7280", fontWeight: "600" },

  saveBtn: {
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: { color: "#fff", fontWeight: "600" },
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

export default CreatePacking;

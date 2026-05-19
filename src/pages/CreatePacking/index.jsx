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
import { useDispatch, useSelector } from 'react-redux';
import { useScreenContext } from "../../services/Context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { Colors } from "../../thems/Colors";
import { setBoxList, selectOutBound, generatePdf, setPackingData, resetOutBoundState } from '../../services/redux/slice/outBoundSlice';

const CreatePacking = (props) => {

  const dispatch = useDispatch();

  const { BoxList, packingDataByFile, deliveryCodes, localProductDetails } = useSelector(selectOutBound);
  const [boxes, setBoxes] = useState(BoxList);
  const [showModal, setShowModal] = useState(false);
  const [boxName, setBoxName] = useState("");

const handleAddBox = () => {
  const name = boxName.trim();
  if (!name) return;

  // prevent duplicates (case-insensitive)
  if ((boxes || []).some((b) => (b.label || "").trim().toLowerCase() === name.toLowerCase())) {
    Alert.alert("Duplicate box", "A box with this name already exists.");
    return;
  }

  setBoxes((prev) => [
    ...prev,
    {
      id: Date.now().toString(),
      label: name,
    },
  ]);

  setBoxName("");
  setShowModal(false);
};

   useEffect(() => {
    // avoid dispatching when redux already equals local to prevent infinite update loop
    try {
      const localStr = JSON.stringify(boxes || []);
      const reduxStr = JSON.stringify(BoxList || []);
      if (localStr !== reduxStr) {
        dispatch(setBoxList(boxes));
      }
    } catch (e) {
      // fallback: if serialization fails, still dispatch once
      dispatch(setBoxList(boxes));
    }
  }, [boxes, BoxList, dispatch]);

  const handleBoxPress = (box) => {
    // Navigate to the box details screen or perform any action
    props.navigation.navigate('PackingSection', { boxName: box.label, productDetails: props.route.params });

  };
  const onScanPress = () => {
    const payload = {
      company: "V-STAR CREATIONS (P) LTD",
      dealer: localProductDetails.nameofParty,
      docNo: localProductDetails.fileName,
      page: "1 of 1",
      items: [packingDataByFile]
    };
    console.log("terrt ---", payload);
    dispatch(generatePdf(payload)).unwrap().then((res) => {
      console.log("terrt ---", res);
     
      setTimeout(() => {
      //   dispatch(
      //     setPackingData({
      //       fileName: "",
      //       data: [],
      //     })
      // );
       dispatch(resetOutBoundState());
        props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "AdminTab" }],
          })
        );
      }, 0);
    });
  };
  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.row} onPress={() => handleBoxPress(item)}>
      <Text style={styles.rowText}>{item.label}</Text>
      <Ionicons name="arrow-forward" size={20} color="#444" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity onPress={() => props.navigation.pop()}>
          <Ionicons name="arrow-back" size={22} />
        </TouchableOpacity> */}

        <Text style={styles.title}>Create Packing</Text>

        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
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
    {Object.keys(packingDataByFile || {}).length > 0 && (
        <TouchableOpacity style={styles.forwardBtn} onPress={onScanPress}>
          <Text style={styles.forwardText}>Online Submit</Text>
        </TouchableOpacity>)}

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

// ...existing code...
import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";

const boxes = [
  { id: "1", title: "Box 1" },
  { id: "2", title: "Box 2" },
  { id: "3", title: "Box 3" },
  { id: "4", title: "Box 4" },
];

const CreatePacking = ({ navigation }) => {
  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const s = styles(screenContext, width);

  const onAdd = () => {
    // TODO: open add modal / navigate to add screen
  };

  const onOpenBox = (item) => {
    // TODO: navigate to box detail
    // navigation?.navigate('BoxDetail', { id: item.id });
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onOpenBox(item)}
      style={[s.row, index === boxes.length - 1 && { borderBottomWidth: 0 }]}
    >
      <Text style={s.rowText}>{item.title}</Text>
      <Ionicons name="arrow-forward" size={20} color={Colors.name?.black || "#111"} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={s.headerLeft}>
          <Ionicons name="arrow-back" size={24} color={Colors.name?.black || "#111"} />
        </TouchableOpacity>

        <Text style={s.title}>Create Packing</Text>

        <TouchableOpacity onPress={onAdd} style={s.headerRight}>
          <Ionicons name="add" size={28} color={Colors.name?.black || "#111"} />
          <Text style={s.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={s.listWrapper}>
        <FlatList data={boxes} keyExtractor={(i) => i.id} renderItem={renderItem} scrollEnabled={false} />
      </View>
    </SafeAreaView>
  );
};

const styles = (screenContext, width) => ({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: { padding: 8 },
  headerRight: { alignItems: "center", padding: 8, flexDirection: "row" },
  addText: { marginLeft: 4, fontSize: 12 },

  title: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "600" },

  listWrapper: {
    marginHorizontal: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },

  rowText: { fontSize: 16, color: "#111" },
});

export default CreatePacking;
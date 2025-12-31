// ...existing code...
import React from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { useScreenContext } from "../../services/Context";
import { useLinkProps } from "@react-navigation/native";
import { Colors } from "../../thems/Colors";

const data = [
  { id: "1", title: "File Name 1", buttonLabel: "Scan" },
  { id: "2", title: "File Name 2", buttonLabel: "Scan" },
  { id: "3", title: "File Name 3", buttonLabel: "Scan" },
  { id: "4", title: "File Name 4", buttonLabel: "Scan" },
];

const InBound = (props) => {
  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const screenStyles = styles(screenContext, width, height);

  const renderItem = ({ item, index }) => (
    <View style={[screenStyles.row, index === data.length - 1 && { borderBottomWidth: 0 }]}>
      <View style={screenStyles.leftCell}>
        <Text style={screenStyles.itemText}>{item.title}</Text>
      </View>

      <View style={screenStyles.rightCell}>
        <TouchableOpacity style={screenStyles.scanButton} onPress={() => {
          props.navigation.navigate('ProductScan');
        }}>
          <Text style={screenStyles.scanButtonText}>{item.buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={screenStyles.container}>
      <Image source={require('../../assets/vstar.png')} style={screenStyles.logo} />

      <View style={screenStyles.listWrapper}>
        <FlatList
          data={data}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

const styles = (screenContext, width, height) => ({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    // backgroundColor: Colors.name.darkBlue,
  },

  listWrapper: {
    width: Math.min(width * 0.95, 420),
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "#fff",
  },

  leftCell: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "center",
  },

  rightCell: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#f0f0f0",
    paddingLeft: 12,
  },

  itemText: {
    fontSize: 18,
    color: "#111",
  },

  scanButton: {
    backgroundColor: Colors.name.VstarRed || "#e31717",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 2,
  },

  scanButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 18,
  },
});

export default InBound;
// ...existing code...
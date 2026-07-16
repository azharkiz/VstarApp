import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import { useDispatch, useSelector } from "react-redux";

import { useScreenContext } from "../../services/Context";
import { Colors } from "../../thems/Colors";
import {
  fetchOutBoundFiles,
  selectOutBound,
} from "../../services/redux/slice/outBoundSlice";

const OutBound = (props) => {
  const screenContext = useScreenContext();

  const width = screenContext[
    screenContext.isPortrait ? "windowWidth" : "windowHeight"
  ];

  const height = screenContext[
    screenContext.isPortrait ? "windowHeight" : "windowWidth"
  ];

  const screenStyles = styles(screenContext, width, height);

  const dispatch = useDispatch();

  const { items } = useSelector(selectOutBound);

  const load = useCallback(() => {
    dispatch(fetchOutBoundFiles());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const onScanPress = (fileName) => {
    props.navigation.navigate("DeliveryCodes", {
      fileName,
    });
  };

  const renderItem = ({ item, index }) => (
    <View
      style={[
        screenStyles.row,
        index === (items?.files?.length || 0) - 1 && {
          borderBottomWidth: 0,
        },
      ]}
    >
      <View style={screenStyles.leftCell}>
        <Text style={screenStyles.itemText}>{item.filename}</Text>
      </View>

      <View style={screenStyles.rightCell}>
        <TouchableOpacity
          style={screenStyles.scanButton}
          onPress={() => onScanPress(item.filename)}
        >
          <Text style={screenStyles.scanButtonText}>
            {item.buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={screenStyles.container}>
      <Image
        source={require("../../assets/vstar.png")}
        style={screenStyles.logo}
      />

      <View style={screenStyles.refreshView}>
        <TouchableOpacity
          style={screenStyles.refreshButton}
          onPress={load}
        >
          <Feather
            name="refresh-cw"
            size={20}
            color={Colors.name.black}
          />
        </TouchableOpacity>
      </View>

      <View style={screenStyles.listWrapper}>
        <FlatList
          style={{ flex: 1 }}
          data={items?.files ?? []}
          keyExtractor={(item, index) =>
            item?.id
              ? item.id.toString()
              : `${item.filename}-${index}`
          }
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={screenStyles.listContent}
        />
      </View>
    </View>
  );
};

const styles = (screenContext, width, height) => ({
  container: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#fff",
  },

  logo: {
    width: 120,
    height: 120,
    resizeMode: "contain",
    marginBottom: 20,
  },

  refreshView: {
    width: Math.min(width * 0.95, 420),
    alignItems: "flex-end",
    marginBottom: 15,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#DDD",
    justifyContent: "center",
    alignItems: "center",
  },

  listWrapper: {
    flex: 1,
    width: Math.min(width * 0.95, 420),
    borderWidth: 1,
    borderColor: "#ECECEC",
    borderRadius: 10,
    backgroundColor: "#FFF",
  },

  listContent: {
    paddingBottom: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: "#FFF",
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
    borderLeftColor: "#F0F0F0",
    paddingLeft: 12,
  },

  itemText: {
    fontSize: 18,
    color: "#111",
  },

  scanButton: {
    backgroundColor: Colors.name.VstarRed || "#E31717",
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
    minWidth: 100,
    justifyContent: "center",
    alignItems: "center",
  },

  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default OutBound;
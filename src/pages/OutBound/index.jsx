// ...existing code...
import React,{ useCallback, useEffect} from "react";
import { View, Text, Image, TouchableOpacity, FlatList } from "react-native";
import { useScreenContext } from "../../services/Context";
import { useLinkProps } from "@react-navigation/native";
import { Colors } from "../../thems/Colors";
import { useDispatch, useSelector } from 'react-redux';
import Feather from 'react-native-vector-icons/Feather';
import { fetchOutBoundFiles, selectOutBound, fetchFileDetails, resetOutBoundState } from '../../services/redux/slice/outBoundSlice';

const OutBound = (props) => {
  const screenContext = useScreenContext();
  const width = screenContext[screenContext.isPortrait ? "windowWidth" : "windowHeight"];
  const height = screenContext[screenContext.isPortrait ? "windowHeight" : "windowWidth"];
  const screenStyles = styles(screenContext, width, height);
  const dispatch = useDispatch();
  const { items, status, error } = useSelector(selectOutBound);
 
  const load = useCallback(() => {
    dispatch(fetchOutBoundFiles());
    // dispatch(resetOutBoundState());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

const onScanPress = (fileName) => {
  props.navigation.navigate('DeliveryCodes', { fileName: fileName });
};
  const renderItem = ({ item, index }) => (
    <View style={[screenStyles.row, index === items?.files?.length - 1 && { borderBottomWidth: 0 }]}>
      <View style={screenStyles.leftCell}>
        <Text style={screenStyles.itemText}>{item.filename}</Text>
      </View>

      <View style={screenStyles.rightCell}>
        <TouchableOpacity style={screenStyles.scanButton} onPress={() => {
          onScanPress(item.filename);
        }}>
          <Text style={screenStyles.scanButtonText}>{item.buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={screenStyles.container}>
      <Image source={require('../../assets/vstar.png')} style={screenStyles.logo} />

      <View style={screenStyles.refreshView}>
        <TouchableOpacity style={screenStyles.scanButton} onPress={load}>
          <Feather name="refresh-cw" size={20} color={Colors.name.black} />
        </TouchableOpacity>
      </View>

      <View style={screenStyles.listWrapper}>
        <FlatList
          data={items?.files}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          scrollEnabled={true}
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

  refreshView: {
    width: width * 0.5,
    alignItems: "flex-end",
    marginBottom: height * 0.02,
    marginLeft: width * 0.3,
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

export default OutBound;
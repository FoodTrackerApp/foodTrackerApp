import * as React from 'react';
import { Portal, Provider } from 'react-native-paper';
import { Text, View, Button, Modal } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const ScannerModal = ({ modalVisible, hideModal }) => {
  const containerStyle = {backgroundColor: 'white', padding: 20};

  // scanner stuff
  const [hasPermission, setHasPermission] = React.useState(null);
  const [scanned, setScanned] = React.useState(false);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  }

  return (
  <Modal visible={true} onRequestClose={hideModal} >
    <View style={{flex: 1,flexDirection: 'column',justifyContent: 'center'}}>
      {!hasPermission ? <Text>No Camera permissions</Text> : <Text>Requesting for camera permission</Text>}
      <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}  />
      {scanned &&  <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
    </View>
  </Modal>
  );
};

export default ScannerModal;
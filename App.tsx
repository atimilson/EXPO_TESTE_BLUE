import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  PermissionsAndroid,
  Platform,
  Text,
  Button,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import * as ExpoDevice from "expo-device";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";


export default function App() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const bleManager = useMemo(() => new BleManager(), []);
  const UUID = '00001101-0000-1000-8000-00805F9B34FB'
  const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  const requestPermissions = async () => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () => {
    bleManager.startDeviceScan(
      null,
      null,
      (error: BleError | null, scannedDevice: Device | null) => {
        if (error) {
          console.log(error);
        }
        if (scannedDevice && scannedDevice.name) {
          setAllDevices((prevState: Device[]) => {
            if (!isDuplicteDevice(prevState, scannedDevice)) {
              return [...prevState, scannedDevice];
            }
            return prevState;
          });
        }
      }
    );
  }

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const stop = () => {
    bleManager.stopDeviceScan()
  }

  const commands = [
    '\x1B\x40', // Inicializa a impressora
    '\x1B\x61\x01', // Centraliza o texto
    'CUPOM DE COMPRA\n\n',
    '---------------------------\n',
    'Produto 1       R$10,00\n',
    'Produto 2       R$15,00\n',
    'Produto 3       R$20,00\n',
    '---------------------------\n',
    '\x1B\x64\x02', // Avança 2 linhas
    '\x1B\x69\x02\x00', // Corta o papel
  ];
  const data = 'XHgxQlx4NDAsIAogICAgXHgxQlx4NjFceDAxCiAgICBDVVBPTSBERSBDT01QUkFcblxuCiAgICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbgogICAgUHJvZHV0byAxICAgICAgIFIkMTAsMDBcbgogICAgUHJvZHV0byAyICAgICAgIFIkMTUsMDBcbgogICAgUHJvZHV0byAzICAgICAgIFIkMjAsMDBcbgogICAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4KICAgIFx4MUJceDY0XHgwMgogICAgXHgxQlx4NjlceDAyXHgwMA=='

  const connectToDevice = async (device: Device) => {
    console.log('chegou')
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id, { refreshGatt: 'OnConnected' });     
      // await bleManager.discoverAllServicesAndCharacteristicsForDevice(device.id);
      const services = await device.services()
      console.log(services);  
      // const characteristics = await deviceConnection.isConnected();
      // console.log(characteristics)
      // await bleManager.discoverAllServicesAndCharacteristicsForDevice(device.id)
      // .then((results) => { 
      //   console.log(results);       
      // });
      // bleManager.stopDeviceScan(); 
      // console.log(deviceConnection) 
      const  service = await device.characteristicsForService(UUID)  
      console.log(service)   
      setConnectedDevice(deviceConnection);
      console.log('conectado !!!!')  
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const imprima = async () => {
    if (connectedDevice){
       await connectedDevice.writeCharacteristicWithResponseForService(        
        UUID,
        UUID,
        data
      )   
    }
  }

  useEffect(() => {
    console.log(allDevices);
  }, [allDevices]);
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {/* <TouchableOpacity onPress={() => console.log("a")}>
        Open up App.tsx to start working on your app!
      </TouchableOpacity> */}
      <Button onPress={()=>scanForDevices()} title="Procurar " />
      <Button onPress={()=>stop()} title="Stop" />
      <Button onPress={()=>imprima()} title="Imprimir" />
      
      {allDevices.length > 0 ?
        allDevices.map((device: Device) => {
           return  <Button onPress={()=>connectToDevice(device)} title={device.name?device.name:''} />;
          })
        : ""}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  }
});

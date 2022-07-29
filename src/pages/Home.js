import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Modal, ToastAndroid } from 'react-native';
import { DataTable, Searchbar, IconButton, Button, Divider, TextInput } from 'react-native-paper';
import React, { useState } from "react";
import { useEffect } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import convertUPC from '../functions/ConvertUPC';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as SQLite from "expo-sqlite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from "expo-crypto";

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

// returns normalized timestrings -> 0h 0min 0sec
function cleanTimeString(str) {
  var date = new Date(str);

  let hours = date.getHours() * 3600000;
  let minutes = date.getMinutes() * 60000;
  let seconds = date.getSeconds() * 1000;

  str = str - (hours+minutes+seconds) + 1000;
  return str;
}


export default function Home({ settings, setSettings }) {

  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState([]);
  const [rows, setRows] = React.useState(data);
  const [nextDue, setNextDue] = React.useState({name: "", date: 0, count: 0, place: "", id: ""});
  const [form, setForm] = React.useState({name: "", date: datePickerDate, count: "", place: "", id: ""});
  const [isOffline, setIsOffline] = React.useState(false);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [lastMod, setLastMod] = React.useState(0);

  // modal stuff
  const [modalVisible, setModalVisible] = React.useState(false);
  const [addModalVisible, setAddModalVisible] = React.useState(false);

  const db = SQLite.openDatabase("item.db");

  useEffect(() => {
    // load settings
    (async function() {
      const settings = await AsyncStorage.getItem("settings");
      if(settings !== null) {
        const parsedSettings = JSON.parse(settings);
        setSettings(parsedSettings);
      } 
    })();

    // make items database if not existent
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id text primary key not null, name text, place text, date int, count int, datemodified int);"
      );
    },
    (error) => {console.log(error)},
    );
    // fetches data from local and cloud
    fetchData();
    (async function() {
      let newMod = await AsyncStorage.getItem("dateModified")
      newMod = parseInt(newMod);
      setLastMod(newMod);
    })();
    sync();

  }, [])


  const [forceUpdate, forceUpdateId] = useForceUpdate();

  // scanner stuff
  const [hasPermission, setHasPermission] = React.useState(null);
  const [scanned, setScanned] = React.useState(false);

  const showModal = () => {setModalVisible(true); setScanned(false)};
  const hideModal = () => setModalVisible(false);

  const showAddModal = () => {setAddModalVisible(true); setScanned(false);};
  const hideAddModal = () => {setAddModalVisible(false); resetForm(); setIsEditMode(false)};


  // date time picker
    const [datePickerDate, setDatePickerDate] = React.useState(new Date());

    const onChange = (event, selectedDate) => {
      const currentDate = selectedDate;
      setDatePickerDate(currentDate);
      setForm({...form, date: currentDate.getTime()});
    };

    const showMode = (currentMode) => {
      DateTimePickerAndroid.open({
        value: datePickerDate,
        onChange,
        mode: currentMode,
        is24Hour: true
      })
    };

    const showDatepicker = () => {
      showMode('date');
    };

    const resetForm = () => {
      setForm({name: "", date: null, count: "", place: ""});
    };


  const addItem = async () => {

    // check if add or edit
    if(isEditMode) {
      saveEditItem();
      return;
    }

    // add item from form to localDatabase and try to sync
    console.log("Adding item:", form.name);

    const dateMod = new Date().getTime();
    await AsyncStorage.setItem("dateModified", dateMod.toString());
    setLastMod(dateMod);

    // clean date string
    setForm({...form, date: cleanTimeString(form.date)});
    
    // Make ID
    const id = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256, form.name + form.date + form.count + form.place);

    db.transaction((tx) => {
      tx.executeSql("insert into items (id, name, place, date, count, dateModified) values (?, ?, ?, ?, ?, ?)", 
        [id, form.name, form.place, form.date, form.count, dateMod]);
    },
    (err) => {console.log(err)},
    loadDataFromDevice,
    )
    console.log("Trying network");
    if(!isOffline) {
      const sendBody = {
        _id: id,
        name: form.name,
        place: form.place,
        date: form.date,
        count: form.count,
      }
      const url = `http://${settings.serverIP}:${settings.serverPort}/api/send`
      console.log("Sending to:", url);
      const res = await fetch(url, {method: "POST", body: JSON.stringify(sendBody)})
    }
    hideAddModal();
  }

  const deleteItem = async () => {
    // delete Item from database and try to sync
    console.log("Deleting item:", form.name);
     
    const newDateModified = new Date().getTime();
    await AsyncStorage.setItem("dateModified", newDateModified.toString());
    setLastMod(newDateModified);

    // Get ID
    const id = form.id
  
    // Delete from local database
    db.transaction((tx) => {
      tx.executeSql("delete from items where id = ?", 
        [id]);
    },
    (err) => {console.log(err)},
    )

    // Try deleting from server
    if(!isOffline) {
      const res = await fetch(`${settings.serverIP}:${settings.serverPort}/api/delete`, {method: "DELETE", body: JSON.stringify({...form})})
    }

    // Remove item from data and rows
    const newData = data.filter(item => item.id !== id);  
    setData(newData);
    setRows(data);
    setSearchTerm("");

    hideAddModal();
  }

  const saveEditItem = async () => {
    // update Item from database and try to sync
    console.log("Updating item:", form.name);

    // Get ID
    const id = form.id

    const newDateModified = new Date().getTime();
    console.log("Settings new date modified: " + newDateModified.toString());
    await AsyncStorage.setItem("dateModified", newDateModified.toString());
    setLastMod(newDateModified);
  
    // Update
    db.transaction((tx) => {
      tx.executeSql("update items set name = ?, place = ?, date= ?, count = ?, dateModified = ? where id = ?", 
        [form.name, form.place, form.date, form.count, newDateModified, id]);
    },
    (err) => {console.log(err)},
    )

    // Try updating from server
    if(!isOffline) {
      const res = await fetch(`${settings.serverIP}:${settings.serverPort}/api/send`, {method: "POST", body: JSON.stringify({...form, dateMod: newDateModified, toUpdate: true})})
    }

    // Update data and rows
    const newData = data.map(item => {
      if(item.id === id) {
        return {...form};
      }
      return item;
    }
    );
    setData(newData);
    setRows(data);
    setSearchTerm("");

    hideAddModal();
  }

  // iterates through data and removes old duplicates
  const sync = async () => {
    console.log("Syncing");
    try {
      // ping server to see if network is available
      const url = `${settings.serverIP}:${settings.serverPort}`;
      const res = await fetch(`http://${url}/api/ping`);
      if(res.status == 200) {
        ToastAndroid.show(`Network is available`, ToastAndroid.SHORT);
        setIsOffline(false);
      } else {
        throw new Error("Network is not available");
      }

    } catch(e) {
      setIsOffline(true);
      // show toast
      ToastAndroid.show("Could not reach network. Offline mode enabled", ToastAndroid.LONG);
      return;
    }

    try {
      let localLastChange = await AsyncStorage.getItem("dateModified");
      localLastChange = parseInt(localLastChange);

      // get last change from server
      const res = await fetch(`http://${settings.serverIP}:${settings.serverPort}/api/lastmod`);
      const cloudDate = await res.json();

      if(localLastChange < cloudDate) {

        console.log("Local database is outdated");

        // get all items from server
        const res = await fetch(`http://${settings.serverIP}:${settings.serverPort}/api/get`, {method: "GET"});
        const json = await res.json();

        // delete all items from local database
        db.transaction((tx) => {
          tx.executeSql("delete from items");
        },
        null,
        forceUpdate
        )
        
        // add all items from server to local database
        db.transaction((tx) => {
          json.forEach(item => {
            tx.executeSql("insert into items (id, name, place, date, count, dateModified) values (?, ?, ?, ?, ?, ?)", 
              [item.id, item.name, item.place, item.date, item.count, item.dateModified]);
          }
          )
        },
        null,
        forceUpdate
        )

        // set last change to server
        await AsyncStorage.setItem("dateModified", cloudDate.toString());

        // change _id to id property
        const newData = json.map(item => {
          return {...item, id: item._id};
        });

        // set data and rows to new data
        setData(newData);
        setRows(newData);
      } else {
        console.log("Local database is up to date");
        console.log("Overriding cloud data");
        
        const res = await fetch(`http://${settings.serverIP}:${settings.serverPort}/api/replace`, {
          method: "POST",
          body: JSON.stringify(data)
        });
      }

    } catch(e) {
      console.error(e);
      ToastAndroid.show("Error syncing with server: " + e, ToastAndroid.LONG);
    }
  }

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    if(type == 32) {
      convertUPC(data).then(res => {
        const resString = parseInt(res.status.code) == 200 ? res.product.attributes.product : "No results found";
        
        if(res.status.code == 200) {
          setForm({name: resString, date: datePickerDate, count: "1", place: ""});
          hideModal();
          showAddModal();
        } else {
          alert(`Bar code with type ${type}, UPC ${data}. Didn't find product. Try again.`);
          setScanned(false);
          resetForm();
        }
      })
    }
  }

  const CalculateNextDue = (arr) => {
    if(arr.length == 0) {  
      setNextDue({name: "", date: 0, count: 0, place: "", id: ""});
      return; 
    }
    // Initial is first item in array
    let nextDueEval = arr[0], nextDueTime = cleanTimeString(nextDueEval.date);
    // Loop through array and keep track of next due date
    arr.forEach(item => {
        const date = item.date;
        // if date is before next due date, set next due date to this date
        if(date < nextDueTime) {
            nextDueEval = item;
            nextDueTime = date;
        }
    });
    setNextDue(nextDueEval);
  }

  const RenderNextDue = () => {
    // get time Diff from today to next due date
    const now = cleanTimeString(new Date().getTime());
    const dueDate = nextDue.date;
    const timeDiff = dueDate - now;

    let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // set bg color
    const isOverdue = diffDays < 0;



    // 
    if(Math.abs(diffDays) > 30) {
      diffDays = Math.abs(Math.ceil(diffDays /30));
      if(diffDays > 12) {
        diffDays = Math.ceil(diffDays / 12) + " years";
      } else {
        diffDays = diffDays + " months";
      }
    } else {
      diffDays += " Days";
    }

    return (
      <View style={{
        backgroundColor: '#161616',
        borderRadius: 10,
        padding: 10,
        marginTop: 20,
        }}>
        <Text style={{color: "#fff", margin: 10, fontSize: 17}}>{isOverdue ? "Overdue" : "Next due"}</Text>
        <Text style={{color: "#fff", marginLeft: 10, marginBottom: 20, fontSize: 25, fontWeight: "bold"}}>{nextDue.name}</Text>
        <Text color="#112e15" style={{backgroundColor: isOverdue ? "#372506" : "#112e15", borderRadius: 20, padding: 20}}>{
          !isOverdue ? <Text style={{color: "#76e790"}}>{`In ${diffDays}`}</Text> 
          : <Text style={{color: "#ecae43"}}>{`Since ${diffDays}`}</Text>}</Text>
      </View>
    )

  }

  // handle re-calculating nextDue on data change
  useEffect(() => {
    CalculateNextDue(data);
  }, [data])

  // handle search
  useEffect(() => {
    if(searchTerm.length > 0) {
      const filteredRows = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setRows(filteredRows)
    } else { setRows(data) }
  }, [searchTerm, data, setRows])

  const loadDataFromDevice = () => {
    db.transaction((tx) => {
    tx.executeSql(
        `select * from items`,
        [],
        (_,{rows: {_array}}) => setData(_array)
      )
    });
    setRows(data);
    setSearchTerm("");
  }

  const fetchData = async () => {

    // get data from SQL database
    loadDataFromDevice();

    setRows(data);
  }

  const handleRowClick = (item) => {
    setForm(item);
    setAddModalVisible(true);
  }

  const renderItem = (item) => {
    return (
        <DataTable.Row onPress={() =>{ handleRowClick(item); setIsEditMode(true)}} key={item.id}>
            <DataTable.Cell>{item.name}</DataTable.Cell>
            <DataTable.Cell>{item.count}</DataTable.Cell>
            <DataTable.Cell>{new Date(item.date).toLocaleDateString()}</DataTable.Cell>
            <DataTable.Cell>{item.place}</DataTable.Cell>
        </DataTable.Row>
    )
  }

  const getPermissions = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }

  return (
  <ScrollView style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>

    <Modal animationType='slide' visible={addModalVisible} onRequestClose={hideAddModal}>
      <View style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
        <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Add new</Text>
          <View style={styles.formField}>
            <TextInput label="Name"
              value={form.name}
              onChangeText={text => setForm({...form, name: text})}
             />
          </View>
          <View style={styles.formField}>
            <TextInput onPressIn={showDatepicker} label="Due Date" value={datePickerDate.toLocaleDateString()}
             />
          </View>
          <View style={styles.formField}>
            <TextInput label="Count" keyboardType='number-pad' 
            onChangeText={text => setForm({...form, count: text})}
            value={form.count.toString()} />
          </View>
          <View style={styles.formField}>
            <TextInput label="Place" 
            onChangeText={text => setForm({...form, place: text})}
            value={form.place}
             />
          </View>
          <View style={{backgroundColor: "#5bc569", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={addItem} color="white" icon="plus-box">{isEditMode ? "Save" : "Add"}</Button></View>
          {isEditMode ? <View style={{backgroundColor: "#f31260", borderColor: "#f31260", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={deleteItem} color="white" icon="plus-box">Delete</Button></View> : null}
          <View style={{backgroundColor: "transparent", borderColor: "#f5a524", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={hideAddModal} color="#f5a524" icon="close">Close</Button></View>
      </View>

     
    </Modal>

    <Modal animationType='slide' onShow={getPermissions} visible={modalVisible} onRequestClose={hideModal} >
      <View style={{flex: 1,flexDirection: 'column', backgroundColor: "black"}}>
        {hasPermission === false ? <Text>No Camera permissions</Text> : null}
        {hasPermission === null ? <Text>Requesting for Camera permissions</Text> : null}
        <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFill} />
        {scanned &&  <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
      </View>
      <View style={{ padding: 10 }}><Button style={{marginTop: 10}} onPress={hideModal}>Close</Button></View>
    </Modal>

    <View style={{flex: 1, flexDirection: "row", alignContent: "center", justifyContent: "space-between"}}>
      <Text style={styles.header}>FoodTracker </Text>
      <IconButton icon="refresh" iconColor="white" size={20} onPress={() => sync()} />
    </View>

    {isOffline ? <Text style={{color: "#76e790"}}>Offline mode</Text> : null}
    <Text style={{color: "#76e790"}}>Last modified: {new Date(lastMod).toUTCString()}</Text>
    <Text style={{color: "#76e790"}}>Server URL: {settings.serverIP}:{settings.serverPort}</Text>

    <RenderNextDue />

    <View style={{flex: 1, flexDirection: "row", justifyContent: "center", marginBottom: 10, marginTop: 10}}>
      <View style={{backgroundColor: "transparent", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginRight: 10}}><Button onPress={showModal} color="#5bc569" icon="qrcode">Scan</Button></View>
      <View style={{backgroundColor: "#5bc569",     borderColor: "#5bc569", borderRadius: 10, borderWidth: 2,  }}><Button onPress={showAddModal} color="white" icon="plus-box">Add</Button></View>
    </View>
    <View><Searchbar style={styles.input} placeholder="Search..." onChangeText={setSearchTerm}/></View>
    
    <DataTable style={{marginBottom: 20}} >
      <DataTable.Header>
        <DataTable.Title>Name</DataTable.Title>
        <DataTable.Title numeric>#</DataTable.Title>
        <DataTable.Title>Date</DataTable.Title>
        <DataTable.Title>Place</DataTable.Title>
      </DataTable.Header>
      
      {rows.map((item) => (
        renderItem(item)
      ))}

    </DataTable>

    <StatusBar style="light" />
  </ScrollView>
   
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    color: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  card: {
    backgroundColor: '#161616',
    borderRadius: 10,
    padding: 10,
  },
  text : {
    color: "#fff"
  },
  button: {
    backgroundColor: '#41ec8b',
    color: "#fff",
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderColor: '#41ec8b',
    borderWidth: 1,
    borderRadius: 3,
  },
  header: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
    color: "#fff",
    backgroundColor: '#161616',
    borderRadius: 10,
  },
  formField: {
    margin: 10,
  }
});

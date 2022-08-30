import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Modal, ToastAndroid } from 'react-native';
import { DataTable, Searchbar, IconButton, Button, TextInput } from 'react-native-paper';
import React, { useState } from "react";
import { useEffect } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import convertUPC from '../functions/ConvertUPC';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as SQLite from "expo-sqlite";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from "expo-crypto";

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
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isSearching, setIsSearching] = React.useState(false);

  // modal stuff
  const [modalVisible, setModalVisible] = React.useState(false);
  const [addModalVisible, setAddModalVisible] = React.useState(false);

  const db = SQLite.openDatabase("item.db");

  // init setup
  useEffect(() => {
    // load settings
    (async function() {
      const settings = await AsyncStorage.getItem("settings");
      if(settings !== null) {
        const parsedSettings = JSON.parse(settings);
        setSettings(parsedSettings);
      } 
    })();

    // make itemsdb database if not existent
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id text primary key not null, name text, place text, date int, count int, datemodified int, deleted int);"
      );
    },
    (error) => {console.log(error)},
    );
    // fetches data from local
    (async function() {
      await loadDataFromDevice();
    })();
  }, [])

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

  const setNewData = (newData) => {
    return new Promise((resolve, reject) => {
      // filter out deleted itemsdb
      let filteredData = newData.filter(item => item.deleted !== 1);

      setData(filteredData);
      setRows(filteredData);
      setSearchTerm("");
      resolve();
    })
  }

  const addItem = async () => {

    // check if add or edit
    if(isEditMode) {
      saveEditItem();
      return;
    }

    // add item from form to localDatabase and try to sync
    console.log("Adding item:", form.name);

    const newDateModified = new Date().getTime();
    form.datemodified = newDateModified;
    
    form.deleted = null;

    // clean date string
    setForm({...form, date: cleanTimeString(form.date)});
    
    // Make ID
    const id = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256, form.name + form.date + form.count + form.place);

    form.id = id;

    db.transaction((tx) => {
      tx.executeSql("insert into items (id, name, place, date, count, datemodified, deleted) values (?, ?, ?, ?, ?, ?, 0)", 
        [id, form.name, form.place, form.date, form.count, form.datemodified]);
    },
    (err) => {console.log(err)},
    )

    setNewData([...data, form]);
    
    hideAddModal();
    resetForm();
  }

  const deleteItem = async () => {
    // delete Item from database and try to sync
    console.log("Deleting item:", form.name);
     
    const newDateModified = new Date().getTime();

    // set new dateModified
    form.datemodified = newDateModified;

    form.deleted = 1;

    // Get ID
    const id = form.id
  
    // Add deleted prop to item in local database,
    db.transaction((tx) => {
      tx.executeSql("update items set deleted = 1, datemodified = ? where id = ?",
        [newDateModified, id]);
        
    },
    (err) => {console.log(err)},
    )

    let sendBody = form;

    // change id to _id
    sendBody._id = id;
    
    // update item in data
    let newData = data.map((ele) => {
      if(ele.id === id) {
        return form;
      } else {
        return ele;
      }
    })
    setNewData(newData);

    hideAddModal();
  }

  const saveEditItem = async () => {
    // update Item from database and try to sync
    console.log("Updating item:", form);

    // Get ID
    const id = form.id

    const newDateModified = new Date().getTime();
  
    // Update
    db.transaction((tx) => {
      tx.executeSql("update items set name = ?, place = ?, date= ?, count = ?, datemodified = ? where id = ?", 
        [form.name, form.place, form.date, form.count, newDateModified, id]);
    },
    (err) => {console.log(err)},
    )
    
    // Update data and rows with the edited item
    const newData = data.map(item => {
      if(item.id === id) {
        return {...form};
      } return item; });

    setNewData(newData);
    hideAddModal();
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

  const getPermissions = () => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }

  const CalculateNextDue = (arr) => {
    if(arr.length == 0) {  
      setNextDue({name: "", date: 0, count: 0, place: "", id: ""});
      return; 
    }
    // Initial is first item in array
    let nextDueEval = arr[0], nextDueTime = nextDueEval.date;
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
    const now = new Date().getTime();
    const dueDate = nextDue.date;
    const timeDiff = dueDate - now;

    let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    // set bg color
    const isOverdue = diffDays <= 0;

    if(Math.abs(diffDays) > 30) {
      diffDays = Math.abs(Math.ceil(diffDays /30));
      if(diffDays > 12) {
        diffDays = Math.ceil(diffDays / 12) + " years";
      } else {
        diffDays = diffDays + " months";
      }
    } else {
      if(diffDays == 0) {
        diffDays = "Today";
      } else if(diffDays == 1) {
        diffDays = "Tomorrow";
      } else {
        diffDays += " Days";
      }
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
          !isOverdue ? <Text style={{color: "#76e790", fontWeight: "bold"}}>{`In ${diffDays}`}</Text> 
          : <Text style={{color: "#ecae43", fontWeight: "bold"}}>{`Since ${diffDays}`}</Text>}</Text>
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
      const filteredRows = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.place.toLowerCase().includes(searchTerm.toLowerCase()));
      setRows(filteredRows)
    } else { setRows(data) }
  }, [searchTerm, data, setRows])

  // load data from SQLite database into states
  const loadDataFromDevice = () => {
    return new Promise((resolve ,reject) => {
      db.transaction((tx) => {
      tx.executeSql(
          `select * from items`,
          [],
          async (_,{rows: {_array}}) => {await setNewData(_array); resolve();},
        )
      });
    }) 
  }

  // handles opening modal when clicking on table row
  const handleRowClick = (item) => {
    setForm(item);
    setAddModalVisible(true);
    setIsEditMode(true);
  }

  // handles rendering a row in the table
  const renderItem = (item) => {
    return (
    <DataTable.Row onPress={() =>{ handleRowClick(item)}} key={item.id}>
        <DataTable.Cell>{item.name}</DataTable.Cell>
        <DataTable.Cell>{item.count}</DataTable.Cell>
        <DataTable.Cell>{new Date(item.date).toLocaleDateString()}</DataTable.Cell>
        <DataTable.Cell>{item.place}</DataTable.Cell>
    </DataTable.Row>
    )
  }

  return (
  <ScrollView style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>

    <Modal animationType='slide' visible={addModalVisible} onRequestClose={hideAddModal}>
      <View style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
        <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Add new</Text>
          <View style={styles.formField}>
            <TextInput label="Name"
              mode="outlined"
              value={form.name}
              onChangeText={text => setForm({...form, name: text})}
             />
          </View>
          <View style={styles.formField}>
            <TextInput 
            mode="outlined"
            onPressIn={showDatepicker} 
            label="Due Date" 
            value={datePickerDate.toLocaleDateString()}
             />
          </View>
          <View style={styles.formField}>
            <TextInput 
              label="Count" 
              keyboardType='number-pad' 
              mode="outlined"
              onChangeText={text => setForm({...form, count: text})}
              value={form.count.toString()} 
            />
          </View>
          <View style={styles.formField}>
            <TextInput 
              label="Place" 
              onChangeText={text => setForm({...form, place: text})}
              value={form.place}
              mode="outlined"
            />
          </View>
          <View style={{backgroundColor: "#112e15", borderColor: "#112e15", borderRadius: 10, borderWidth: 2, marginTop: 10 }}>
            <Button onPress={addItem} icon="plus-box">{isEditMode ? "Save" : "Add"}</Button>
          </View>
          {isEditMode ? <View style={{backgroundColor: "#601410", borderColor: "#601410", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={deleteItem} textColor="white" icon="delete">Delete</Button></View> : null}
          <Button 
            onPress={hideAddModal} 
            textColor="#ccc"
            mode="elevated"
            style={{marginTop: 10}}
            icon="close"
            >
            Close
          </Button>
         
      </View>

     
    </Modal>

    <Modal animationType='slide' onShow={getPermissions} visible={modalVisible} onRequestClose={hideModal} >
      <View style={{flex: 1,flexDirection: 'column', backgroundColor: "black"}}>
        {hasPermission === false ? <Text>No Camera permissions</Text> : null}
        {hasPermission === null ? <Text>Requesting Camera permissions</Text> : null}
        <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFill} />
        {scanned &&  <Button title={'Tap to Scan Again'} onPress={() => setScanned(false)} />}
      </View>
      <View style={{ padding: 10 }}><Button style={{marginTop: 10}} onPress={hideModal}>Close</Button></View>
    </Modal>

    {isSearching ? null : (
      <>
      <View style={{flex: 1, flexDirection: "row", alignContent: "center", justifyContent: "space-between"}}>
        <Text style={styles.header}>FoodTracker </Text>
      </View>

      <RenderNextDue />

      <View style={{flex: 1, flexDirection: "row", justifyContent: "center", marginBottom: 10, marginTop: 10}}>
        <View style={{backgroundColor: "transparent", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginRight: 10}}><Button onPress={showModal} color="#5bc569" icon="qrcode">Scan</Button></View>
        <View style={{backgroundColor: "#5bc569",     borderColor: "#5bc569", borderRadius: 10, borderWidth: 2,  }}><Button onPress={showAddModal} mode="contained" icon="plus-box">Add</Button></View>
      </View>

      </>
    )}


    <Searchbar 
    style={styles.input} 
    inputStyle={{fontSize: 15}}
    placeholder="Search name or place"
    onFocus={() => setIsSearching(true)}
    onBlur={() => setIsSearching(false)}
    onChangeText={setSearchTerm}/>
    
    <DataTable style={{marginBottom: 20}} >
      <DataTable.Header>
        <DataTable.Title >Name</DataTable.Title>
        <DataTable.Title >#</DataTable.Title>
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
    marginTop: 20,
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

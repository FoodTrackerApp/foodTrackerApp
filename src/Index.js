import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Modal, Pressable } from 'react-native';
import { DataTable, Searchbar, IconButton, Button, Divider, TextInput } from 'react-native-paper';
import React from "react";
import { useEffect } from 'react';
import { BarCodeScanner } from 'expo-barcode-scanner';
import convertUPC from './functions/ConvertUPC';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export default function App() {

  const [isOverdue, setIsOverdue] = React.useState(false);
  const [timeDiff, setTimeDiff] = React.useState(69);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [data, setData] = React.useState([]);
  const [rows, setRows] = React.useState(data);
  const [loading, setLoading] = React.useState(false);
  const [nextDue, setNextDue] = React.useState({name: "loading", date: 0, count: "0", group: "..."});
  const [form, setForm] = React.useState({name: "", date: datePickerDate, count: "", group: ""});

  // modal stuff
  const [modalVisible, setModalVisible] = React.useState(false);
  const [addModalVisible, setAddModalVisible] = React.useState(false);
  
  useEffect(() => {
    fetchData();
  }, [])

  // scanner stuff
  const [hasPermission, setHasPermission] = React.useState(null);
  const [scanned, setScanned] = React.useState(false);

  const showModal = () => {setModalVisible(true); setScanned(false)};
  const hideModal = () => setModalVisible(false);

  const showAddModal = () => {setAddModalVisible(true); setScanned(false);};
  const hideAddModal = () => {setAddModalVisible(false); resetForm();};

  // date time picker
    const [datePickerDate, setDatePickerDate] = React.useState(new Date(1598051730000));

    const onChange = (event, selectedDate) => {
      const currentDate = selectedDate;
      setDatePickerDate(currentDate);
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
      setForm({name: "", date: null, count: "", group: ""});
    };


  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    if(type == 32) {
      convertUPC(data).then(res => {
        const resString = parseInt(res.status.code) == 200 ? res.product.attributes.product : "No results found";
        
        if(res.status.code == 200) {
          setForm({name: resString, date: datePickerDate, count: "1", group: ""});
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
    if(arr.length == 0) {  return ""; }
    // Initial is first item in array
    let nextDueEval = arr[0], nextDueTime = new Date(nextDueEval.date).getTime();
    // Loop through array and keep track of next due date
    arr.forEach(item => {
        const date = new Date(item.date);
        // if date is before next due date, set next due date to this date
        if(date.getTime() < nextDueTime) {
            nextDueEval = item;
            nextDueTime = date.getTime();
        }
    });

    // get time Diff from today to next due date
      const now = new Date().getTime();
      let date = nextDueEval.date;

      let dateString = "";
      if(date.includes(".")) {
        // convert date to YYYY-MM-DD
        dateString = date.split(".");
        date = new Date(dateString[2], dateString[1]-1, dateString[0]);
      } else if(date.includes("-")) {
        dateString = date;
        date = new Date(dateString);
      }
    
      const dueDate = new Date(date).getTime();
      const timeDiff = dueDate - now;
      const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

      setTimeDiff(diffDays);

      // set bg color
      setIsOverdue(diffDays < 0);

      setNextDue(nextDueEval);
  }

  // handle search
  useEffect(() => {
    if(searchTerm.length > 0) {
      const filteredRows = data.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setRows(filteredRows)
    } else { setRows(data) }
  }, [searchTerm, data, setRows])

  const fetchData = async () => {
    setLoading(true);
    const response = await fetch("http://192.168.0.100:30010/api/get");
    const json = await response.json();
    setData(json);
    setRows(data);
    CalculateNextDue(data);
    setLoading(false);
  }

  const renderItem = (item) => {
    return (
        <DataTable.Row key={item._id}>
            <DataTable.Cell>{item.name}</DataTable.Cell>
            <DataTable.Cell>{item.count}</DataTable.Cell>
            <DataTable.Cell>{item.date}</DataTable.Cell>
            <DataTable.Cell>{item.group}</DataTable.Cell>
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
              onChangeText={text => setForm({...form, date: text})}
             />
          </View>
          <View style={styles.formField}>
            <TextInput label="Count" keyboardType='number-pad' 
            onChangeText={text => setForm({...form, count: text})}
            value={form.count} />
          </View>
          <View style={styles.formField}>
            <TextInput label="Place"  />
          </View>
          <View style={{backgroundColor: "#5bc569", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={hideAddModal} color="white" icon="plus-box">Add</Button></View>
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

    <Text style={styles.header}>FoodTracker</Text>
    
    <View style={{
      backgroundColor: '#161616',
      borderRadius: 10,
      padding: 10,
      marginTop: 20,
      }}>
      <Text style={{color: "#fff", margin: 10, fontSize: 17}}>Next due</Text>
      <Text style={{color: "#fff", marginLeft: 10, marginBottom: 20, fontSize: 25, fontWeight: "bold"}}>{nextDue.name}</Text>
      <Text color="#112e15" style={{backgroundColor: isOverdue ? "#372506" : "#112e15", borderRadius: 20, padding: 20}}>{
        timeDiff >= 0 ? <Text style={{color: "#76e790"}}>{`In ${timeDiff} days`}</Text> 
        : <Text style={{color: "#ecae43"}}>{`Overdue since ${Math.abs(timeDiff)} days`}</Text>}</Text>
    </View>

    <View style={{flex: 1, flexDirection: "row", justifyContent: "center", marginBottom: 10, marginTop: 10}}>
      <View style={{backgroundColor: "transparent", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginRight: 10}}><Button onPress={showModal} color="#5bc569" icon="qrcode">Scan</Button></View>
      <View style={{backgroundColor: "#5bc569",     borderColor: "#5bc569", borderRadius: 10, borderWidth: 2,  }}><Button onPress={showAddModal} color="white" icon="plus-box">Add</Button></View>
    </View>
    <View><Searchbar style={styles.input} placeholder="Search..." onChangeText={setSearchTerm}/></View>
    
    <DataTable>
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

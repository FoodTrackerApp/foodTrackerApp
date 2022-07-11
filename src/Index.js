import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, SafeAreaView, FlatList } from 'react-native';
import { DataTable } from 'react-native-paper';
import React from "react";
import { useEffect } from 'react';


  const optionsPerPage = [2, 3, 4];

export default function App() {
  const [text, onChangeText] = React.useState("Test input text");
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const [page, setPage] = React.useState(0);
  const [itemsPerPage, setItemsPerPage] = React.useState(optionsPerPage[0]);

  useEffect(() => {
    setPage(0);
    fetchData();
  }, [])

  const fetchData = async () => {
    setLoading(true);
    const response = await fetch("http://192.168.0.100:30010/api/get");
    const json = await response.json();
    setData(json);
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
      <Text style={styles.header}>FoodTracker</Text>
      <View style={{
        backgroundColor: '#161616',
        borderRadius: 10,
        padding: 10,
        marginTop: 20,
      }}>
        <Text style={{color: "#fff", margin: 10, fontSize: 17}}>Next due</Text>
        <Text style={{color: "#fff", marginLeft: 10, marginBottom: 20, fontSize: 25, fontWeight: "bold"}}>Zwiebeln</Text>
        <Button color="#112e15" title="Zwiebeln" />
      </View>

      <View>
        <TextInput
          style={styles.input}
          onChangeText={onChangeText}
          value={text}
        />
      </View>

      <DataTable>
      <DataTable.Header>
        <DataTable.Title>Name</DataTable.Title>
        <DataTable.Title numeric>#</DataTable.Title>
        <DataTable.Title>Date</DataTable.Title>
        <DataTable.Title>Place</DataTable.Title>
      </DataTable.Header>

      {data.map((item) => (
        renderItem(item)
      ))}

    </DataTable>
      
      <StatusBar style="auto" />
    </SafeAreaView>
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
});

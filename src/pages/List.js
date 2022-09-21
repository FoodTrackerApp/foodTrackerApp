import React from "react";
import { View, Text, ToastAndroid, 
  ScrollView, StyleSheet, Modal,
  SafeAreaView
 } from "react-native"

import Table from "../components/Table";
import { Button,
  TextInput, Checkbox, 
  DataTable, AnimatedFAB
} from "react-native-paper";

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from "expo-crypto";
import * as SQLite from "expo-sqlite";

export default function List({ settings }) {
  const [list, setList] = React.useState([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [form, setForm] = React.useState({name: "", amount: "", isDone: false,  deleted: false, id:""});
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);

    // startup scripts
      // load items on mount
      React.useEffect(() => {
        (async function() {
          await createDatabase();
          await loadDataFromDb();
        })();

      } , []);

    // db
      const db = SQLite.openDatabase("listdb.db");

      const createDatabase = () => {
        return new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              "CREATE TABLE IF NOT EXISTS listdb (id TEXT NOT NULL PRIMARY KEY, name TEXT NOT NULL, amount TEXT NOT NULL, isDone BOOLEAN NOT NULL, deleted BOOLEAN NOT NULL)",
              [],
              () => {
                resolve();
              },
              (_, err) => {
                reject(err);
              }
            )
          })
        })
      }

      // Loads not markd as 'deleted' data, returns promise
      const loadDataFromDb = () => {
        return new Promise((resolve ,reject) => {
          db.transaction((tx) => {
          tx.executeSql(
              `select * from listdb`,
              [],
              async (_,{rows: {_array}}) => {setList(_array.filter(item => item.deleted == 0))},
            )
          });
          resolve();
        }) 
      }

      // Removes everthing from db, returns promise
      const purgeDb = () => {
        return new Promise((resolve, reject) => {
          db.transaction((tx) => {
            tx.executeSql(
              `delete from listdb`,
              [],
              () => {resolve();},
              (_, err) => {reject(err);}
            )
          })
        })
      }

      // Saves single item to db, returns promise
      const saveItemToDb = (item) => {
        return new Promise(async(resolve,reject) => {
            db.transaction((tx) => {
              tx.executeSql(
                `insert into listdb (id, name, amount, isDone, deleted) values (?,?,?,?,?)`,
                [item.id, item.name, item.amount, 0, 0],
                (_,{rows: {_array}}) => {resolve();},
                (_,err) => {reject(err);console.log(err)}
              )
            })
        })
      }

      const updateItem = (item) => {
        return new Promise(async (resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              `update listdb set name = ?, amount = ? where id = ?`,
              [item.name, item.amount, item.id],
              (_,{rows: {_array}}) => {resolve();},
              (_,err) => {reject(err);}
            )
          }) 

          // update in list
          setList(list.map(ele => {
            if(ele.id === item.id) {
              return ele = item;
            }
          }));
        })
      }

      const deleteItem = (item) => {
        return new Promise((resolve, reject) => {
          db.transaction(tx => {
            tx.executeSql(
              `update listdb set deleted = true where id = ?`,
              [item.id],
              (_,{rows: {_array}}) => {resolve();},
              (_,err) => {reject(err);}
            )
          })
          // update in list
          setList(list.filter(ele => {
            if(ele.id !== item.id) {
              return ele;
            }
          }));
        })
      }

    // Modal

      const showModal = () => {
        console.log("Showing modal")
        setModalVisible(true)
      }
      const hideModal = () => {
        console.log("hiding modal")
        setModalVisible(false);
        setIsEditMode(false);
        clearForm();
      }
      const clearForm = () => {
        setForm({name:"", amount:"", isDone: false})
      }

    // Table

      const columns = ["Name", "Amount", "Done"]

      const onRowClick = (item) => {
        setIsEditMode(true);
        setForm(item);
        showModal();
      }

      const markItemAsDone = (item) => {
        console.log("Updating item:", item)
        item.isDone = !item.isDone;

        // update item in db
        db.transaction((tx) => {
          tx.executeSql(
             `update listdb set isDone = ? where id = ?`,
            [item.isDone, item.id]
          )
        })
        // update list
        setList(list.map(item => {
          if(item.id === item.id) {
            item.isDone = item.isDone;
          }
          return item;
        }));
      }

      // removes all isDone items from list and reloads view
      const deleteDone = () => {
        let workList = list;

        workList = workList.filter(item => item.isDone);
        workList.forEach(item => {
          deleteItem(item);
        })

        // refresh view
        loadDataFromDb();
      }

      const tableRenderOverwrite = (item) =>  {
        return (  
        <DataTable.Row onPress={() => onRowClick(item)} key={item.id}>
          <DataTable.Cell>{item.name}</DataTable.Cell>
          <DataTable.Cell>{item.amount}</DataTable.Cell>
          <DataTable.Cell><Checkbox onPress={() => markItemAsDone(item)} status={item.isDone ? "checked" : "unchecked"} /></DataTable.Cell>
        </DataTable.Row>
        )  
      }

      const saveItem = async () => {

        if(isEditMode) {
          await updateItem(form);
          return;
        }

      
        setSaveLoading(true);

        // Make ID
        const id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256, form.name + form.amount + Math.random().toString());

        const itemToSave = {...form, id: id, deleted: false, isDone: false};
        console.log("saving item",itemToSave)

        setForm(itemToSave); // obligatory
        await saveItemToDb(itemToSave);
        setList([...list, {...itemToSave}]);

        setSaveLoading(false);
        hideModal();
        clearForm();
      }
    

    return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
     
      <Modal animationType="slide" visible={modalVisible} onRequestClose={hideModal}>
        <View style={{ flex: 1, justifyContent:"space-between", backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
          <View>
            <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>{isEditMode ? "Save Changes" : "Add new"}</Text>
          <View style={{marginBottom:20}} >
            <TextInput 
              mode="outlined"
              placeholder="Ingwer"
              label="Name"
              value={form.name}
              onChangeText={text => setForm({...form, name: text})}
            />
          </View>
          <View style={{marginBottom:25}}>
            <TextInput 
              mode="outlined"
              label="Amount" 
              placeholder="2"
              dense
              keyboardType="numeric"
              value={form.amount.toString()}
              onChangeText={text => setForm({...form, amount: text})}
            />            
          </View>
          </View>
          <View>
            <Button 
            loading={saveLoading} 
            disabled={saveLoading}
            mode="contained"
            style={{marginBottom:20}}
            icon={isEditMode ? "content-save" : "plus" }
            onPress={saveItem} 
          >
            {isEditMode ? "Save Changes" : "Add"}
          </Button>

          <Button
            mode="elevated"
            icon="close"
            textColor="#ccc"
            onPress={hideModal}>
            Close
          </Button>
        </View>

        </View>
      </Modal>

      <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Shopping List</Text>
  
      <ScrollView>
        <Table 
          overwriteRender={tableRenderOverwrite} 
          onRowClick={onRowClick}
          data={list} 
          columns={columns} 
        />
      </ScrollView>

      <AnimatedFAB
        icon="delete"
        label="Delete done"
        extended={true}
        onPress={() => deleteDone()}
        visible={list.length > 0}
        variant="tertiary"
        animatedForm="left"
        color="#f1b8b4"
        style={{
          bottom: 16,
          left: 16,
          position: 'absolute',
          backgroundColor: "#601410",
        }}
      />
      
      <AnimatedFAB
        icon="plus"
        label="Add"
        extended={true}
        onPress={() => {showModal()}}
        visible={true}
        animatedForm="right"
        style={[styles.fabStyle]}
      />

    </SafeAreaView>
    )
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
      marginBottom: 70,
    },
    fabStyle: {
      bottom: 16,
      right: 16,
      position: 'absolute',
    },
  });
  
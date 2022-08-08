import { IconButton, 
  Button, Divider, TextInput, 
  Switch, HelperText, FAB, Surface, TouchableRipple } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Modal, ToastAndroid } from 'react-native';
import React, { useState } from "react";
import { useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings({ setSettings, settings }) {
    const [form, setForm] = React.useState({serverIP: "", serverPort: "", offlineMode: false});
    const [originalSettings, setOriginalSettings] = React.useState({serverIP: "", serverPort: "", offlineMode: false});
    const [unsavedChanges, setUnsavedChanges] = React.useState(false);
    const [isLoadingSettings, setIsLoadingSettings] = React.useState(false);
    const [isSavingSettings, setIsSavingSettings] = React.useState(false);
    
    const saveSettings = async () => {
      setIsSavingSettings(true);
        try {
        const settings = JSON.stringify(form);
           await AsyncStorage.setItem("settings", settings); 
           setSettings(form);
           ToastAndroid.show("Saved settings", ToastAndroid.SHORT);
        } catch(e) {
            console.log(e);
            ToastAndroid.show("Error saving settings", ToastAndroid.LONG);
        }
      setIsSavingSettings(false);
    }

    const readSettings = async () => {
      setIsLoadingSettings(true);
        try {
            const settings = await AsyncStorage.getItem("settings");
            if(settings !== null) {
                const parsedSettings = JSON.parse(settings);
                setOriginalSettings(parsedSettings);
                setForm(parsedSettings);
                setSettings(form);
            } else {
                ToastAndroid.show("No settings found", ToastAndroid.SHORT);
            }
        } catch(e) {
            console.log(e);
            ToastAndroid.show("Error reading settings", ToastAndroid.LONG);
        }
      setIsLoadingSettings(false);
    }

    // Read settings on mount
    useEffect(() => {
        readSettings();
    }, []);

    // check unsaved changes
    useEffect(() => {
      if(JSON.stringify(form) !== JSON.stringify(originalSettings)) {
        setUnsavedChanges(true);
      }
      else {  
        setUnsavedChanges(false);
      }
    }, [form]);


    return (
    <>
    <View style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
        <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Settings</Text>
  
        <View style={styles.formField}>
            <TextInput 
              mode="outlined"
              placeholder="192.168.234.567"
              label="Server IP"
              outlined
              value={form.serverIP}
              onChangeText={text => {
                setForm({...form, serverIP: text})}}
              keyboardType="numeric"
              right={form.serverIP.length == 0 ? <TextInput.Icon name="exclamation" /> : null}
              activeUnderlineColor={form.serverIP.length == 0 ? "#ecae43" : "#fff"}
            />
        </View>
        <View style={styles.formField}>
            <TextInput 
              mode="outlined"
              dense
              label="Server Port"
              placeholder="30001"
              value={form.serverPort}
              onChangeText={text => setForm({...form, serverPort: text})}
              keyboardType="numeric"
              right={form.serverPort.length == 0 ? <TextInput.Icon name="exclamation" /> : null}
              activeUnderlineColor={form.serverPort.length == 0 ? "#ecae43" : "#fff"}
            />
        </View>
        <View style={{margin: 10, flex: 1, height: 10, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 0}}>
        <TouchableRipple style={{width: "100%", height: 50}} onPress={() => setForm({...form, offlineMode: !form.offlineMode})}>
          <View style={{width: "100%", flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center"}} >
            <Text style={{color:"white", fontSize: 15, height: 15
              , width:150, margin: 10, marginLeft: 5}}>Offline mode</Text>
            <Switch 
              value={form.offlineMode}
              onValueChange={value => setForm({...form, offlineMode: value})}
              color="#76e790"
              style={{ width: 70, marginBottom: 0 }}
            />
          </View>
        </TouchableRipple>
        </View>
        <HelperText type="info" visible={unsavedChanges}>Unsaved Changes</HelperText>
        <Button 
          loading={isLoadingSettings}
          mode="elevated"
          icon="refresh"
          textColor="#ccc"
          onPress={() => readSettings()}>
          Reload
        </Button>
        <View style={{backgroundColor: "#112e15", borderColor: "#112e15", borderRadius: 10, borderWidth: 2, marginTop: 10 }}>
 
          <Button loading={isSavingSettings} 
           onPress={saveSettings} icon="content-save">Save</Button>
        </View>
    </View>
    </>
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
      margin: 10,
    }
  });
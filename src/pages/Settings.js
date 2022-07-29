import { DataTable, Searchbar, IconButton, Button, Divider, TextInput } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Modal, ToastAndroid } from 'react-native';
import React, { useState } from "react";
import { useEffect } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Settings({ setSettings }) {
    const [form, setForm] = React.useState({serverIP: "", serverPort: ""});
    const [originalSettings, setOriginalSettings] = React.useState({serverIP: "", serverPort: ""});

    const saveSettings = async () => {
        try {
        const settings = JSON.stringify(form);
           await AsyncStorage.setItem("settings", settings); 
           setSettings(form);
           ToastAndroid.show("Saved settings", ToastAndroid.SHORT);
        } catch(e) {
            console.log(e);
            ToastAndroid.show("Error saving settings", ToastAndroid.LONG);
        }
    }

    const readSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem("settings");
            if(settings !== null) {
                const parsedSettings = JSON.parse(settings);
                setOriginalSettings(parsedSettings);
                setForm(parsedSettings);
            } else {
                ToastAndroid.show("No settings found", ToastAndroid.SHORT);
            }
        } catch(e) {
            console.log(e);
            ToastAndroid.show("Error reading settings", ToastAndroid.LONG);
        }
    }

    // Read settings on mount
    useEffect(() => {
        readSettings();
    }, []);

    return (
    <>
    <View style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
        <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Settings</Text>
        <View style={styles.formField}>
            <TextInput label="Server IP"
                value={form.serverIP}
                onChangeText={text => setForm({...form, serverIP: text})}
                keyboardType="numeric"
                right={form.serverIP !== originalSettings.serverIP ? <TextInput.Icon name="exclamation" /> : null}
                activeUnderlineColor={form.serverIP !== originalSettings.serverIP ? "#ff0000" : "#fff"}
            />
        </View>
        <View style={styles.formField}>
            <TextInput label="Server Port"
                value={form.serverPort}
                onChangeText={text => setForm({...form, serverPort: text})}
                keyboardType="numeric"
                right={form.serverPort !== originalSettings.serverPort ? <TextInput.Icon name="exclamation" /> : null}
                activeUnderlineColor={form.serverPort !== originalSettings.serverPort ? "#ff0000" : "#fff"}
            />
        </View>
        <View style={{backgroundColor: "#5bc569", borderColor: "#5bc569", borderRadius: 10, borderWidth: 2, marginTop: 10 }}><Button onPress={saveSettings} color="white" icon="content-save">Save</Button></View>
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
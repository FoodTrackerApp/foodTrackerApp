import { StyleSheet, View, Text } from 'react-native';

export default function Analytics() {
  
    return (
    <View style={{ flex: 1, backgroundColor: '#000000', color: "#fff", padding: 20, paddingTop: 60 }}>
        <Text style={{color:"white", fontSize: 20, margin: 10, fontWeight: "bold"}}>Analytics</Text>
    </View>
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
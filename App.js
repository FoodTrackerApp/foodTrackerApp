import * as React from 'react';
import { 
  Provider as PaperProvider, 
  MD3DarkTheme as DefaultTheme,
  BottomNavigation, TouchableRipple
} from 'react-native-paper';
import Home from './src/pages/Home.js';
import Settings from './src/pages/Settings.js';
import Analytics from "./src/pages/Analytics.js";
import List from './src/pages/List.js';

const theme = {
  ...DefaultTheme,
  DarkTheme: true,
  mode: "exact",
  version: 3,
  colors: {
    ...DefaultTheme.colors,

    // light green with dark green bg
    primary: "#5bc569",
    onPrimary: "#112e15",
    primaryContainer: "#112e15",
    onPrimaryContainer: "#76e790",

    // dark green with bright green bg
    secondaryContainer: "#76e790",
    onSecondaryContainer: "#112e15",

    // yellow with dark yellow bg
    tertiaryContainer: "#ecae43",
    onTertiaryContainer: "#112e15",

    onSurface: "#ccc"
    
  }
}


export default function Main() {

  const [settings, setSettings] = React.useState({serverIP: "", serverPort: ""});

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'home', title: 'Home', focusedIcon: 'home', unfocusedIcon: "home" },
    { key: "list", title: "List", focusedIcon: "format-list-bulleted", unfocusedIcon: "format-list-bulleted" },
    { key: 'settings', title: 'Settings', focusedIcon: 'cog', unfocusedIcon: "cog" },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'home':
        return <Home settings={settings} setSettings={setSettings} />;
      case 'settings':
        return <Settings setSettings={setSettings} />;
      case 'analytics':
        return <Analytics settings={settings} />;
      case "list": 
        return <List settings={settings} />;
      default:
        return null;
    }
  }

  return (
    <PaperProvider theme={theme}>
      <BottomNavigation 
        navigationState={ { index, routes } }
        onIndexChange={ setIndex }
        renderScene={ renderScene }
        compact
        labeled={false}
        keyboardHidesNavigationBar={true}
        sceneAnimationType="shifting"
      />
    </PaperProvider>
  );
}
import * as React from 'react';
import { 
  Provider as PaperProvider, 
  DefaultTheme as PaperDefaultTheme,
  DarkTheme as PaperDarkTheme,
  BottomNavigation 
} from 'react-native-paper';
import Home from './src/pages/Home.js';
import Settings from './src/pages/Settings.js';

const theme = {
  ...PaperDarkTheme,
}


export default function Main() {

  const [settings, setSettings] = React.useState({serverIP: "", serverPort: ""});

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'home', title: 'Home', icon: 'home' },
    { key: 'settings', title: 'Settings', icon: 'cog' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'home':
        return <Home settings={settings} />;
      case 'settings':
        return <Settings setSettings={setSettings} />;
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
      />
    </PaperProvider>
  );
}
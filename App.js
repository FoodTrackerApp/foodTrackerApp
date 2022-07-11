import * as React from 'react';
import { 
  Provider as PaperProvider, 
  DefaultTheme as PaperDefaultTheme,
  DarkTheme as PaperDarkTheme 
} from 'react-native-paper';
import App from './src/Index.js';

const theme = {
  ...PaperDarkTheme,
}


export default function Main() {
  return (
    <PaperProvider  theme={theme}>
      <App />
    </PaperProvider>
  );
}
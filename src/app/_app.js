import { createGlobalStyle } from 'styled-components';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import '../styles/globals.css';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  }
`;

// Create a custom theme with primary color
const theme = createTheme({
  palette: {
    primary: {
      main: "#ab0101", 
    },
  },
});

function MyApp({ Component, pageProps }) {
    return (
        <>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <GlobalStyle />
            <Component {...pageProps} />
          </ThemeProvider>
        </>
    );
}

export default MyApp;
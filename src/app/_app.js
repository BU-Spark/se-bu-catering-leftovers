import { useEffect } from 'react';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseApp } from '@/../firebaseConfig';
import { createGlobalStyle } from 'styled-components';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import '@/styles/globals.css';
import { useAuthRedirect } from '/hooks/useAuthRedirect';
import { UserProvider } from '../context/UserContext';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
`;

const theme = createTheme({
    palette: {
        primary: {
            main: "#ab0101",
        },
    },
});

function MyApp({ Component, pageProps }) {
    useAuthRedirect();

    useEffect(() => {
        if (typeof window !== "undefined") {
            isSupported().then((supported) => {
                if (supported) {
                    getAnalytics(firebaseApp);
                    console.log('Firebase Analytics initialized');
                } else {
                    console.log("Firebase Analytics not supported");
                }
            });
        }
    }, []);

    return (
        <>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyle />
                <UserProvider>
                    <Component {...pageProps} />
                </UserProvider>
            </ThemeProvider>
        </>
    );
}

export default MyApp;



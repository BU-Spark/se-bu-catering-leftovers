import { useEffect } from 'react';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { app } from '../../firebaseConfig';
import { createGlobalStyle } from 'styled-components';
import '../styles/globals.css';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
`;

function MyApp({ Component, pageProps }) {
    useEffect(() => {
        if (typeof window !== "undefined") {
            isSupported().then((supported) => {
                if (supported) {
                    getAnalytics(app);
                    console.log('Firebase Analytics initialized');
                } else {
                    console.log("Firebase Analytics not supported");
                }
            });
        }
    }, []);

    return (
        <>
            <GlobalStyle />
            <Component {...pageProps} />
        </>
    );
}

export default MyApp;


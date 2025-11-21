import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import React, { useCallback } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSSO, useUser, useAuth } from '@clerk/clerk-expo';

WebBrowser.maybeCompleteAuthSession();

export type SignInWithProps = {
  strategy: 'oauth_google';
};

export default function SignInWith({ strategy }: SignInWithProps) {
  const { startSSOFlow } = useSSO();
  const { user } = useUser();
  const { signOut } = useAuth();

  const onPress = useCallback(async () => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });

        const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
        if (email && !email.endsWith('@bu.edu')) {
          await signOut();
          return;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [startSSOFlow, strategy, user, signOut]);

  return (
    <Pressable style={styles.button} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Svg viewBox="0 0 48 48" width={24} height={24}>
          <Path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 
            3.6l6.85-6.85C35.9 2.38 30.47 0 
            24 0 14.62 0 6.51 5.38 2.56 
            13.22l7.98 6.19C12.43 13.72 
            17.74 9.5 24 9.5z"
          />
          <Path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 
            2.96-2.26 5.48-4.78 7.18l7.73 
            6c4.51-4.18 7.09-10.36 
            7.09-17.65z"
          />
          <Path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59
            l-7.98-6.19C.92 16.46 0 20.12 
            0 24c0 3.88.92 7.54 2.56 
            10.78l7.97-6.19z"
          />
          <Path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 
            15.89-5.81l-7.73-6c-2.15 
            1.45-4.92 2.3-8.16 2.3-6.26 
            0-11.57-4.22-13.47-9.91l-7.98 
            6.19C6.51 42.62 14.62 48 
            24 48z"
          />
        </Svg>
      </View>
      <Text style={styles.text}>Sign in with Google</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#dadce0',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 1, // shadow on Android
    shadowColor: '#000', // shadow on iOS
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  iconWrapper: {
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    color: '#3c4043',
    fontWeight: '500',
  },
});

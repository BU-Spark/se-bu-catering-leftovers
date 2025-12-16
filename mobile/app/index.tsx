// app/index.tsx - Simple entry point that redirects to welcome
import { Redirect } from 'expo-router';

console.log('index.tsx loaded - redirecting to welcome');

export default function IndexScreen() {
  return <Redirect href="/welcome" />;
}

import { Redirect } from 'expo-router';

// Redirect to landline screen as the main entry point
export default function HomeScreen() {
  return <Redirect href="/landline" />;
}
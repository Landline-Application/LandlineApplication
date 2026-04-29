import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_START_KEY = 'landline_session_start_time';
const SESSION_MODE_KEY = 'landline_session_mode';
const SESSION_END_TIME_KEY = 'landline_session_end_time';

export type SessionMode = 'indefinite' | 'timer';

export async function readSessionStartTime(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(SESSION_START_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export async function writeSessionStartTime(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(SESSION_START_KEY, timestamp.toString());
}

export async function readSessionMode(): Promise<SessionMode | null> {
  const raw = await AsyncStorage.getItem(SESSION_MODE_KEY);
  if (raw === 'indefinite' || raw === 'timer') return raw;
  return null;
}

export async function writeSessionMode(mode: SessionMode): Promise<void> {
  await AsyncStorage.setItem(SESSION_MODE_KEY, mode);
}

export async function readSessionEndTime(): Promise<number | null> {
  const raw = await AsyncStorage.getItem(SESSION_END_TIME_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export async function writeSessionEndTime(timestamp: number | null): Promise<void> {
  if (timestamp == null) {
    await AsyncStorage.removeItem(SESSION_END_TIME_KEY);
  } else {
    await AsyncStorage.setItem(SESSION_END_TIME_KEY, timestamp.toString());
  }
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([SESSION_START_KEY, SESSION_MODE_KEY, SESSION_END_TIME_KEY]);
}

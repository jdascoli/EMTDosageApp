import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Session timeout: 30 minutes in milliseconds
const SESSION_TIMEOUT = 30 * 60 * 1000;
const SESSION_KEY = 'emt_session';
const LAST_ACTIVITY_KEY = 'emt_last_activity';


 // Session data structure
interface Session {
  userId: number;
  userName: string;
  token: string;
  createdAt: number;
  lastActivity: number;
}

/**
 * Create a new session after successful login
 * userId - User's database ID
 * userName - User's name
 * @returns Session token
 */

export async function createSession(
  userId: number,
  userName: string
): Promise<string> {
  // Generate secure random token 
  const tokenBytes = await Crypto.getRandomBytesAsync(16);
  const token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const now = Date.now();

  const session: Session = {
    userId,
    userName,
    token,
    createdAt: now,
    lastActivity: now,
  };

  // Save to secure storage 
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  await SecureStore.setItemAsync(LAST_ACTIVITY_KEY, now.toString());

  return token;
}

/**
 * Get current session if valid
 * @returns Session object or null if invalid/expired
 */

export async function getSession(): Promise<Session | null> {
  try {
    const sessionData = await SecureStore.getItemAsync(SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const session: Session = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session expired
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      await clearSession();
      return null;
    }

    // Update last activity
    session.lastActivity = now;
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    await SecureStore.setItemAsync(LAST_ACTIVITY_KEY, now.toString());

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

//Clear current session (logout)

export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(LAST_ACTIVITY_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

//Check if user is logged in
export async function isLoggedIn(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export async function getCurrentUserId(): Promise<number | null> {
  const session = await getSession();
  return session ? session.userId : null;
}


// Get current user name from session
 
export async function getCurrentUserName(): Promise<string | null> {
  const session = await getSession();
  return session ? session.userName : null;
}
import * as Crypto from 'expo-crypto';

/**
 * Hash a password using SHA-256
 * Takes a plain text password and returns the hashed version as a hex string
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
  return hash;
}

/**
 * Verify a password against a stored hash
 * Compares a plain text password with a previously hashed password from the database
 * Returns true if they match, false otherwise
 */

export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password);
  return hash === storedHash;
}

/**
 * Validate password strength
 * Checks if password meets security requirements:
 */

export function validatePasswordStrength(password: string): {
  isValid: boolean;
  message: string;
} {

  // Check minimum length
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters',
    };
  }

  // Check if contains at least one number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  // Check if contains at least one letter
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) {
    return {
      isValid: false,
      message: 'Password must contain at least one letter',
    };
  }

  return {
    isValid: true,
    message: 'Password is strong',
  };
}
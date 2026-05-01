export const AUTH_VALIDATION_MESSAGES = {
  invalidEmail: 'Enter a valid email address (e.g. name@example.com).',
  passwordComplexity: 'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.',
  confirmMismatch: 'Confirm password must match password.',
} as const;

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getEmailError(email: string) {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required.';
  if (!isValidEmail(trimmed)) return AUTH_VALIDATION_MESSAGES.invalidEmail;
  return null;
}

export function getUsernameError(username: string) {
  const trimmed = username.trim();
  if (!trimmed) return 'Username is required.';
  return null;
}

export function getLoginHintError(loginHint: string) {
  const trimmed = loginHint.trim();
  if (!trimmed) return 'Email or username is required.';
  if (trimmed.includes('@') && !isValidEmail(trimmed)) return AUTH_VALIDATION_MESSAGES.invalidEmail;
  return null;
}

export function getPasswordError(password: string) {
  if (!password) return 'Password is required.';
  if (password.length < 8) return AUTH_VALIDATION_MESSAGES.passwordComplexity;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (!hasUpper || !hasLower || !hasNumber) return AUTH_VALIDATION_MESSAGES.passwordComplexity;
  return null;
}

export function getConfirmPasswordError(password: string, confirmPassword: string) {
  if (!confirmPassword) return 'Confirm password is required.';
  if (password !== confirmPassword) return AUTH_VALIDATION_MESSAGES.confirmMismatch;
  return null;
}


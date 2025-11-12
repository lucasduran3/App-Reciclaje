export default function validatePasswordStrength(password) {
  const strength = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(strength).filter(Boolean).length;

  return {
    ...strength,
    score,
    level: score < 3 ? "weak" : score < 4 ? "medium" : "strong",
    isValid:
      strength.length &&
      strength.uppercase &&
      strength.lowercase &&
      strength.number,
  };
}

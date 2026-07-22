export const validatePassword = (pwd) => {
  if (!pwd) return [];
  const errors = [];
  if (pwd.length < 10) errors.push('Mínimo 10 caracteres');
  if (!/[A-Z]/.test(pwd)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(pwd)) errors.push('Al menos una minúscula');
  if (!/\d/.test(pwd)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\-]./.test(pwd)) errors.push('Al menos un carácter especial');
  return errors;
};

// Validaciones reutilizables del backend (BUG-003 y BUG-004)
// El backend NO debe confiar solo en la validación del cliente.

// Longitud mínima de contraseña (igual que el cliente)
const PASSWORD_MIN = 6;

// Valida el formato básico de un correo electrónico
const isValidEmail = (email) => {
    if (typeof email !== 'string') return false;
    // algo@algo.dominio  (sin espacios)
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
};

// Valida la longitud mínima de la contraseña
const isValidPassword = (password) => {
    return typeof password === 'string' && password.length >= PASSWORD_MIN;
};

module.exports = { PASSWORD_MIN, isValidEmail, isValidPassword };

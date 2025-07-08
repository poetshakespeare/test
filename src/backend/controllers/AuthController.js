import { v4 as uuid } from "uuid";
import { Response } from "miragejs";
import { formatDate } from "../utils/authUtils";
const sign = require("jwt-encode");

/**
 * All the routes related to Auth are present here.
 * These are Publicly accessible routes.
 * */

/**
 * This handler handles user signups.
 * send POST Request at /api/auth/signup
 * body contains {firstName, lastName, email, password}
 * */

export const signupHandler = function (schema, request) {
  const { email, password, ...rest } = JSON.parse(request.requestBody);
  try {
    // Validación básica de email - acepta cualquier formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        422,
        {},
        {
          errors: ["Por favor ingresa un email válido."],
        }
      );
    }

    // Validación de contraseña
    if (!password || password.length < 6) {
      return new Response(
        422,
        {},
        {
          errors: ["La contraseña debe tener al menos 6 caracteres."],
        }
      );
    }

    // check if email already exists
    const foundUser = schema.users.findBy({ email });
    if (foundUser) {
      return new Response(
        422,
        {},
        {
          errors: ["Este email ya está registrado. Intenta con otro email."],
        }
      );
    }

    const _id = uuid();
    const newUser = {
      _id,
      email,
      password,
      createdAt: formatDate(),
      updatedAt: formatDate(),
      ...rest,
      cart: [],
      wishlist: [],
    };
    const createdUser = schema.users.create(newUser);
    const encodedToken = sign({ _id, email }, process.env.REACT_APP_JWT_SECRET || 'Jai Radha Madhav');
    return new Response(201, {}, { createdUser, encodedToken });
  } catch (error) {
    return new Response(
      500,
      {},
      {
        error: "Error interno del servidor. Intenta nuevamente.",
      }
    );
  }
};

/**
 * This handler handles user login.
 * send POST Request at /api/auth/login
 * body contains {email, password}
 * */

export const loginHandler = function (schema, request) {
  const { email, password } = JSON.parse(request.requestBody);
  try {
    // Verificar si es el super administrador
    if (email === 'admin@gadaelectronics.com' && password === 'root') {
      const adminUser = {
        _id: 'admin-super-user',
        firstName: 'Super',
        lastName: 'Administrador',
        email: 'admin@gadaelectronics.com',
        createdAt: formatDate(),
        updatedAt: formatDate(),
        cart: [],
        wishlist: [],
        isAdmin: true
      };
      
      const encodedToken = sign(
        { _id: adminUser._id, email: adminUser.email, isAdmin: true },
        process.env.REACT_APP_JWT_SECRET || 'Jai Radha Madhav'
      );
      
      return new Response(200, {}, { foundUser: adminUser, encodedToken });
    }

    const foundUser = schema.users.findBy({ email });
    if (!foundUser) {
      return new Response(
        404,
        {},
        { errors: ["El email ingresado no está registrado. Verifica tu email o regístrate."] }
      );
    }
    if (password === foundUser.password) {
      const encodedToken = sign(
        { _id: foundUser._id, email },
        process.env.REACT_APP_JWT_SECRET || 'Jai Radha Madhav'
      );
      // Crear una copia del usuario sin la contraseña
      const userWithoutPassword = { ...foundUser.attrs };
      delete userWithoutPassword.password;
      return new Response(200, {}, { foundUser: userWithoutPassword, encodedToken });
    }
    return new Response(
      401,
      {},
      {
        errors: [
          "La contraseña es incorrecta. Verifica tu contraseña e intenta nuevamente.",
        ],
      }
    );
  } catch (error) {
    return new Response(
      500,
      {},
      {
        error: "Error interno del servidor. Intenta nuevamente.",
      }
    );
  }
};
import { v4 as uuid } from 'uuid';
import { formatDate } from '../utils/authUtils';

/**
 * User Database can be added here.
 * You can add default users of your wish with different attributes
 * Every user will have cart (Quantity of all Products in Cart is set to 1 by default), wishList by default
 * */

export const users = [
  {
    _id: uuid(),
    firstName: 'Yero',
    lastName: 'Shop',
    email: 'yero.shop@gmail.com',
    password: 'yeroi1234',
    createdAt: formatDate(),
    updatedAt: formatDate(),
    cart: [],
    wishlist: [],
  },
  // Usuario adicional para pruebas
  {
    _id: uuid(),
    firstName: 'Usuario',
    lastName: 'Invitado',
    email: 'invitado@tienda.com',
    password: '123456',
    createdAt: formatDate(),
    updatedAt: formatDate(),
    cart: [],
    wishlist: [],
  },
];
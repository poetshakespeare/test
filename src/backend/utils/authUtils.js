import { Response } from "miragejs";
import dayjs from "dayjs";
import jwt_decode from "jwt-decode";

export const requiresAuth = function (request) {
  const encodedToken = request.requestHeaders.authorization;
  if (!encodedToken) {
    return new Response(
      401,
      {},
      { errors: ["Token de autorización requerido. Por favor inicia sesión."] }
    );
  }

  try {
    const decodedToken = jwt_decode(
      encodedToken,
      process.env.REACT_APP_JWT_SECRET || 'Jai Radha Madhav'
    );
    if (decodedToken) {
      const user = this.db.users.findBy({ email: decodedToken.email });
      if (user) {
        return user._id;
      }
    }
  } catch (error) {
    return new Response(
      401,
      {},
      { errors: ["Token inválido. Por favor inicia sesión nuevamente."] }
    );
  }

  return new Response(
    401,
    {},
    { errors: ["Token inválido. Acceso no autorizado."] }
  );
};

export const formatDate = () => dayjs().format("YYYY-MM-DDTHH:mm:ssZ");
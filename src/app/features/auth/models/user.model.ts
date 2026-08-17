/**
 * Modelo de dominio de un usuario según el backend mock.
 *
 * El backend mock (`db.json`) devuelve usuarios con estos campos.
 * El campo `password` solo aparece cuando la api se consulta para
 * validar el login; nunca debe llegar a la UI ni quedarse en estado
 * público.
 */
export interface User {
  /** json-server emite ids como string incluso cuando el seed es numérico. */
  readonly id: string;
  readonly name: string;
  readonly password: string;
  readonly email: string;
  readonly avatar: string;
}

export type PublicUser = Omit<User, 'password'>;

export interface LoginCredentials {
  readonly name: string;
  readonly password: string;
}

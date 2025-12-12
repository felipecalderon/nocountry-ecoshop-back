export interface JwtPayload {
  sub: string;

  email: string;

  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;

  iat?: number;
  exp?: number;
  [key: string]: any;
}

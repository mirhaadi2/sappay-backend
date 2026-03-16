import jwt, { Secret } from "jsonwebtoken";
import { config } from "./index";
import { JwtPayload } from "../types/auth";

const jwtSecret: Secret = config.jwt.secret;

export const signJwt = (payload: JwtPayload) => {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: config.jwt.expiresIn as any,
  } as any);
};

export const verifyJwt = (token: string) => {
  return jwt.verify(token, jwtSecret) as JwtPayload;
};

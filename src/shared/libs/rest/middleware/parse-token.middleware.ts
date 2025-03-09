import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { StatusCodes } from 'http-status-codes';

import { createSecretKey } from 'node:crypto';

import { Middleware } from './middleware.interface.js';
import { HttpError } from '../errors/index.js';
import { TokenPayload } from '../../../models/token-payload.type.js';

function isTokenPayload(payload: unknown): payload is TokenPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'email' in payload &&
    typeof payload.email === 'string' &&
    'name' in payload &&
    typeof payload.name === 'string' &&
    'id' in payload &&
    typeof payload.id === 'string'
  );
}

class ParseTokenMiddleware implements Middleware {
  constructor(private readonly jwtSecret: string) {}

  public async execute(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const authorizationHeader = req.headers?.authorization?.split(' ');
    if (!authorizationHeader) {
      return next();
    }

    const [, token] = authorizationHeader;

    try {
      const { payload } = await jwtVerify(
        token,
        createSecretKey(this.jwtSecret, 'utf-8'),
      );

      if (!isTokenPayload(payload)) {
        throw new Error('Invalid token');
      }

      req.tokenPayload = payload;
      return next();
    } catch (err) {
      return next(
        new HttpError(
          StatusCodes.UNAUTHORIZED,
          (err as Error).message,
          'AuthenticateMiddleware',
        ),
      );
    }
  }
}

export { ParseTokenMiddleware };

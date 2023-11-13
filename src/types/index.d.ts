import { AuthPayload } from '../dto/Auth.dto';

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

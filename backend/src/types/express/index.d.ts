import 'multer';
import { User } from '../../types';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
      user?: User & { id: string };
    }
  }
}
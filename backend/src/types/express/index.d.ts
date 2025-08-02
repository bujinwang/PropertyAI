import 'multer';
import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
      files?: Express.Multer.File[];
      user?: User;
    }
  }
}
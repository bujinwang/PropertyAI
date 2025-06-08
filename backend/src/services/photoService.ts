import sharp from 'sharp';
import { AppError } from '../middleware/errorMiddleware';

export const optimizePhoto = async (inputBuffer: Buffer, options: { width?: number; height?: number; quality?: number; format?: keyof sharp.FormatEnum }) => {
  try {
    let transformer = sharp(inputBuffer);

    if (options.width || options.height) {
      transformer = transformer.resize(options.width, options.height);
    }

    if (options.format) {
      transformer = transformer.toFormat(options.format, { quality: options.quality || 80 });
    } else if (options.quality) {
      transformer = transformer.jpeg({ quality: options.quality });
    }

    return transformer.toBuffer();
  } catch (error) {
    throw new AppError('Failed to optimize photo', 500);
  }
};

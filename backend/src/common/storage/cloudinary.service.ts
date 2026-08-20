import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import sharp from 'sharp';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from 'dotenv';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadBuffer(
    buffer: Buffer,
    options: {
      folder: string;
      publicId?: string;
      width?: number;
      height?: number;
    },
  ): Promise<UploadApiResponse> {
    try {
      // resize/compress with sharp before sending
      const transformed = await sharp(buffer)
        .resize(options.width ?? null, options.height ?? null, {
          fit: 'inside',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder,
            public_id: options.publicId,
            resource_type: 'image',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error || !result) {
              reject(new Error(error?.message ?? 'Upload Cloudinary vide.'));
              return;
            }
            resolve(result);
          },
        );

        uploadStream.end(transformed);
      });
    } catch (error) {
      this.logger.error("Échec de l'upload vers Cloudinary", error);
      throw new InternalServerErrorException('Upload image failed');
    }
  }

  async delete(publicId: string): Promise<{ result: string }> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    }) as Promise<{ result: string }>;
  }
}

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './interfaces/cloudinary-response.interface';
import * as streamifier from 'streamifier';

@Injectable()
export class FilesService {
  uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'ecoshop_products',
          resource_type: 'auto',
          transformation: [
            { width: 1000, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }
}

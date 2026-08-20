import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  getProductImageUrl(filename: string): string {
    return `/uploads/products/${filename}`;
  }
}

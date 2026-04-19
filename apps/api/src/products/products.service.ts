import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  findAll() {
    return { module: 'products', data: [] };
  }
}

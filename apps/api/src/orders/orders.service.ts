import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  findAll() {
    return { module: 'orders', data: [] };
  }
}

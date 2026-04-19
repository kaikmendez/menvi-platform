import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomersService {
  findAll() {
    return { module: 'customers', data: [] };
  }
}

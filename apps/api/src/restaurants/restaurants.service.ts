import { Injectable } from '@nestjs/common';

@Injectable()
export class RestaurantsService {
  findAll() {
    return { module: 'restaurants', data: [] };
  }
}

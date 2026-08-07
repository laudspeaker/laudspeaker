import { Customer } from '../entities/customer.entity';
import { FindType } from '../enums/FindType.enum';

export interface CustomerSearchOptionResult {
  customer: Customer;
  findType: FindType;
}

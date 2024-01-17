import { IsArray, IsString } from 'class-validator';

export class DeleteBatchedCustomersDto {
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];
}

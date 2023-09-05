import { IsArray, IsString } from 'class-validator';

export class GetBulkCustomerCountDto {
  @IsArray()
  @IsString({ each: true })
  stepIds: string[];
}

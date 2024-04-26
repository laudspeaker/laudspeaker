import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// Might need update on workspace and organization separate management
export class UpdateOrganizationDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public name: string;
}

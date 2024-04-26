import { Trim } from 'class-sanitizer';
import {
  IsOptional,
  IsString,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

export function IsUTCOffset(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUTCOffset',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const regexp = /^UTC([+-])(0[0-9]|1[0-3]):([0-5][0-9])$/;
          return typeof value === 'string' && regexp.test(value);
        },
      },
    });
  };
}

export class UpdateWorkspaceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @Trim()
  @IsOptional()
  @IsUTCOffset('timezoneUTCOffset', {
    message: 'Timezone must be in format UTC(+/-)hh:mm',
  })
  public timezoneUTCOffset?: string; // must be in format `UTC(+/-)hh:mm`
}

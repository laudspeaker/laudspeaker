import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsString,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsUTCOffset(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: Object, propertyName: string) {
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

// Might need update on workspace and organization separate management
export class UpdateOrganizationDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsUTCOffset('timezoneUTCOffset', {
    message: 'Timezone must be in format UTC(+/-)hh:mm',
  })
  public timezoneUTCOffset: string; // must be in format `UTC(+/-)hh:mm`
}


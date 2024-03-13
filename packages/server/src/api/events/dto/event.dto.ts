import { Trim } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { ValidationArguments } from 'class-validator';

@ValidatorConstraint({ name: 'array-or-string', async: false })
export class IsArrayOrString implements ValidatorConstraintInterface {
  validate(text: any, args: ValidationArguments) {
    return (
      (Array.isArray(text) &&
        text.every((val, i, arr) => typeof val === 'string')) ||
      typeof text === 'string'
    );
  }

  defaultMessage(args: ValidationArguments) {
    return '($value) must be an array of strings or string';
  }
}

export class EventDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public correlationKey: string;

  @Validate(IsArrayOrString)
  correlationValue?: string | string[];

  @Trim()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public source?: string;

  @IsOptional()
  public payload?: any;

  @IsNotEmpty()
  public event: any;

  @IsOptional()
  public timestamp?: Date;

  @IsOptional()
  public uuid?: string;

}

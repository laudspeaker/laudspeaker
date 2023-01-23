import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RemoveAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  public password: string;
}

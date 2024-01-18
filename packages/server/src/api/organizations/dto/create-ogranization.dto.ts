import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsUTCOffset } from './update-organization.dto';

export class CreateOrganizationDTO {
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

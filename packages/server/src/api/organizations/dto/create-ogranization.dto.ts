import { IsUTCOffset } from '@/api/workspaces/dto/update-workspace.dto';
import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsString } from 'class-validator';

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

import { ToDate, Trim } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsObject,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Eventtype } from '../interfaces/event.interface';

export class RudderEventDto {
  //https://www.rudderstack.com/docs/event-spec/standard-events/common-fields/

  @IsEnum(Eventtype)
  @IsNotEmpty()
  public type: Eventtype;

  @IsString()
  @IsOptional()
  public event: string;

  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  public sentAt: Date;

  @ValidateIf((o) => !o.anonymousId)
  @Trim()
  @IsNotEmpty()
  public userId: string;

  @ValidateIf((o) => !o.userId)
  @Trim()
  @IsNotEmpty()
  public anonymousId: string;

  @IsString()
  @IsNotEmpty()
  public channel: string;

  @IsObject()
  @IsOptional()
  //object
  public context: any;

  @Trim()
  @IsNotEmpty()
  public rudderId: string;

  @IsString()
  @IsOptional()
  public messageId: string;

  @ValidateIf((o) => !o.originalTimestamp)
  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  public timestamp: Date;

  //object
  @IsObject()
  @IsOptional()
  public properties: any;

  //could add later if we want for rudder
  //"receivedAt": "2022-07-28T18:32:52.409Z",
  //"request_ip": "44.205.89.55",
  //"anonymousId":

  @ValidateIf((o) => !o.timestamp)
  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  public originalTimestamp: Date;
}

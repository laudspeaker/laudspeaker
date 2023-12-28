import { IsObject } from 'class-validator';

export class CountSegmentUsersSizeDTO {
  @IsObject()
  public inclusionCriteria: any;
}

import { Trim } from 'class-sanitizer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { InclusionCriteria } from '../types/segment.type';

export class CreateSegmentDTO {
    @IsString()
    @Trim()
    @IsNotEmpty()
    name: string;

    @IsObject()
    @IsOptional()
    public inclusionCriteria: InclusionCriteria;
}
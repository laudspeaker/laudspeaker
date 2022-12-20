import { Trim } from 'class-sanitizer';
import {
  IsString,
  IsOptional,
} from 'class-validator';

export class SearchQueryDTO {
    @IsOptional()
    @IsString()
    @Trim()
    searchText?: string
}

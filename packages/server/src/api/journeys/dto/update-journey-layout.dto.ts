import { IsOptional, IsString, IsArray } from 'class-validator';
import { Edge, Node } from 'reactflow';
import { EdgeData, NodeData } from '../types/visual-layout.interface';

export class UpdateJourneyLayoutDto {
  @IsString()
  id: string;

  @IsArray()
  @IsOptional()
  public nodes?: Node<NodeData>[];

  @IsArray()
  @IsOptional()
  public edges?: Edge<EdgeData>[];
}

import {
    IsOptional,
    IsJSON,
    IsString,
} from 'class-validator';
import {
    Edge,
    Node,
} from "reactflow";
import { EdgeData, NodeData } from '../types/visual-layout.interface';

export class UpdateJourneyLayoutDto {
    @IsString()
    id: string;
    
    @IsJSON()
    @IsOptional()
    public nodes?: Node<NodeData>[];

    @IsJSON()
    @IsOptional()
    public edges?: Edge<EdgeData>[];
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerKeysDocument = CustomerKeys & Document;

export enum AttributeType {
  STRING = 'String',
  NUMBER = 'Number',
  BOOLEAN = 'Boolean',
  EMAIL = 'Email',
  DATE = 'Date',
  ARRAY = 'Array',
  OBJECT = 'Object',
}

@Schema()
export class CustomerKeys {
  @Prop()
  key: string;

  @Prop()
  type: AttributeType;

  @Prop()
  isArray: boolean;

  @Prop()
  isPrimary: boolean;

  @Prop()
  ownerId: string;
}

export const CustomerKeysSchema = SchemaFactory.createForClass(CustomerKeys);

import {
  Query,
  QueryContext,
  QueryConverter,
  NodeFactory,
  QueryFormat,
} from "../../";

export class QueryFormatterBase {
  input: any;
  context: QueryContext;
	nodeFactory = new NodeFactory();

  constructor(input: any, context: QueryContext) {
  	this.input = input;
    this.context = context;
  }
}
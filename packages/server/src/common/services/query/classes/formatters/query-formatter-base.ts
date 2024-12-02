import {
  Query,
  NodeFactory,
} from "../../";

export class QueryFormatterBase {
  input: any;
	nodeFactory = new NodeFactory();

  constructor(input: any) {
  	this.input = input;
  }
}
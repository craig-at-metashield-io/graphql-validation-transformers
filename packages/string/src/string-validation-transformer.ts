import { TransformerSchemaVisitStepContextProvider, } from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, FieldDefinitionNode, Kind } from 'graphql';

import { IAbstractArguments, AbstractValidationTransformer } from '@graphql-validation-transformers/common';

interface IStringArguments extends IAbstractArguments {
   min: number;
   max: number;
   nows: boolean,
   regex: string,
}

export class StringValidationTransformer extends AbstractValidationTransformer<IStringArguments> {
   protected xname = '@xstring';

   private readonly defaults: IStringArguments = {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      nows: false,
      regex: '',
   }

   constructor() {
      super('graphql-string-validation-transformer', `directive @xstring(min: Int, max: Int, nows: Boolean, regex: String) on FIELD_DEFINITION`);
   }

   public field (parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, field: FieldDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) {
      // directive asserts
      this.assertTypeIs(['String'], field.type);
      this.assertParentIsNotInterface(parent);
      this.assertParentHasModelDirective(parent);      
      this.assertMinimumArguments(1, directive.arguments?.length || 0);      

      // resolve arguments
      const xargs = this.resolveArguments(this.defaults, [...(directive.arguments || [])]);

      // argument asserts
      this.assertPositive('min', xargs.min);
      this.assertAscending([{ arg: 'min', val: xargs.min }, { arg: 'max', val: xargs.max }]);
      
      // add to type's directive set
      const nullable = field.type.kind !== Kind.NON_NULL_TYPE;
      this.add(parent as ObjectTypeDefinitionNode, 'String', parent.name.value, field.name.value, xargs, nullable);      
   }

   public generateValidation(field: string, args: IStringArguments): string {
      const conditionals: string[] = [];
      if (args.min > this.defaults.min) {
         conditionals.push(this.minLength(field, args.min));
      }
      if (args.max < this.defaults.max) {
         conditionals.push(this.maxLength(field, args.max));
      }
      if (args.nows !== this.defaults.nows) {
         conditionals.push(this.noWhiteSpace(field));
      }
      if (args.regex !== this.defaults.regex) {
         conditionals.push(this.regex(field, args.regex));
      }
      return conditionals.join(' && ');
   }
}

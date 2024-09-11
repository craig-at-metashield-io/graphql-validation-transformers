import { TransformerSchemaVisitStepContextProvider, } from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, FieldDefinitionNode, Kind } from 'graphql';

import { IAbstractArguments, AbstractValidationTransformer } from '@graphql-validation-transformers/common';

interface INumberArguments extends IAbstractArguments {
   min: number;
   max: number;
}

export class NumberValidationTransformer extends AbstractValidationTransformer<INumberArguments> {
   protected xname = '@xnumber';

   private readonly defaults: INumberArguments = {
      min: Number.MIN_SAFE_INTEGER,
      max: Number.MAX_SAFE_INTEGER,
   }

   constructor() {
      super('graphql-number-validation-transformer', `directive @xnumber(min: Int, max: Int) on FIELD_DEFINITION`);
   }

   public field = (parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, field: FieldDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => {
      // directive asserts
      this.assertTypeIs(['Int', 'Float'], field.type);
      this.assertParentIsNotInterface(parent);
      this.assertParentHasModelDirective(parent);      
      this.assertMinimumArguments(1, directive.arguments?.length || 0);      

      // resolve arguments
      const xargs = this.resolveArguments(this.defaults, [...(directive.arguments || [])]);

      // argument asserts      
      this.assertAscending([{ arg: 'min', val: xargs.min }, { arg: 'max', val: xargs.max }]);
      
      // add to type's directive set
      const nullable = field.type.kind !== Kind.NON_NULL_TYPE;
      this.add(parent as ObjectTypeDefinitionNode, 'Number', parent.name.value, field.name.value, xargs, nullable);      
   }

   public generateValidation(field: string, args: INumberArguments): string {
      const conditionals: string[] = [];
      if (args.min > this.defaults.min) {
         conditionals.push(this.minValue(field, args.min));
      }
      if (args.max < this.defaults.max) {
         conditionals.push(this.maxValue(field, args.max));
      }
      return conditionals.join(' && ');
   }

}

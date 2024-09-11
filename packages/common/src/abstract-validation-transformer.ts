import { InvalidDirectiveError, TransformerPluginBase, MappingTemplate, InputObjectDefinitionWrapper } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider, TransformerSchemaVisitStepContextProvider, TransformerTransformSchemaStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode, TypeNode, Kind, ArgumentNode, FieldDefinitionNode, DirectiveNode } from 'graphql';
import { printBlock, iff, not, raw, parens, and, ref, or } from 'graphql-mapping-template';
import { ModelResourceIDs } from 'graphql-transformer-common';

export interface IAbstractArguments { }

export interface IValidationDirective {
   xparent: ObjectTypeDefinitionNode;
   xtype: string;
   xfield: string;
   xargs: IAbstractArguments;
   vtl: string;
}

export abstract class AbstractValidationTransformer<T extends IAbstractArguments> extends TransformerPluginBase {
   protected xname: string = 'xabstract';

   private xmap = new Map<string, IValidationDirective[]>();

   constructor(transformer: string, schema: string) {
      super(transformer, schema);
   }

   public abstract field (parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode, field: FieldDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider): void;

   public generateResolvers = (ctx: TransformerContextProvider) => {      
      const mutant = ctx.output.getMutationTypeName();
      if (!!mutant) {
         for (const xtype of this.xmap.keys()) {
            const directives = this.xmap.get(xtype)!;
            const code = directives.reduce((p, c) => p + c.vtl + '\n', '').concat('{}');                  

            const crid = `create${xtype}`;
            const cres = mutant ? ctx.resolvers.getResolver(mutant, crid) : null;            
            cres?.addToSlot('init', MappingTemplate.s3MappingTemplateFromString(code, `${mutant}.${crid}.{slotName}.{slotIndex}.req.vtl`));
         
            const urid = `update${xtype}`;
            const ures = mutant ? ctx.resolvers.getResolver(mutant, `${urid}`) : null;            
            ures?.addToSlot('init', MappingTemplate.s3MappingTemplateFromString(code, `${mutant}.${urid}.{slotName}.{slotIndex}.req.vtl`));
         }   
      }               
   }

   public transformSchema (ctx: TransformerTransformSchemaStepContextProvider): void {
      for (const xtype of this.xmap.keys()) {
         const name = ModelResourceIDs.ModelCreateInputObjectName(xtype);
         for (const config of this.xmap.get(xtype)!) {
            const input = InputObjectDefinitionWrapper.fromObject(name, config.xparent, ctx.inputDocument);
            const wrapper = input.fields.find((f) => f.name === config.xfield);
            wrapper?.makeNullable(); // do i need this?
         }
      }
   };   

   protected abstract generateValidation(field: string, args: IAbstractArguments): string;
   
   protected add(xparent: ObjectTypeDefinitionNode, type: string, xtype: string, xfield: string, xargs: IAbstractArguments, nullable: boolean) {
      const vfield = `$ctx.args.input.${xfield}`;
      const vlogic = this.generateValidation(vfield, xargs);

      const jargs = JSON.stringify(xargs).replace(/"/g, "'");
      
      const expression = iff(
         or([...(nullable ? [parens(raw(`$util.isNull(${vfield})`))] : []), not(parens(raw(vlogic)))]),
         ref(`util.error('${this.xname} assertion error on ${xfield} in ${xtype}',  'AssertionError', null,
               {
                  "type": "assertion",
                  "condition": \"${jargs}\",
                  "name": \"${xfield}\",
                  "value": ${vfield}        
               })`)
      );

      const vtl = printBlock(`${type} validation for "${xfield}" (${jargs})`)(expression);      
      
      if (!this.xmap.has(xtype)) {
         this.xmap.set(xtype, []);
      }

      this.xmap.get(xtype)!.push({ xparent, xtype, xfield, xargs, vtl });
   }

   protected assertTypeIs(assert: string[], type: TypeNode) {
      if (type.kind === Kind.NON_NULL_TYPE) {
         this.assertTypeIs(assert, type.type);
      } else if (type.kind === Kind.NAMED_TYPE) {
         if (!assert.includes(type.name.value)) {
            throw new InvalidDirectiveError(`The ${this.xname} directive can be used only on ${assert.join(', ')} fields.`);
         };
      }
   }

   protected assertParentIsNotInterface(parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode): void {
      if (parent.kind === Kind.INTERFACE_TYPE_DEFINITION) {
         throw new InvalidDirectiveError(`The ${this.xname} directive cannot be placed on an interface's field.`);
      }
   }

   protected assertParentHasModelDirective(parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode) {
      if (!parent.directives?.find((d) => d.name.value === 'model')) {
         throw new InvalidDirectiveError(`The ${this.xname} directive can be used only on types with the @model directive.`);
      }
   }

   protected assertMinimumArguments(min: number, count: number) {
      if (count < min) {
         throw new InvalidDirectiveError(`The ${this.xname} directive requires at least one argument.`);
      }
   }

   protected resolveArguments(defaults: T, args: ArgumentNode[]) {
      return { ...defaults, ...args.reduce((p, c) => ({ ...p, [c.name.value]: this.argumentValue(c) }), {}) };
   }

   protected argumentValue(a: ArgumentNode): number | string | boolean {
      switch (a.value.kind) {
         case 'IntValue': return Number.parseInt(a.value.value);
         case 'BooleanValue': return a.value.value;
         case 'StringValue': return a.value.value;
      }

      // snh - the graphql parser should toss an error before it gets to this transformer
      throw new InvalidDirectiveError(`The '${a.name}' argument has been assigned an incorrect type.`);
   }

   protected assertPositive(arg: string, val: number) {
      if (val < 0) {
         throw new InvalidDirectiveError(`The '${arg}' argument requires a positive value.`);
      }
   }

   protected assertAscending(args: { arg: string, val: number }[]) {
      if (args.length > 1) {
         for (let n = 1; n < args.length; n++) {
            if (args[n - 1].val >= args[n].val) {               
               throw new InvalidDirectiveError(`The '${args[n].arg}' argument must be greater or equal to the ${args[n - 1].arg}.`);
            }
         }
      }
   }   

   protected minLength(field: string, min: number) {
      return `${field}.length() >= ${min}`;
   }

   protected maxLength(field: string, max: number) {
      return `${field}.length() <= ${max}`;
   }

   protected noWhiteSpace(field: string) {
      return `${field}.matches('^[^\\s].+[^\\s]$')`;
   }

   protected regex(field: string, regex: string) {
      return `${field}.matches('${regex}')`;
   }

   protected minValue(field: string, min: number) {
      return `${field} >= ${min}`;
   }

   protected maxValue(field: string, max: number) {
      return `${field} <= ${max}`;
   }
}
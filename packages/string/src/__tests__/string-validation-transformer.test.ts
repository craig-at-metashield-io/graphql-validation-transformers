import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';

import { StringValidationTransformer } from '../string-validation-transformer';


describe('StringValidationTransformer', () => {

   describe('when acting as a field directive', () => {
      const transformer = new GraphQLTransform({
         // @ts-ignore
         transformers: [new ModelTransformer(), new StringValidationTransformer()],
      });

      test('@xstring directive can be used on string fields', () => {
         const schema = `
            type StringTestModel01 @model {
               id: ID!
               onefish: String @xstring(min: 1, max: 10, nows: true)
               twofish: String! @xstring(min: 4, max: 6)
               redfish: String! @xstring(min: 2)         
            }`;

         expect(() => transformer.transform(schema)).not.toThrow();
      });

      test('@xstring directive cannot be used on non-string fields', () => {
         const schema = `
            type StringTestModel02 @model {
               id: ID!
               dedfish: Int @xstring(min: 1, max: 10, nows: true)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xstring directive can be used only on String fields.`);
      });

      test('@xstring directive cannot be used on an interface', () => {
         const schema = `
            interface StringTestInterface01 {
               id: ID!
               dedfish: String @xstring(min: 1, max: 10, nows: true)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xstring directive cannot be placed on an interface's field.`);
      });

      test('@xstring directive requires at least 1 argument', () => {
         const schema = `
            type StringTestModel03 @model {
               id: ID!
               dedfish: String @xstring
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xstring directive requires at least one argument.`);
      });

      test('@xstring directive can only be used on types with the @model directive', () => {
         const schema = `
            type StringTestModel04 {
               id: ID!
               dedfish: String @xstring(min: 1, max: 10, nows: true)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xstring directive can be used only on types with the @model directive.`);
      });

      test('@xstring directive requires the min value to be positive', () => {
         const schema = `
            type StringTestModel05 @model {
               id: ID!
               dedfish: String @xstring(min: -10)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The 'min' argument requires a positive value.`);
      });

      test('@xstring directive requires the min value to be less than the max value', () => {
         const schema = `
            type StringTestModel06 @model {
               id: ID!
               dedfish: String! @xstring(min: 8, max: 5, regex: "asd")
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The 'max' argument must be greater or equal to the min.`);
      });
   });

   describe('when generating vtl code', () => {
      const xstring = new StringValidationTransformer();
      
      test('it should produce code if it is called with non-default params', () => {                  
         expect(xstring.generateValidation('onefish', { min: 2, max: 5, nows: false, regex: '' })).toBeTruthy();
      });

      test('it should produce no code if it is called with default params', () => {                  
         expect(xstring.generateValidation('onefish', { min: 0, max: Number.MAX_SAFE_INTEGER, nows: false, regex: '' })).toBeFalsy();
      });

      test('it should produce regex code if it is called with regex param', () => {                  
         expect(xstring.generateValidation('onefish', { min: 0, max: Number.MAX_SAFE_INTEGER, nows: false, regex: 'XXX' })).toEqual(`onefish.matches('XXX')`);
      });

      test('it should produce lots of code if it is called with many params', () => {                  
         expect(xstring.generateValidation('onefish', { min: 2, max: 10, nows: true, regex: 'XXX' })).toEqual(`onefish.length() >= 2 && onefish.length() <= 10 && onefish.matches('^[^\\s].+[^\\s]$') && onefish.matches('XXX')`);
      });
   });

});

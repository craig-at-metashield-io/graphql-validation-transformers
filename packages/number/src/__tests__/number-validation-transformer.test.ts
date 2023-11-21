import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';

import { NumberValidationTransformer } from '../number-validation-transformer';


describe('NumberValidationTransformer', () => {

   describe('when acting as a field directive', () => {
      const transformer = new GraphQLTransform({
         // @ts-ignore
         transformers: [new ModelTransformer(), new NumberValidationTransformer()],
      });

      test('@xnumber directive can be used on number fields', () => {
         const schema = `
            type NumberTestModel01 @model {
               id: ID!
               onefish: Int @xnumber(min: 1, max: 10)
               twofish: Float! @xnumber(min: 4, max: 6)
               redfish: Int! @xnumber(min: -200)         
            }`;

         expect(() => transformer.transform(schema)).not.toThrow();
      });

      test('@xnumber directive cannot be used on non-number fields', () => {
         const schema = `
            type NumberTestModel02 @model {
               id: ID!
               dedfish: Boolean @xnumber(min: 0)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xnumber directive can be used only on Int, Float fields.`);
      });

      test('@xnumber directive cannot be used on an interface', () => {
         const schema = `
            interface NumberTestInterface01 {
               id: ID!
               dedfish: Int @xnumber(min: 1, max: 10)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xnumber directive cannot be placed on an interface's field.`);
      });

      test('@xnumber directive requires at least 1 argument', () => {
         const schema = `
            type NumberTestModel03 @model {
               id: ID!
               dedfish: Int @xnumber
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xnumber directive requires at least one argument.`);
      });

      test('@xnumber directive can only be used on types with the @model directive', () => {
         const schema = `
            type NumberTestModel04 {
               id: ID!
               dedfish: Float @xnumber(min: 1, max: 10)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The @xnumber directive can be used only on types with the @model directive.`);
      });

      test('@xnumber directive requires the min value to be less than the max value', () => {
         const schema = `
            type NumberTestModel05 @model {
               id: ID!
               dedfish: Int! @xnumber(min: 8, max: 5)
            }`;

         expect(() => transformer.transform(schema)).toThrow(`The 'max' argument must be greater or equal to the min.`);
      });
   });

   describe('when generating vtl code', () => {
      const xnumber = new NumberValidationTransformer();
      
      test('it should produce code if it is called with non-default params', () => {                  
         expect(xnumber.generateValidation('onefish', { min: 2, max: 5 })).toBeTruthy();
      });

      test('it should produce no code if it is called with default params', () => {                  
         expect(xnumber.generateValidation('onefish', { min: Number.MIN_SAFE_INTEGER, max: Number.MAX_SAFE_INTEGER })).toBeFalsy();
      });

      test('it should produce regex code if it is called with min param', () => {                  
         expect(xnumber.generateValidation('onefish', { min: 0, max: Number.MAX_SAFE_INTEGER })).toEqual('onefish >= 0');
      });

      test('it should produce lots of code if it is called with many params', () => {                  
         expect(xnumber.generateValidation('onefish', { min: 2, max: 10 })).toEqual('onefish >= 2 && onefish <= 10');
      });
   });

});

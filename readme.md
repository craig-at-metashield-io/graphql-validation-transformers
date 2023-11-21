> Add field-level validation for strings and numbers to your Amplify GraphQL schema

# graphql-validation-transformers

This is the root of the `graphql-validation-transformers` package. The subpackages within this include:

## Strings

`@graphql-validation-transformers/string` 

String field validation, including min &amp; max length and regex pattern matching

```graphql
type GenericEntityExample @model()  {
   id: ID!   
   title: String! @xstring(min: 2, max: 128, nows: true)
   summary: String!  @xstring(max: 256, nows: true)
   description: String  @default(value: "") @xstring(max: 1024) 
   tag: String  @xstring(regex: "^[0-9A-Z]{8}$")           
}
```
see the package's [`readme.md`](packages/string/readme.md) files for more details

## Numbers 

`@graphql-validation-transformers/number`

Number field validation, include min &amp; max value


```graphql
type GenericEntityExample @model()  {
   percent: Float @xnumber(min: 0, max: 100)
   margin: Float @default(value: "0") @xnumber(min: -10, max: 10)
   index: Int  @default(value: "0") @xnumber(max: 1024)
}
```

see the package's [`readme.md`](packages/number/readme.md) files for more details


## Requirements

These transformers are designed to work in an AWS Amplify project using the GraphQL transformer v2


## Suggestions & Improvements

Please feel free to open a feature request for any additions or improvements you think may add value. I will try to include all those that make sense to me. 

Or better yet,

## Contribute

Code contributions in the form of **pull-requests** are most welcome. 

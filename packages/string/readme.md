> Add field-level validation for strings to your Amplify GraphQL schema

# `@graphql-validation-transformers/string`

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

## Setup

1. Install the package

```
> npm install --save-dev @graphql-validation-transformers/string
```

2. Reference the transformer

Open the  `amplify/backend/api/<API_NAME>/transform.conf.json` file and include the following: 

```   
{
   ...
    "transformers": [ 
      ...
      "@graphql-validation-transformers/string"      
    ]
}
```

## Usage

The directive is defined as:

```graphql
   directive @xstring(min: Int, max: Int, nows: Boolean, regex: String) on FIELD_DEFINITION
```

where:
* `min` : The minimum length allowed 
* `max` : The maximum length allowed
* `nows` : *"no only white space"*. ie. the presence of at least one non-whitespace char is required. (`\S`)
* `regex` : freeform regular expression, as used by VTL.  


**Note:**
* The `@xstring` directive may only be added to **Objects** with the `@model` directive
* The `@xstring` directive may only be added to scalar `String` types
* The `@xstring` directive does not (yet) support string arrays (`[String]`)
* At least one argument must be specified.
* Both `min` and `max` must be greater than or equal to zero
* `min` must be less than or equal to `max`
* If the field is not mandatory, (ie. `String` and not `String!`), omitting the field will not invoke the validation since `undefined` is an acceptable value. However, an empty string (`""`) will invoke the validation.
* The ordering of directives, eg. `@default` before `@xstring`, will have them applied in that specified order. ie. `@xstring` will validate the supplied `@default` value.

## Examples

Given a schema such as:

```graphql
type GenericEntityExample @model()  {
   id: ID!   
   title: String! @xstring(min: 2, max: 128, nows: true)
   summary: String!  @xstring(max: 256, nows: true)
   description: String  @default(value: "") @xstring(max: 1024) 
   tag: String  @xstring(regex: "^[0-9A-Z]{8}$")           
}
```

The following may be expected:

```JSON
// FAIL - min: 2
"title": "A"   

//FAIL - nows: true
"title": "     "

// PASS
"title": "graph string validation"

// FAIL - nows: true
"summary": ""

// FAIL - regex: "^[0-9A-Z]{8}$"
"tag": "abcd123$"

// FAIL - regex: "^[0-9A-Z]{8}$"
"tag": ""

// PASS
"tag": undefined

// PASS
//(tag field ommitted)
```








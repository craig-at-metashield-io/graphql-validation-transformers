> Add field-level validation for numbers to your Amplify GraphQL schema

# `@graphql-validation-transformers/number`

Number field validation, including min &amp; max values

```graphql
type GenericEntityExample @model()  {
   percent: Float @xnumber(min: 0, max: 100)
   margin: Float @default(value: "0") @xnumber(min: -10, max: 10)
   index: Int @xnumber(minx: 1, max: 1024)
}
```

## Setup

1. Install the package

```
> npm install --save-dev @graphql-validation-transformers/number
```

2. Reference the transformer

Open the  `amplify/backend/api/<API_NAME>/transform.conf.json` file and include the following: 

```   
{
   ...
    "transformers": [ 
      ...
      "@graphql-validation-transformers/number"      
    ]
}
```

## Usage

The directive is defined as:

```graphql
   directive @xnumber(min: Int, max: Int) on FIELD_DEFINITION
```

where:
* `min` : The minimum value allowed 
* `max` : The maximum value allowed


**Note:**
* The `@xnumber` directive may only be added to **Objects** with the `@model` directive
* The `@xstring` directive may only be added to scalar `Int` and `Float` types
* The `@xnumber` directive does not (yet) support number arrays (`[Int]` or `[Float]`)
* At least one argument must be specified.
* `min` must be less than or equal to `max`
* If the field is not mandatory, (ie. `Int` and not `Int!`), omitting the field will not invoke the validation since `undefined` is an acceptable value.
* The ordering of directives, eg. `@default` before `@xnumber`, will have them applied in that specified order. ie. `@xnumber` will validate the supplied `@default` value.

## Examples

Given a schema such as:

```graphql
type GenericEntityExample @model()  {
   percent: Float @xnumber(min: 0, max: 100)
   margin: Float @default(value: "0") @xnumber(min: -10, max: 10)
   index: Int  @xnumber(minx: 0, max: 1024)
}
```

The following may be expected:

```JSON
// FAIL - min: 0
"percent": -2.0

// FAIL - max: 100
"percent": 104.0

// PASS
"percent": 50.0

// FAIL - min: 1
"index": 0

// PASS
"index": undefined

// PASS
//(index field ommitted)
```








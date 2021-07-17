# Typescript to JSON Schema Generator
Simple utility that helps you generate schemas for typescript types. You can use this utility to
build schema from all files in a directory and also provide options to limit to a fixed pattern
of types.

## Installation
Global: `npm install -g ts2json-schema`
Local: `npm install ts2json-schema`

## Usage
The utility only supports CLI usage.

### Command line

```
Usage: ts2json-schema -p <source/directory/of/types> -m <pattern to match against types>

Options:
  --path, -p            Path to source directory where you have types.               [string]  [default: []]
  --match, -m           Regex pattern to filter types.                               [string]  [default: []]
  --out, -o             Path where you want utility to create schema files.          [string]  [default: "<source path>/../schema"]
  --verbose, -v         Enable verbose output for logging.                           [boolean] [default: false]
  --debug               Enable debug output.                                         [boolean] [default: false]
```


#### More on pattern matching
Pattern matching allows you to isolate and filter types that need validation. This can reduce the schema generation time and make it easier
to build schema for only unknown data that needs validation. You can use regex rules to create the pattern.
For e.g. if I want to create schemas for all types in the source files that end with Config then I can add the option `-m .+Config$`.


### Using within typescript workflow
- Install as development dependency in your project `npm -D install ts2json-schema`

- Add generateSchema command to your package.json
```
...
"scripts": [
	"generateSchema": "ts2json-schema -v -p <path to directory of models> -m <pattern to match>",
	"build": "generateSchema && tsc" 
]
...
```
- Execute `npm run generateSchema` to generate schemas as you are working through your project.


## Demo

- Install locally `npm install ts2json-schema`

- Execute `npm run demo`

- Check ./models for input examples and ./schema for output schemas.


# Limitations
- This utility  uses [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) to generate schemas so please follow the 
type definition in the [api-docs](https://github.com/YousefED/typescript-json-schema/blob/master/api.md) to get the best of this. This also
means that all the bugs and limitations of *typescript-json-schema* also apply to this project.

- This utility only read files at the top level in the source directory. If you are interested in recursive behavior then feel free to
file a enhancement request and/or add a PR.


# Background

Inspired and builds upon [typescript-json-schema](https://github.com/YousefED/typescript-json-schema), 
[vega/ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator), 
[typescript-json-validator](https://github.com/ForbesLindesay/typescript-json-validator)
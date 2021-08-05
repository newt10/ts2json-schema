# Typescript to JSON Schema Generator
Simple utility that helps you generate schemas for typescript types. You can use this utility to
build schema from all files in a directory and also provide options to limit to a fixed pattern
of types.

## Why use this?
This utility allows you to create schemas using either [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) or [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator).
It enhances the functionality of [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) by allowing you to create individual schema files
for specific types. Additionaly the utility also supports pattern matching for filenames and typenames that give you a lot of control in generating schemas within your workflow.

## Installation
Global: `npm install -g ts2json-schema`
Local: `npm install ts2json-schema`

## Usage
The utility only supports CLI usage.

### Command line

```
Usage: ts2json-schema -p <source/directory/of/types> -m <pattern to match against types>

Options:
  --path, -p            Path to source directory where you have types.               [string]
  --match, -m           Regex pattern to filter types.                               [string]
  --out, -o             Path where you want utility to create schema files.          [string]  [default: "<source path>/../schema"]
  --verbose, -v         Enable verbose output for logging.                           [boolean] [default: false]
  --debug, -D           Enable debug output.                                         [boolean] [default: false]
  --filematch, -f       Regex pattern to filter files.                               [string]  [default: ".*"]
  --vega, -A            Use vega/ts-json-schema-generator.                           [boolean] [default: false]
  --tsconfig, -t        Provide path to tsconfig including filename.                 [string]
  --root, -R            Root path to source files.                                   [string]
  --exclude, -e         Exclude types matching pattern                               [string]
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
- This utility  uses [typescript-json-schema](https://github.com/YousefED/typescript-json-schema) or [vega/ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator) to generate schemas. If using the default generator please follow the 
type definition in the [api-docs](https://github.com/YousefED/typescript-json-schema/blob/master/api.md) to get the best of this. This also
means that all the bugs and limitations of *typescript-json-schema* and *vega/ts-json-schema-generator* also apply to this project.

- This utility only read files at the top level in the source directory. If you are interested in recursive behavior then feel free to
file a enhancement request and/or add a PR.

## Known Limitations with [ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator)
This generator requires that the type files are within the same path as the rootDir path in the tsconfig file. You will need to accordingly organize your model/interface/type files. For e.g. if your rootDir is `./src` then your type files can be placed in any child or grand-child directory of `./src`

# Background

Inspired and builds upon [typescript-json-schema](https://github.com/YousefED/typescript-json-schema), 
[vega/ts-json-schema-generator](https://github.com/vega/ts-json-schema-generator), 
[typescript-json-validator](https://github.com/ForbesLindesay/typescript-json-validator)

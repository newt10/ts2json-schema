// import * as path from 'path';
// import * as fs from 'fs';
// import * as TJS from 'typescript-json-schema';
// import { pipe } from './pipeProvider';

// const settings: TJS.PartialArgs = { required: true };
// const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };
// const basePath = path.resolve(__dirname, '../src');

// const resolve = (...route: string[]) => {
//   return path.join(basePath, ...route);
// };


// const getInterfaceFiles = (): string[] => {
//   // Search interface files
//   const files = (() => {
//     const files = fs.readdirSync(resolve('models'));
//     return files.map(file => resolve('models', file));
//   })();
//   // eslint-disable-next-line no-console
//   console.log(JSON.stringify(files));

//   return files;
// };

// const generateSchemas = (files: string[]): TJS.JsonSchemaGenerator => {
//   // make schema files
//   const program = TJS.getProgramFromFiles(files, compilerOptions);
//   const generator = TJS.buildGenerator(
//     program,
//     settings,
//   ) as TJS.JsonSchemaGenerator;

//   return generator;
// };

// const saveSchemas = (generator: TJS.JsonSchemaGenerator): void => {
//   // get all symbols which meet regex
//   const symbols = generator
//     .getUserSymbols();
//   console.log(JSON.stringify(symbols));
//   const filtered = symbols
//     .filter(symbol => !!symbol.match(/(.*)Interface/gi));

//   // create directory if it doesn't exist
//   if (!fs.existsSync(resolve('schema'))) {
//     fs.mkdirSync(resolve('schema'));
//   }
//   // store all schema files
//   filtered.forEach(symbol => {
//     const schema = generator.getSchemaForSymbol(symbol);
//     const prefix = 'export default ';
//     const filePath = `${resolve('schema', `${symbol}JSC.ts`)}`;
//     const fileContents = `${prefix}${JSON.stringify(schema, null, 2)}`;
//     fs.writeFileSync(filePath, fileContents);
//   });
// };

// pipe(
//   getInterfaceFiles,
//   generateSchemas,
//   saveSchemas,
// )();
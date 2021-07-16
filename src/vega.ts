// // eslint-disable-next-line @typescript-eslint/no-var-requires
// // const tsj = require('ts-json-schema-generator');
// import { createGenerator } from 'ts-json-schema-generator';
// import fs from 'fs';
// import path from 'path';

// // const filePath = path.resolve(__dirname);
// const rootPath = path.resolve(__dirname, '../src');
// const inputPath = path.resolve(rootPath, 'src/models');
// const config = {
//   path: inputPath,
//   tsconfig: path.join(rootPath, 'tsconfig.json'),
//   type: '*', // Or <type-name> if you want to generate schema for that one type only
// };

// const output_path = path.join(rootPath, 'dist/schema/');

// console.log(rootPath, inputPath, output_path);

// const schema = createGenerator(config).createSchema(config.type);
// const schemaString = JSON.stringify(schema, null, 2);

// fs.writeFile(output_path, schemaString, (err) => {
//   if (err) {
//     throw err;
//   }
// });
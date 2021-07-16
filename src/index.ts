import path from 'path';
import { writeFile, existsSync, readdirSync, mkdirSync, lstatSync } from 'fs';
import * as TJS from 'typescript-json-schema';
import { Command } from 'commander';

import { Logger, LogLevel } from './logger';
// What is needed
// Location of the files which need to be processed.
// Output path where files should be placed.
const commandManager = new Command()
  .requiredOption('-p, --path <directory>', 'Source files')
  .option('-m, --match <regex pattern>', 'Build schema for types that match the pattern')
  .option('-o, --out <directory>', 'Set the output dir (default: <source path>/../schema)')
  .option('--debug', 'Enable debug logging');

const rootPath = path.resolve(__dirname, '../'); // this will run from the util folder, rootPath is 1 level out.
let inputPath, outputPath: string;
let logger: Logger;

const configure = () => {
  commandManager.parse(process.argv);
  inputPath = path.resolve(rootPath, commandManager.opts().path);

  if (commandManager.opts().out) {
    outputPath = path.resolve(rootPath, commandManager.opts().out);
  } else {
    outputPath = path.resolve(inputPath, '../schema');
  }
  // check if inputPath is a valid directory else throw error
  if (!existsSync(inputPath) || !lstatSync(inputPath).isDirectory()) {
    const configError = new Error(`Invalid Path: '${inputPath}'. Enter a valid path to a directory.`);
    configError.name = 'ConfigError';
    throw configError;
  }

  const level = commandManager.opts().debug ? LogLevel.DEBUG : LogLevel.INFO;
  logger = new Logger(level, console.log);
};

const buildFileList = () => {
  // get list of files at inputPath
  const allFiles = readdirSync(inputPath);
  // filter to typescript files
  const files = allFiles.filter(file => file.match(/.+\.ts$/g));
  // convert typescript filename to absolute file path
  return files.map(file => path.resolve(inputPath, file));
};

const generateSchemas = () => {
  configure();
  logger.info(`Configured to process files from: '${inputPath}'`
    + ` and writing schemas to: '${outputPath}'`);

  const files = buildFileList();
  if (!files || files.length < 1) {
    logger.info('Found no matching files to process.');
    return;
  }
  logger.debug('Processing files:\n', files);

  const settings = {
    required: true,
  } as TJS.PartialArgs;
  const compilerOptions = {
    strictNullChecks: true,
  } as TJS.CompilerOptions;

  const program = TJS.getProgramFromFiles(files, compilerOptions);
  const generator = TJS.buildGenerator(
    program,
    settings,
  ) as TJS.JsonSchemaGenerator;

  if (!generator) {
    logger.error('Cound not build a generator. Please report issue.');
    return;
  }
  // get all symbols which meet regex
  const matchPattern = commandManager.opts().match;
  const symbols = generator.getUserSymbols();
  const filtered = matchPattern
    ? symbols.filter(symbol => symbol.match(matchPattern))
    : symbols;

  logger.debug('Generating schema for following types:\n', symbols);
  // create directory if it doesn't exist
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }
  // store all schema files
  filtered.forEach(symbol => {
    const schema = generator.getSchemaForSymbol(symbol);
    const prefix = 'export default ';
    const filePath = path.join(outputPath, `${symbol}JSC.ts`);
    // const fileContents = `${prefix}${JSON.stringify(schema, null, 2)}`;
    const fileContents = `${prefix}${JSON.stringify(schema, null, 2)}`;
    writeFile(filePath, fileContents, (err) => {
      if (err) {
        throw err;
      }
    });
  });
};

generateSchemas();
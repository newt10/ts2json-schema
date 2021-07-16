import path from 'path';
import { existsSync, readdirSync, mkdirSync, lstatSync, writeFileSync } from 'fs';
import * as TJS from 'typescript-json-schema';
import { Command } from 'commander';

import { Logger, LogLevel } from './logger';
import { FileWriteError, GeneratorError, JSONBuilderError } from './errors';
// What is needed
// Location of the files which need to be processed.
// Output path where files should be placed.
const commandManager = new Command()
  .requiredOption('-p, --path <directory>', 'Source files')
  .requiredOption('-m, --match <regex pattern>', 'Build schema for types that match the pattern')
  .option('-o, --out <directory>', 'Set the output dir (default: <source path>/../schema)')
  .option('--debug', 'Enable debug logging')
  .option('-v, --verbose', 'Enable verbose output');

const rootPath = path.resolve(__dirname, '../'); // this will run from the util folder, rootPath is 1 level out.
let inputPath: string, outputPath: string;
let logger: Logger;

/**
 * Configure various settings based on supplied arguments.
 */
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

  let level: LogLevel;
  const { debug, verbose } = commandManager.opts();
  if (debug) {
    level = LogLevel.DEBUG;
  } else if (verbose) {
    level = LogLevel.VERBOSE;
  } else {
    level = LogLevel.INFO;
  }
  // eslint-disable-next-line no-console
  logger = new Logger(level, console.log);
};

/**
 * Retrieve typescript files from the source directory.
 * @returns {Array<string>} list of file paths to process
 */
const buildFileList = (): string[] => {
  // get list of files at inputPath
  const allFiles = readdirSync(inputPath);
  // filter to typescript files
  const tsRegex = new RegExp('.+\\.ts$');
  const files = allFiles.filter(file => tsRegex.test(file));
  // convert typescript filename to absolute file path
  const filePaths = files.map(file => path.resolve(inputPath, file));
  return filePaths.filter(filePath => !lstatSync(filePath).isDirectory());
};

/**
 * Generate JSON schema using the supplied generator for the given type. Function
 * throw errors when they are encountered so handling them will allow the caller
 * to gracefully perform multiple conversions.
 * @param symbol {string} name of the type.
 * @param generator {TJS.JsonSchemaGenerator} instance of configured schema generator.
 */
const saveSchemaForSymbol = (symbol: string, generator: TJS.JsonSchemaGenerator): void => {
  let schema: TJS.Definition;
  try {
    logger.verbose(`Generating schema for '${symbol}'`);
    schema = generator.getSchemaForSymbol(symbol);
  } catch (error) {
    throw new GeneratorError(error);
  }
  const prefix = 'export default ';
  const filePath = path.join(outputPath, `${symbol}JSC.ts`);
  let fileContents: string;
  try {
    fileContents = `${prefix}${JSON.stringify(schema, null, 2)}`;
  } catch (error) {
    throw new JSONBuilderError(error);
  }
  try {
    writeFileSync(filePath, fileContents);
  } catch(error) {
    if (error) {
      throw new FileWriteError(error);
    }
  }
};

/**
 * Generate JSON schema from typescript files at the source directory and save
 * it at output directory.
 * Generated files have have the following pattern - <type name>JSC.ts
 * @returns {void}
 */
const generateSchemas = (): void => {
  configure();
  logger.info(`Configured to process files from: '${inputPath}'`
    + ` and writing schemas to: '${outputPath}'`);

  const files = buildFileList();
  if (!files || files.length < 1) {
    logger.info('Found no matching files to process.');
    return;
  }
  logger.verbose('Processing files:\n', files);

  const settings = {
    required: true,
  } as TJS.PartialArgs;
  const compilerOptions = {
    strictNullChecks: true,
  } as TJS.CompilerOptions;

  logger.debug('Configuring schema generator');
  const program = TJS.getProgramFromFiles(files, compilerOptions);
  const generator = TJS.buildGenerator(
    program,
    settings,
  ) as TJS.JsonSchemaGenerator;

  if (!generator) {
    logger.error('Failed to build a schema generator. Please report issue.');
    return;
  }
  // get all symbols which meet regex
  const matchPattern = commandManager.opts().match;
  logger.debug(`Using '${matchPattern}' to filter types.`);
  logger.debug('Fetching user types from files.');
  const symbols = generator.getUserSymbols();
  const filtered = symbols.filter(symbol => !!symbol.match(new RegExp(matchPattern)));

  logger.verbose(`Filtered ${symbols.length} symbols using '${matchPattern}' to obtain:\n`, filtered);
  // create directory if it doesn't exist
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }
  // store all schema files
  filtered.forEach(symbol => {
    try {
      saveSchemaForSymbol(symbol, generator);
    } catch (error) {
      if (error instanceof GeneratorError) {
        logger.error(`Failed to generate schema for '${symbol}' with error:\n`, error);
        logger.info('Continue processing other types');
        return;
      }
      if (error instanceof FileWriteError){
        logger.error(`Failed to write file for '${symbol}' with error:\n`, error);
        logger.info('Continue processing other types');
        return;
      }
      if (error instanceof JSONBuilderError){
        logger.error(`Failed to build JSON from schema for '${symbol}' with error:\n`, error);
        logger.info('Continue processing other types');
        return;
      }
    }
  });
};

// Entry point function
generateSchemas();
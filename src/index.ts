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
  .requiredOption('-m, --match <regex pattern>', 'Build schema for types that match the pattern')
  .option('-o, --out <directory>', 'Set the output dir (default: <source path>/../schema)')
  .option('--debug', 'Enable debug logging')
  .option('-v, --verbose', 'Enable verbose output');

const rootPath = path.resolve(__dirname, '../'); // this will run from the util folder, rootPath is 1 level out.
let inputPath: string, outputPath: string;
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

  let level: LogLevel;
  const { debug, verbose } = commandManager.opts();
  if (debug) {
    level = LogLevel.DEBUG;
  } else if (verbose) {
    level = LogLevel.VERBOSE;
  } else {
    level = LogLevel.INFO;
  }
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
  const symbols = generator.getUserSymbols();
  const filtered = symbols.filter(symbol => !!symbol.match(new RegExp(matchPattern)));

  logger.verbose(`Filtered ${symbols.length} symbols using '${matchPattern}' to obtain:\n`, filtered);
  // create directory if it doesn't exist
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }
  // store all schema files
  filtered.forEach(symbol => {
    logger.verbose(`Generating schema for '${symbol}'`);
    const schema = generator.getSchemaForSymbol(symbol);
    const prefix = 'export default ';
    const filePath = path.join(outputPath, `${symbol}JSC.ts`);
    const fileContents = `${prefix}${JSON.stringify(schema, null, 2)}`;
    writeFile(filePath, fileContents, (err) => {
      if (err) {
        throw err;
      }
    });
  });
};

generateSchemas();
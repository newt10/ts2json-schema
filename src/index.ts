import path from 'path';
import { existsSync, readdirSync, mkdirSync, lstatSync, writeFileSync } from 'fs';
import * as TJS from 'typescript-json-schema';
import * as VegaTSJ from 'ts-json-schema-generator';
import { Command } from 'commander';
import * as AppRootPath from 'app-root-path';
import { JSONSchema7 } from 'json-schema';

import { Logger, LogLevel } from './logger';
import { FileWriteError, GeneratorError, JSONBuilderError } from './errors';

// What is needed
// Location of the files which need to be processed.
// Output path where files should be placed.
const commandManager = new Command()
  .requiredOption('-p, --path <directory>', 'Source files')
  .requiredOption('-m, --match <regex pattern>', 'Build schema for types that match the pattern')
  .option('-o, --out <directory>', 'Set the output dir (default: <source path>/../schema)')
  .option('-D, --debug', 'Enable debug logging')
  .option('-v, --verbose', 'Enable verbose output')
  .option('-f, --filematch <regex pattern>', 'Use file names that match the pattern')
  .option('-A, --vega', 'Use vega/ts-json-schema-generator')
  .option('-t, --tsconfig <path>', 'Provide path to tsconfig including filename')
  .option('-R, --root <path>', 'Provide a root path to override the auto configuration')
  .option('-e, --exclude <pattern>', 'Exclude types that match the pattern');

let rootPath: string, inputPath: string, outputPath: string, tsPath: string;
let logger: Logger;

/**
 * Configure various settings based on supplied arguments.
 */
const configure = () => {
  commandManager.parse(process.argv);
  if (commandManager.opts().vega && !commandManager.opts().tsconfig) {
    process.stderr.write('Program requires location of tsconfig when using vega/ts-json-schema-generator\n');
    process.exit();
  }
  if (commandManager.opts().root) {
    rootPath = path.resolve(commandManager.opts().root);
    if (!existsSync(rootPath)) {
      process.stderr.write(`Invalid root path at ${rootPath}\n`);
      process.exit();
    }
  } else {
    rootPath = `${AppRootPath}`;
  }
  inputPath = path.resolve(rootPath, commandManager.opts().path);

  if (commandManager.opts().tsconfig) {
    tsPath = path.resolve(rootPath, commandManager.opts().tsconfig);
    if (!existsSync(tsPath)) {
      process.stderr.write(`Could not find tsconfig at ${tsPath}\n`);
      process.exit();
    }
  }

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
  let filematch = commandManager.opts().filematch;
  if (filematch) {
    logger.info(`Looking for files matching pattern '${filematch}'`);
  } else {
    filematch = '.*';
  }
  // get list of files at inputPath
  const allFiles = readdirSync(inputPath);
  // filter to typescript files
  const tsRegex = new RegExp('.+\\.ts$');
  const fileMatchRegex = new RegExp(filematch);
  const files = allFiles.filter(file => tsRegex.test(file) && fileMatchRegex.test(file));
  // convert typescript filename to absolute file path
  const filePaths = files.map(file => path.resolve(inputPath, file));
  return filePaths.filter(filePath => !lstatSync(filePath).isDirectory());
};

/**
 * Using the supplied generator, generate schema for the provided symbol (a.k.a type)
 * @param symbol type for which schema is to be generated
 * @param generator Generator to use for schema generation
 * @returns schema object
 */
// Type generated by TJS generator is any so we have to use that.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generateSchemaFromGenerator = (symbol: string, generator: VegaTSJ.SchemaGenerator | TJS.JsonSchemaGenerator): JSONSchema7 | any => {
  try {
    logger.verbose(`Generating schema for '${symbol}'`);
    if (commandManager.opts().vega) {
      return (generator as VegaTSJ.SchemaGenerator).createSchema(symbol);
    } else {
      return (generator as TJS.JsonSchemaGenerator).getSchemaForSymbol(symbol);
    }
  } catch (error) {
    throw new GeneratorError(error);
  }
};

/**
 * Convert schema to writable string and write them to files. Function
 * throw errors when they are encountered so handling them will allow the caller
 * to gracefully perform multiple conversions.
 * @param symbol {string} name of the type.
 * @param generator {TJS.JsonSchemaGenerator} instance of configured schema generator.
 */
const saveSchemaForSymbol = (symbol: string, schema: Record<string, unknown>): void => {
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
  const typeMatchPattern = new RegExp(matchPattern);
  let filtered = symbols.filter(symbol => typeMatchPattern.test(symbol));
  if (commandManager.opts().exclude) {
    const excludePattern = new RegExp(commandManager.opts().exclude);
    filtered = filtered.filter(symbol => !excludePattern.test(symbol));
  }

  logger.verbose(`Filtered ${symbols.length} symbols using '${matchPattern}' to obtain:\n`, filtered);
  // create directory if it doesn't exist
  if (!existsSync(outputPath)) {
    mkdirSync(outputPath);
  }

  // Generating using vega
  let vegaGenerator: VegaTSJ.SchemaGenerator;
  let vegaConfig: VegaTSJ.Config;
  const vegaSourcePath = inputPath.endsWith(path.sep) ? inputPath + '*.ts' : inputPath + path.sep + '*.ts';
  if (commandManager.opts().vega) {
    vegaConfig = {
      path: vegaSourcePath,
      tsconfig: tsPath,
      type: '*',
      topRef: true,
      skipTypeCheck: true,
      additionalProperties: true,
    };
    logger.verbose('Configured vega generator with following settings', vegaConfig);
    vegaGenerator = VegaTSJ.createGenerator(vegaConfig);
  }

  // store all schema files
  filtered.forEach(symbol => {
    try {
      // Type generated by TJS generator is any so we have to use that.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let schema: any;
      if (commandManager.opts().vega) {
        schema = generateSchemaFromGenerator(symbol, vegaGenerator);
      } else {
        schema = generateSchemaFromGenerator(symbol, generator);
      }
      saveSchemaForSymbol(symbol, schema);
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
/**
 * A Node.js script that validates GeoJSON data and also
 * corrects the winding order of GeoJSON polygons
 *
 * Usage instructions will be printed by running
 * `node fix_winding.js -h`
 */

const { program } = require('commander');
const reject = require('lodash/reject');
const { readFileSync, writeFileSync } = require('fs');
const rewind = require('@turf/rewind');
const { hint } = require('@mapbox/geojsonhint');

/**
 * Command-line argument parsing
 */
program
  .option('-d, --debug', 'output extra debugging information')
  .requiredOption(
    '-i, --input-file <path>',
    'Input GeoJSON file (UTF-8 encoding assumed)'
  )
  .requiredOption(
    '-o, --output-file <path>',
    'Output GeoJSON file with correct winding order'
  );

program.parse(process.argv);
const options = program.opts();

if (options.debug) {
  console.log('Arguments: ', options);
}

/**
 * Check if the input is valid GeoJSON
 */
var inputDataString = readFileSync(options.inputFile, { encoding: 'utf8' });
var hints = hint(inputDataString);
const originalNumberOfHints = hints.length;
/**
 * We can't fix problems other than winding order.
 * Filter out winding order problems to test for serious errors.
 */
hints = reject(hints, (val) => val.message.includes('right-hand rule'));
if (hints.length > 0) {
  console.error(hints);
  throw new Error('GeoJSON is not valid');
}
/**
 * If the above filter operation changed the length of the list,
 * then there are winding order problems
 */
if (hints.length !== originalNumberOfHints) {
  console.log('Winding issues were detected and will be fixed.');
} else {
  console.log('No issues detected.');
}

/**
 * Rewind polygons
 */
var inputData = JSON.parse(inputDataString);
var rewoundData = rewind(inputData, { mutate: true });
// Verify
hints = hint(rewoundData);
if (hints.length > 0) {
  console.error(hints);
  throw new Error('Output GeoJSON is not valid');
}

/**
 * Output the result
 */
writeFileSync(options.outputFile, JSON.stringify(rewoundData));

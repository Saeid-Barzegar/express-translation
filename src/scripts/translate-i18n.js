/**
 * Translation script for generating i18n-friendly JSON files for frontend libraries.
 * Generates translation files with only keys and a "_version" property.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { readTranslationsFromCSV, incrementVersion } from './translate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read i18n version from settings.json file
 * @returns {string} Current i18n version or default v1.0.0.0
 */
function readI18nVersion() {
  const versionFile = path.join(__dirname, '..', '..', 'settings.json');
  
  try {
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf-8');
      const data = JSON.parse(content);
      return data.i18nVersion || 'v1.0.0.0';
    }
  } catch (error) {
    console.warn(`Warning: Could not read i18n version file: ${error.message}`);
  }
  
  return 'v1.0.0.0';
}

/**
 * Write i18n version to settings.json file
 * Preserves the API version when updating i18n version
 * @param {string} i18nVersion - i18n version string to save
 */
function writeI18nVersion(i18nVersion) {
  const versionFile = path.join(__dirname, '..', '..', 'settings.json');
  
  try {
    let data = {};
    // Read existing file to preserve API version
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf-8');
      data = JSON.parse(content);
    }
    
    data.i18nVersion = i18nVersion;
    
    fs.writeFileSync(versionFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`i18n Version updated to: ${i18nVersion}`);
  } catch (error) {
    console.error(`Error writing i18n version file: ${error.message}`);
  }
}

/**
 * Write i18n translation file with _version property.
 * Keys are sorted alphabetically.
 * 
 * @param {string} filePath - Path to the output JSON file
 * @param {Object} data - Dictionary to write
 * @param {string} version - Version string to include
 */
function writeI18nJSONFile(filePath, data, version) {
  try {
    // Sort the dictionary by keys alphabetically
    const sortedData = {};
    const sortedKeys = Object.keys(data).sort();
    
    // Add _version property first
    sortedData['_version'] = version;
    
    // Add sorted translation keys
    for (const key of sortedKeys) {
      sortedData[key] = data[key];
    }
    
    fs.writeFileSync(filePath, JSON.stringify(sortedData, null, 2), 'utf-8');
    console.log(`Created: ${filePath}`);
  } catch (error) {
    console.error(`Error writing ${filePath}: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Main function to generate i18n translation files.
 */
function main() {
  // Default CSV file name (look in root directory)
  let csvFile = path.join(__dirname, '..', '..', 'translations.csv');
  
  // Allow CSV file to be passed as command line argument
  if (process.argv.length > 2) {
    const argPath = process.argv[2];
    csvFile = path.isAbsolute(argPath) ? argPath : path.join(process.cwd(), argPath);
  }
  
  console.log(`Reading translations from: ${csvFile}`);
  
  // Read translations from CSV
  const { translations, languages } = readTranslationsFromCSV(csvFile);
  
  // Read current i18n version
  const currentI18nVersion = readI18nVersion();
  
  // Create i18n translation folder if it doesn't exist (inside translation directory)
  const i18nDir = path.join(__dirname, '..', '..', 'translation', 'i18n');
  if (!fs.existsSync(i18nDir)) {
    fs.mkdirSync(i18nDir, { recursive: true });
  }
  
  // Write JSON files for each language with _version property
  console.log('\nGenerating i18n translation files...');
  for (const langName of languages) {
    const jsonFilename = `${langName}.json`;
    const jsonPath = path.join(i18nDir, jsonFilename);
    writeI18nJSONFile(jsonPath, translations[langName], currentI18nVersion);
  }
  
  // Increment and save i18n version
  console.log('\nUpdating i18n version...');
  const newI18nVersion = incrementVersion(currentI18nVersion);
  writeI18nVersion(newI18nVersion);
  
  console.log('\ni18n translation files generated successfully!');
  for (const langName of languages) {
    console.log(`  - translation/i18n/${langName}.json: ${Object.keys(translations[langName]).length} keys`);
  }
  console.log(`  - i18n Version: ${currentI18nVersion} -> ${newI18nVersion}`);
}

// Check if this module is being run directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export {
  writeI18nJSONFile,
  readI18nVersion,
  writeI18nVersion
};


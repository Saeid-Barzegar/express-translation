/**
 * Translation script that reads translation keys from a CSV file
 * and generates JSON files for different languages.
 * Dynamically detects languages from column headers.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validate if a language name/code is valid.
 * 
 * Valid language names should contain only:
 * - Letters (a-z, A-Z)
 * - Numbers (0-9)
 * - Underscores (_)
 * - Hyphens (-)
 * 
 * @param {string} langName - Language name to validate
 * @returns {boolean} True if valid, False otherwise
 */
function isValidLanguageName(langName) {
  if (!langName || !langName.trim()) {
    return false;
  }
  
  // Language names should only contain alphanumeric characters, underscores, and hyphens
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(langName.trim());
}

/**
 * Parse CSV file content
 * 
 * @param {string} content - CSV file content
 * @returns {Array<Array<string>>} Array of rows, each row is an array of cells
 */
function parseCSV(content) {
  const rows = [];
  const lines = content.split(/\r?\n/);
  
  for (const line of lines) {
    if (line.trim() === '') continue;
    
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentCell += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    
    cells.push(currentCell);
    rows.push(cells);
  }
  
  return rows;
}

/**
 * Read translations from CSV file.
 * 
 * Expected CSV format:
 * - Column 1: Key (unique identifier)
 * - Column 2+: Language columns (identified by header names)
 * 
 * @param {string} csvFilePath - Path to CSV file
 * @returns {Object} Object with translations and languages: {translations: Object, languages: Array<string>}
 * 
 * @throws {Error} If duplicate keys are found or invalid language names detected
 */
function readTranslationsFromCSV(csvFilePath) {
  const translations = {};
  const languages = [];
  const seenKeys = {}; // Track keys and their row numbers for duplicate detection
  let rowNumber = 0;
  
  try {
    // Read CSV file with UTF-8 BOM handling
    let content = fs.readFileSync(csvFilePath, 'utf-8');
    
    // Remove UTF-8 BOM if present
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      console.error('Error: CSV file is empty or has no header row.');
      process.exit(1);
    }
    
    // Read header row
    const headerRow = rows[0];
    rowNumber = 1;
    
    // Validate and extract language names from header
    if (headerRow.length < 2) {
      console.error('Error: CSV file must have at least 2 columns (key + at least one language).');
      process.exit(1);
    }
    
    // First column should be 'key' (case-insensitive)
    if (headerRow[0].trim().toLowerCase() !== 'key' && headerRow[0].trim().toLowerCase() !== 'keys') {
      console.warn(`Warning: First column is '${headerRow[0]}', expected 'key'`);
    }
    
    // Extract and validate language names from remaining columns
    for (let i = 1; i < headerRow.length; i++) {
      const langName = headerRow[i].trim();
      
      if (!langName) {
        console.warn(`Warning: Empty language name in column ${i + 1}, skipping.`);
        continue;
      }
      
      if (!isValidLanguageName(langName)) {
        console.error(`\nError: Invalid language name '${langName}' in column ${i + 1}.`);
        console.error('Language names must contain only letters, numbers, underscores, and hyphens.');
        process.exit(1);
      }
      
      languages.push(langName);
      translations[langName] = {};
    }
    
    if (languages.length === 0) {
      console.error('Error: No valid language columns found in CSV file.');
      process.exit(1);
    }
    
    console.log(`Detected languages: ${languages.join(', ')}`);
    
    // Process data rows
    for (let i = 1; i < rows.length; i++) {
      rowNumber = i + 1;
      const row = rows[i];
      const key = processRow(row, translations, languages, rowNumber, seenKeys);
      
      if (key) {
        if (key in seenKeys) {
          // Duplicate key found
          const firstOccurrence = seenKeys[key];
          console.error(`\nError: Duplicate key '${key}' found!`);
          console.error(`  First occurrence: row ${firstOccurrence}`);
          console.error(`  Duplicate occurrence: row ${rowNumber}`);
          process.exit(1);
        }
        seenKeys[key] = rowNumber;
      }
    }
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: CSV file '${csvFilePath}' not found.`);
      process.exit(1);
    }
    console.error(`Error reading CSV file: ${error.message}`);
    process.exit(1);
  }
  
  return { translations, languages };
}

/**
 * Process a single row from the CSV file.
 * 
 * @param {Array<string>} row - Array of values from CSV row
 * @param {Object} translations - Dictionary to update with translations
 * @param {Array<string>} languages - List of language names
 * @param {number} rowNumber - Current row number (for error reporting)
 * @param {Object} seenKeys - Dictionary of already seen keys and their row numbers
 * 
 * @returns {string|null} The key if successfully processed, null otherwise
 */
function processRow(row, translations, languages, rowNumber, seenKeys) {
  if (row.length < 1) {
    console.warn(`Warning: Skipping row ${rowNumber} with no data: ${JSON.stringify(row)}`);
    return null;
  }
  
  const key = row[0].trim();
  
  if (!key) {
    console.warn(`Warning: Skipping row ${rowNumber} with empty key: ${JSON.stringify(row)}`);
    return null;
  }
  
  // Process each language column
  for (let i = 0; i < languages.length; i++) {
    const langName = languages[i];
    // Get translation value (column index is i+1 since first column is key)
    const translation = (i + 1 < row.length) ? row[i + 1].trim() : '';
    
    translations[langName][key] = translation;
  }
  
  return key;
}

/**
 * Write dictionary data to a JSON file with proper formatting.
 * Keys are sorted alphabetically.
 * 
 * @param {string} filePath - Path to the output JSON file
 * @param {Object} data - Dictionary to write
 */
function writeJSONFile(filePath, data) {
  try {
    // Sort the dictionary by keys alphabetically
    const sortedData = {};
    const sortedKeys = Object.keys(data).sort();
    
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
 * Sort the CSV file rows by the key column (first column) alphabetically.
 * Preserves the header row.
 * 
 * @param {string} csvFilePath - Path to the CSV file to sort
 */
function sortCSVFile(csvFilePath) {
  try {
    // Read CSV file with UTF-8 BOM handling
    let content = fs.readFileSync(csvFilePath, 'utf-8');
    const hasBOM = content.charCodeAt(0) === 0xFEFF;
    
    if (hasBOM) {
      content = content.slice(1);
    }
    
    const rows = parseCSV(content);
    
    if (rows.length === 0) {
      return; // Empty file, nothing to sort
    }
    
    const header = rows[0];
    const dataRows = rows.slice(1).filter(row => row && row[0] && row[0].trim());
    
    // Sort rows by the first column (key) alphabetically
    dataRows.sort((a, b) => {
      const keyA = (a && a[0]) ? a[0].trim().toLowerCase() : '';
      const keyB = (b && b[0]) ? b[0].trim().toLowerCase() : '';
      return keyA.localeCompare(keyB);
    });
    
    // Reconstruct CSV content
    let csvContent = '';
    
    // Write header
    csvContent += header.map(cell => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',') + '\n';
    
    // Write sorted data rows
    for (const row of dataRows) {
      csvContent += row.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',') + '\n';
    }
    
    // Write back with UTF-8 BOM for Excel compatibility
    const bom = hasBOM ? '\uFEFF' : '';
    fs.writeFileSync(csvFilePath, bom + csvContent, 'utf-8');
    
    console.log(`Sorted CSV file: ${csvFilePath} (UTF-8 with BOM for Excel compatibility)`);
    
  } catch (error) {
    console.warn(`Warning: Could not sort CSV file: ${error.message}`);
    // Don't exit on error, just warn
  }
}

/**
 * Increment version number
 * Format: v1.0.0.1 -> v1.0.0.2
 *         v1.0.0.9 -> v1.0.1.0
 * 
 * @param {string} version - Current version string (e.g., "v1.0.0.1")
 * @returns {string} Incremented version string
 */
function incrementVersion(version) {
  // Remove 'v' prefix and split by dots
  const parts = version.replace(/^v/, '').split('.').map(Number);
  
  // Ensure we have 4 parts (major.minor.patch.build)
  while (parts.length < 4) {
    parts.push(0);
  }
  
  // Increment build number (last part)
  parts[3] += 1;
  
  // Handle carry-over
  if (parts[3] >= 10) {
    parts[3] = 0;
    parts[2] += 1; // Increment patch
    
    if (parts[2] >= 10) {
      parts[2] = 0;
      parts[1] += 1; // Increment minor
      
      if (parts[1] >= 10) {
        parts[1] = 0;
        parts[0] += 1; // Increment major
      }
    }
  }
  
  return `v${parts.join('.')}`;
}

/**
 * Read version from settings.json file
 * @returns {string} Current version or default v1.0.0.0
 */
function readVersion() {
  const versionFile = path.join(__dirname, '..', '..', 'settings.json');
  
  try {
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf-8');
      const data = JSON.parse(content);
      return data.version || 'v1.0.0.0';
    }
  } catch (error) {
    console.warn(`Warning: Could not read version file: ${error.message}`);
  }
  
  return 'v1.0.0.0';
}

/**
 * Write version to settings.json file
 * @param {string} version - Version string to save
 */
function writeVersion(version) {
  const versionFile = path.join(__dirname, '..', '..', 'settings.json');
  
  try {
    let data = {};
    // Read existing file to preserve i18nVersion if it exists
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, 'utf-8');
      data = JSON.parse(content);
    }
    
    data.version = version;
    
    fs.writeFileSync(versionFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Version updated to: ${version}`);
  } catch (error) {
    console.error(`Error writing version file: ${error.message}`);
  }
}

/**
 * Main function to orchestrate the translation file generation.
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
  
  // Create translation folder if it doesn't exist
  const translationDir = path.join(__dirname, '..', '..', 'translation');
  if (!fs.existsSync(translationDir)) {
    fs.mkdirSync(translationDir, { recursive: true });
  }
  
  // Write JSON files for each language
  console.log('\nGenerating translation files...');
  for (const langName of languages) {
    const jsonFilename = `${langName}.json`;
    const jsonPath = path.join(translationDir, jsonFilename);
    writeJSONFile(jsonPath, translations[langName]);
  }
  
  // Sort the CSV file by key column
  console.log('\nSorting CSV file...');
  sortCSVFile(csvFile);
  
  // Increment and save version
  console.log('\nUpdating version...');
  const currentVersion = readVersion();
  const newVersion = incrementVersion(currentVersion);
  writeVersion(newVersion);
  
  console.log('\nTranslation files generated successfully!');
  for (const langName of languages) {
    console.log(`  - translation/${langName}.json: ${Object.keys(translations[langName]).length} keys`);
  }
  console.log(`  - Version: ${currentVersion} -> ${newVersion}`);
}

// Check if this module is being run directly
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export {
  readTranslationsFromCSV,
  isValidLanguageName,
  processRow,
  writeJSONFile,
  sortCSVFile,
  incrementVersion,
  readVersion,
  writeVersion
};


/**
 * This is our Express.js server that serves translation data via a REST API.
 * You can ask it for translations in any language we support, and it'll give you back the JSON data.
 */

import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Where we keep all our translation JSON files (they're in the root translation folder)
const translationDir = path.join(__dirname, "..", "translation");

/**
 * Grabs the current version number from our settings file.
 * If something goes wrong or the file doesn't exist, we'll just use a default version.
 */
function getVersion() {
  const versionFile = path.join(__dirname, "..", "settings.json");

  try {
    if (fs.existsSync(versionFile)) {
      const content = fs.readFileSync(versionFile, "utf-8");
      const data = JSON.parse(content);
      return data.version || "v1.0.0.0";
    }
  } catch (error) {
    console.warn(`Warning: Could not read version file: ${error.message}`);
  }

  return "v1.0.0.0";
}

/**
 * Loads up the translation file for a specific language.
 * Just pass in the language code like 'en' or 'de', and we'll try to find that JSON file.
 * If we can't find it, we'll return null so you know it's not available.
 */
function loadTranslation(lang) {
  try {
    const filePath = path.join(translationDir, `${lang}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading translation for ${lang}:`, error.message);
    return null;
  }
}

/**
 * Scans the translation folder and figures out which languages we have available.
 * Basically just looks for all the .json files and returns their names (without the .json part).
 */
function getAvailableLanguages() {
  try {
    if (!fs.existsSync(translationDir)) {
      return [];
    }

    const files = fs.readdirSync(translationDir);
    return files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  } catch (error) {
    console.error("Error reading translation directory:", error.message);
    return [];
  }
}

// This is the main endpoint - ask for translations in a specific language
app.get("/api/translate", (req, res) => {
  const lang = req.query.lang;
  const key = req.query.key;

  const VERSION = getVersion();

  // First, make sure they actually gave us a language code
  if (!lang) {
    return res.status(400).json({
      version: VERSION,
      error: "Missing language parameter",
      message:
        "Please provide a language code using ?lang=<code> (e.g., ?lang=en or ?lang=de)",
      availableLanguages: getAvailableLanguages(),
    });
  }

  // Now let's try to load the translations for that language
  const translations = loadTranslation(lang);

  if (translations === null) {
    return res.status(404).json({
      version: VERSION,
      error: "Language not found",
      message: `Translation file for language '${lang}' not found`,
      availableLanguages: getAvailableLanguages(),
    });
  }

  // If they asked for a specific translation key, just give them that one
  if (key) {
    if (key in translations) {
      return res.json({
        version: VERSION,
        language: lang,
        key: key,
        translation: translations[key],
      });
    } else {
      return res.status(404).json({
        version: VERSION,
        error: "Key not found",
        message: `Translation key '${key}' not found for language '${lang}'`,
        language: lang,
        key: key,
      });
    }
  }

  // Return all translations if no key is specified
  res.json({
    version: VERSION,
    language: lang,
    translations: translations,
  });
});

// API endpoint to get list of available languages
app.get("/api/languages", (req, res) => {
  const VERSION = getVersion();
  const languages = getAvailableLanguages();

  res.json({
    version: VERSION,
    languages: languages,
    count: languages.length,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  const VERSION = getVersion();
  res.json({
    version: VERSION,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  const VERSION = getVersion();
  res.json({
    version: VERSION,
    message: "Translation API Server",
    endpoints: {
      translate: "/api/translate?lang=<language_code>",
      translateKey: "/api/translate?lang=<language_code>&key=<translation_key>",
      languages: "/api/languages",
      health: "/health",
    },
    examples: [
      "/api/translate?lang=en",
      "/api/translate?lang=en&key=confirm_delete",
      "/api/translate?lang=de&key=welcome_message",
    ],
    availableLanguages: getAvailableLanguages(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Translation API server is running on http://localhost:${PORT}`);
  console.log(`Available languages: ${getAvailableLanguages().join(", ")}`);
  console.log(`\nExample usage:`);
  console.log(`  GET http://localhost:${PORT}/api/translate?lang=en`);
  console.log(`  GET http://localhost:${PORT}/api/translate?lang=de`);
  console.log(
    `  GET http://localhost:${PORT}/api/translate?lang=en&key=confirm_delete`
  );
  console.log(`  GET http://localhost:${PORT}/api/languages`);
});

export default app;

# Translation API - Node.js/Express.js

A comprehensive translation management system that converts CSV translation files to JSON format and provides both **REST API** and **i18n library** support.

## Overview

This project offers two main functionalities:

### 🌐 REST API Server
A Node.js/Express.js REST API server that serves translations dynamically. Perfect for:
- Backend services that need to serve translations to multiple clients
- Microservices architecture
- Dynamic translation updates without redeploying frontend applications
- API responses include version information and language metadata

### 📦 i18n Library Files
Generate frontend-ready translation files for popular i18n libraries (react-i18next, vue-i18n, etc.). These files:
- Contain only translation keys (no language property, no version in response)
- Include `_version` property at the top for independent version tracking
- Have separate versioning from API translations (tracked in `settings.json` as `i18nVersion`)
- Are optimized for frontend bundle size
- Ready to import directly into your frontend projects

## Features

- Convert CSV translation files to JSON format
- Express.js API server to serve translations via REST endpoints
- Generate i18n-friendly JSON files for frontend libraries
- Get translations by language code via query parameters
- Automatic version tracking (separate versions for API and i18n files)
- Support for multiple languages and regional variants
- Environment variable configuration support

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

Create a `.env.local` file in the root directory to configure the server:

```bash
# Server Configuration
PORT=8000

# Translation Configuration
# TRANSLATION_DIR=translation
```

**Available Variables:**
- `PORT` - Server port (default: 8000)
- `TRANSLATION_DIR` - Translation directory path (default: `translation`)

You can copy `.env.example` to `.env.local` and modify as needed:

```bash
cp .env.example .env.local
```

## Usage

### Generate Translation Files from CSV

#### For API Server (with version in response)

```bash
npm run translate
```

This will read `translations.csv` and generate JSON files in the `translation/` folder for use with the API server.

You can also specify a custom CSV file path:

```bash
node src/scripts/translate.js /path/to/your/translations.csv
```

#### For Frontend i18n Libraries

```bash
npm run translate:i18n
```

This will read `translations.csv` and generate i18n-friendly JSON files in the `translation/i18n/` folder. These files:
- Contain only translation keys (no language property, no version in response)
- Include a `_version` property at the top of each file
- Are ready to use with frontend i18n libraries like react-i18next, vue-i18n, etc.

You can also specify a custom CSV file path:

```bash
node src/scripts/translate-i18n.js /path/to/your/translations.csv
```

### Start the API Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:8000` by default (configurable via `.env.local`).

## API Endpoints

### Get Translations by Language

```
GET /api/translate?lang=<language_code>
```

**Example:**
- `GET /api/translate?lang=en` - Get English translations
- `GET /api/translate?lang=fa` - Get Farsi translations
- `GET /api/translate?lang=de` - Get German translations
- `GET /api/translate?lang=it` - Get Italian translations
- `GET /api/translate?lang=fr` - Get French translations

**Response:**
```json
{
  "version": "v1.0.0.3",
  "language": "en",
  "translations": {
    "about_us": "About Us",
    "add_new": "Add New",
    ...
  }
}
```

**Get a specific translation key:**
```
GET /api/translate?lang=en&key=about_us
```

**Response:**
```json
{
  "version": "v1.0.0.3",
  "language": "en",
  "key": "about_us",
  "translation": "About Us"
}
```

### Get Available Languages

```
GET /api/languages
```

**Response:**
```json
{
  "version": "v1.0.0.3",
  "languages": ["en", "fa", "de", "it", "fr"],
  "count": 5
}
```

### Health Check

```
GET /health
```

**Response:**
```json
{
  "version": "v1.0.0.3",
  "status": "ok",
  "timestamp": "2024-11-17T12:00:00.000Z"
}
```

### Root Endpoint

```
GET /
```

Returns API information and available endpoints with examples.

## How to Add a New Language

To add a new language to your translations:

1. **Add a new column to your CSV file** with the language code as the header
2. **Add translations** for all keys in that column
3. **Run the translate script** to generate the JSON file

### Example

If you want to add Spanish (`es`), your CSV header should look like:

```csv
key,en,fa,de,it,fr,es
```

Then add Spanish translations for each row:

```csv
key,en,fa,de,it,fr,es
about_us,About Us,درباره ما,Über uns,Chi siamo,À propos de nous,Acerca de nosotros
add_new,Add New,افزودن جدید,Neu hinzufügen,Aggiungi nuovo,Ajouter nouveau,Agregar nuevo
...
```

After running `npm run translate`, a new `es.json` file will be generated in the `translation/` folder.

**Note:** The script automatically:
- Sorts your CSV file alphabetically by key
- Increments the version number in `settings.json`
- Generates JSON files for all languages in your CSV

### Language Code Requirements

Language codes must:
- Contain only letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-)
- Be valid identifiers (e.g., `en`, `en-US`, `zh-CN`, `pt-BR`)

## Supported Language Codes

You can use any of the following ISO 639-1 language codes (or custom codes) in your CSV header:

### Common Languages
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `ar` - Arabic
- `hi` - Hindi
- `fa` - Farsi/Persian
- `tr` - Turkish
- `th` - Thai
- `vi` - Vietnamese
- `id` - Indonesian
- `ms` - Malay
- `he` - Hebrew
- `el` - Greek

### Regional Variants
- `en-US` - English (United States)
- `en-GB` - English (United Kingdom)
- `es-ES` - Spanish (Spain)
- `es-MX` - Spanish (Mexico)
- `pt-BR` - Portuguese (Brazil)
- `pt-PT` - Portuguese (Portugal)
- `zh-CN` - Chinese (Simplified)
- `zh-TW` - Chinese (Traditional)
- `fr-CA` - French (Canada)
- `de-AT` - German (Austria)
- `de-CH` - German (Switzerland)

### Additional Languages
- `nl` - Dutch
- `pl` - Polish
- `sv` - Swedish
- `da` - Danish
- `no` - Norwegian
- `fi` - Finnish
- `cs` - Czech
- `hu` - Hungarian
- `ro` - Romanian
- `uk` - Ukrainian
- `bg` - Bulgarian
- `hr` - Croatian
- `sk` - Slovak
- `sl` - Slovenian
- `et` - Estonian
- `lv` - Latvian
- `lt` - Lithuanian
- `mt` - Maltese
- `ga` - Irish
- `cy` - Welsh
- `is` - Icelandic
- `mk` - Macedonian
- `sq` - Albanian
- `sr` - Serbian
- `bs` - Bosnian
- `ca` - Catalan
- `eu` - Basque
- `gl` - Galician

**Note:** You can also use custom language codes as long as they follow the naming rules (letters, numbers, underscores, and hyphens only).

## Version Management

The project maintains separate version numbers for API translations and i18n files:

- **API Version** (`version` in `settings.json`): Increments automatically when you run `npm run translate`
- **i18n Version** (`i18nVersion` in `settings.json`): Increments automatically when you run `npm run translate:i18n`

Both versions are tracked independently, allowing you to update API and frontend translations separately. The i18n files include the `_version` property at the top of each JSON file for frontend libraries to track changes.

## Project Structure

```
express/
├── package.json          # Node.js dependencies and scripts
├── src/                  # Source code directory
│   ├── main.js          # Express.js API server
│   └── scripts/          # Translation scripts
│       ├── translate.js     # CSV to JSON conversion script (for API)
│       └── translate-i18n.js # CSV to JSON conversion script (for i18n libraries)
├── .env.example         # Example environment variables file
├── .env.local           # Local environment variables (not committed)
├── translations.csv     # Source CSV file with translations
├── settings.json        # Settings file (contains version and i18nVersion)
├── translation/         # Generated JSON translation files
│   ├── en.json          # API translation files
│   ├── fa.json
│   ├── de.json
│   ├── it.json
│   ├── fr.json
│   └── i18n/            # i18n-friendly JSON files (for frontend)
│       ├── en.json
│       ├── fa.json
│       ├── de.json
│       ├── it.json
│       └── fr.json
└── README.md           # This file
```

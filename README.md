# Crunchyroll-Export-Import-List
A Spreadsheet + Google Apps Script to export/import your Watchlist, Crunchylists and History from your Crunchyroll account, get the full list of Anime available on Crunchyroll, and view your watch activity in a Dashboard.

![screenshot](Crunchyroll_Sheet.png)

Spreadsheet with Google Apps Script:
https://docs.google.com/spreadsheets/d/1_1Q0RW8VgaHWQuCZ9zM3johR9vvI99ghYl_rMHNp2Ig/copy

## Features
- Export/Import your **Watchlist**, **History** and **Crunchylists**
- Get the full list of all Anime available on Crunchyroll with Dub and Sub languages
- **Dashboard** with watch activity statistics per month and year
- **Multi-Profile support** – save and switch between multiple Crunchyroll profiles
- **Setup wizard** – automatically creates all sheets with the correct columns
- **Debug tools** – test your token, inspect columns and diagnose import issues

## Sheets
There are 6 sheets in the spreadsheet file:
- **Watch List** – export/import your Watchlist
- **History** – export/import your watch History (includes "Geschaut am" date column)
- **Crunchylist** – export/import your CrunchyLists
- **All Anime** – all anime available on Crunchyroll with Dub/Sub languages (filterable)
- **Dashboard** – visual statistics of your watch activity per month and year
- **Columns to Use** – overview of all available columns for each sheet

## Setup
When you open the spreadsheet for the first time, run the setup wizard to automatically create all sheets with the correct columns and formatting:

**Crunchyroll → 🔧 Setup (Einmalig)**

This will create all sheets with the correct headers, formatting and column order. You only need to run this once.

## Usage
### Run the script
To run the script use one of the options in the **Crunchyroll** menu in the toolbar.

The first time you run the script it will ask for permissions:
- "See, edit, create, and delete all your Google Sheets spreadsheets" – to edit the spreadsheet
- "Connect to an external service" – to get data from the Crunchyroll website

For each operation you need to use the specific sheet (e.g. Export Watchlist writes to the Watch List sheet).

### Authentication Token
For each operation you need to provide an Authorization token from your Crunchyroll session.

To get the token:
1. Go to https://www.crunchyroll.com/ and make sure you are logged in to the correct **profile**
2. Right click anywhere on the page → **Inspect**
3. Go to the **Network** tab
4. Reload the page
5. In the filter bar search for: `https://www.crunchyroll.com/accounts/v1/me`
6. Select the result → go to the **Headers** tab → find **Request Headers**
7. Copy the **Authorization** value (the long string starting with `Bearer`)
8. Paste it into the pop-up in the spreadsheet

> ⚠️ The token expires after approximately 3 minutes. If you get a 401 error, get a fresh token.

### Multi-Profile Support
If your account has multiple profiles (e.g. Don, Max), make sure you are on the correct profile in the browser **before** copying the token. The token is always tied to the active profile.

You can also save tokens per profile using:

**Crunchyroll → Profile → 👤 Profil auswählen / hinzufügen**

### Dashboard
After exporting your History, generate a Dashboard with watch statistics:

**Crunchyroll → Create Dashboard**

The Dashboard shows:
- Watch activity per year (episode count + bar chart)
- Watch activity per month (episode count + bar chart)
- Total episodes watched, most active month/year, average episodes per month

### Debug Tools
If something is not working, use the built-in debug tools:

**Crunchyroll → Debug**
- **Token testen** – checks if your token is valid and all APIs are reachable
- **History Spalten anzeigen** – shows all column names and example values in the History sheet
- **Import Watchlist testen** – tests the import with the first entry and shows the response
- **Import History testen** – tests the history import and shows detailed error info

## Menus Overview
```
Crunchyroll
├── Watch List
│   ├── Export Watch List
│   └── Import Watch List
├── History
│   ├── Export History
│   └── Import History
├── Crunchylists
│   ├── Export Crunchylists
│   └── Import Crunchylists
├── Refresh Anime List
├── Create Dashboard
├── 🔧 Setup (Einmalig)
├── Debug
│   ├── History Spalten anzeigen
│   ├── Import Watchlist testen
│   ├── Import History testen
│   └── Token testen
└── Profile
    ├── 👤 Profile anzeigen
    └── 👤 Profil auswählen / hinzufügen
```

## Files
| File | Description |
|------|-------------|
| `Code.js` | Main functions: export/import for Watchlist, History, Crunchylists and Anime list |
| `Global_var.js` | Column definitions for all sheets (WATCHLIST_COLUMNS, HISTORY_COLUMNS, CRUNCHYLIST_COLUMNS) |
| `Dashboard.js` | Dashboard creation with monthly/yearly watch statistics |
| `Setup.js` | One-time setup wizard to create all sheets automatically |
| `Debug.js` | Debug and diagnostic functions |
| `Profiles.js` | Multi-profile support and token management |

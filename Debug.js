// ============================================================
// DEBUG FUNKTIONEN
// Füge diese Datei zu deinem Google Apps Script Projekt hinzu
// Dann im Menü unter Crunchyroll → Debug aufrufen
// ============================================================
// 1. HISTORY SPALTEN ANZEIGEN
// Zeigt alle Spaltennamen + Beispielwerte aus der History
// ============================================================
function debugHistoryColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const historySheet = ss.getSheetByName("History");

  if (!historySheet) {
    SpreadsheetApp.getUi().alert("❌ Sheet 'History' nicht gefunden!\nBitte erst History exportieren.");
    return;
  }

  if (historySheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("❌ History Sheet ist leer!\nBitte erst History exportieren.");
    return;
  }

  const columns = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues().flat();
  const firstRow = historySheet.getRange(2, 1, 1, historySheet.getLastColumn()).getValues().flat();
  const secondRow = historySheet.getLastRow() > 2
    ? historySheet.getRange(3, 1, 1, historySheet.getLastColumn()).getValues().flat()
    : [];

  console.log("=== HISTORY SPALTEN DEBUG ===");
  console.log("Anzahl Spalten: " + columns.length);
  console.log("Anzahl Zeilen (inkl. Header): " + historySheet.getLastRow());
  console.log("");

  var message = "✅ History Sheet gefunden\n";
  message += "📊 " + (historySheet.getLastRow() - 1) + " Einträge, " + columns.length + " Spalten\n\n";
  message += "Spaltenname → Beispielwert (Zeile 2)\n";
  message += "─────────────────────────────────────\n";

  columns.forEach(function(col, i) {
    var val = firstRow[i];
    var val2 = secondRow[i] !== undefined ? secondRow[i] : "";

    // Datum erkennen
    var hint = "";
    if (val instanceof Date) {
      hint = " 📅 (Datum)";
      val = val.toISOString();
    } else if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) {
      hint = " 📅 (Datum-String)";
    }

    console.log("[" + i + "] " + col + " → " + val + hint);
    message += "[" + i + "] " + col + "\n    → " + val + hint + "\n";
  });

  console.log("");
  console.log("Für Dashboard: Datumsspalte und Titelspalte identifizieren");

  // Datumsspalte automatisch vorschlagen
  var dateSuggestion = columns.find(c =>
    c.toLowerCase().includes("date") ||
    c.toLowerCase().includes("datum") ||
    c.toLowerCase().includes("time") ||
    c.toLowerCase().includes("played") ||
    c.toLowerCase().includes("watched")
  );
  var titleSuggestion = columns.find(c =>
    c.toLowerCase().includes("title") ||
    c.toLowerCase().includes("titel") ||
    c.toLowerCase().includes("name") ||
    c.toLowerCase().includes("anime")
  );

  message += "\n─────────────────────────────────────\n";
  message += "🔍 Vorgeschlagene Datumsspalte: " + (dateSuggestion || "nicht gefunden") + "\n";
  message += "🔍 Vorgeschlagene Titelspalte:  " + (titleSuggestion || "nicht gefunden") + "\n";
  message += "\n➡ Passe diese Zeilen in Dashboard.gs an:\n";
  message += 'const dateColIndex = historyColumns.indexOf("' + (dateSuggestion || "HIER EINTRAGEN") + '");\n';
  message += 'const titleColIndex = historyColumns.indexOf("' + (titleSuggestion || "HIER EINTRAGEN") + '");';

  SpreadsheetApp.getUi().alert(message);
}

// ============================================================
// 2. TOKEN TESTEN
// Prüft ob der Token gültig ist und zeigt Account-Infos
// ============================================================
function debugToken() {
  const token = getToken();
  if (token == "") return;

  const options = {
    muteHttpExceptions: true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Authorization": token
    }
  };

  console.log("=== TOKEN DEBUG ===");
  console.log("Token Länge: " + token.length);
  console.log("Token beginnt mit: " + token.substring(0, 20) + "...");
  console.log("Startet mit 'Bearer ': " + token.startsWith("Bearer "));

  var message = "=== TOKEN DEBUG ===\n\n";
  message += "Token Länge: " + token.length + "\n";
  message += "Beginnt mit 'Bearer ': " + (token.startsWith("Bearer ") ? "✅ Ja" : "❌ Nein – füge 'Bearer ' davor ein!") + "\n\n";

  // Test 1: Account Info
  message += "--- Test 1: Account Info ---\n";
  try {
    const response = UrlFetchApp.fetch("https://www.crunchyroll.com/accounts/v1/me", options);
    const code = response.getResponseCode();
    const body = JSON.parse(response.getContentText());

    console.log("Account API Status: " + code);
    console.log("Account Response: " + JSON.stringify(body));

    if (code === 200) {
      message += "✅ Token gültig!\n";
      message += "Account ID: " + (body.account_id || "nicht gefunden") + "\n";
      message += "External ID: " + (body.external_id || "nicht gefunden") + "\n";
    } else {
      message += "❌ Fehler " + code + "\n";
      message += "Antwort: " + JSON.stringify(body) + "\n";
    }
  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
    console.log("Exception bei Account Info: " + e.message);
  }

  // Test 2: Watchlist
  message += "\n--- Test 2: Watchlist API ---\n";
  try {
    const accountId = getAccountId(options);
    const wlResponse = UrlFetchApp.fetch(
      "https://www.crunchyroll.com/content/v2/discover/" + accountId + "/watchlist?order=desc&n=1",
      options
    );
    const wlCode = wlResponse.getResponseCode();
    console.log("Watchlist API Status: " + wlCode);

    if (wlCode === 200) {
      message += "✅ Watchlist API erreichbar\n";
    } else {
      message += "❌ Fehler " + wlCode + "\n";
      message += "Antwort: " + wlResponse.getContentText().substring(0, 200) + "\n";
    }
  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
  }

  // Test 3: History API
  message += "\n--- Test 3: History API ---\n";
  try {
    const accountId = getAccountId(options);
    const histResponse = UrlFetchApp.fetch(
      "https://www.crunchyroll.com/content/v2/" + accountId + "/watch-history?page_size=1",
      options
    );
    const histCode = histResponse.getResponseCode();
    console.log("History API Status: " + histCode);

    if (histCode === 200) {
      message += "✅ History API erreichbar\n";
    } else {
      message += "❌ Fehler " + histCode + "\n";
      message += "Antwort: " + histResponse.getContentText().substring(0, 200) + "\n";
    }
  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
  }

  SpreadsheetApp.getUi().alert(message);
}

// ============================================================
// 3. IMPORT WATCHLIST DEBUGGEN
// Testet den Import mit dem ersten Eintrag und zeigt Details
// ============================================================
function debugImportWatchlist() {
  const token = getToken();
  if (token == "") return;

  const options = {
    muteHttpExceptions: true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Authorization": token
    }
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Watch List");
  if (!ss || ss.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("❌ Watch List Sheet ist leer oder nicht gefunden!");
    return;
  }

  const watchlist = ss.getRange("A2:A" + ss.getLastRow()).getValues().flat().filter(v => v !== "");

  console.log("=== IMPORT WATCHLIST DEBUG ===");
  console.log("Anzahl Einträge in Sheet: " + watchlist.length);
  console.log("Erster Eintrag (content_id): " + watchlist[0]);

  var message = "=== IMPORT WATCHLIST DEBUG ===\n\n";
  message += "📋 Einträge im Sheet: " + watchlist.length + "\n";
  message += "Erster content_id: " + watchlist[0] + "\n\n";

  // Account ID holen
  var accountId;
  try {
    accountId = getAccountId(options);
    message += "✅ Account ID: " + accountId + "\n\n";
  } catch(e) {
    message += "❌ Account ID Fehler: " + e.message + "\n";
    SpreadsheetApp.getUi().alert(message);
    return;
  }

  // Nur ersten Eintrag testen
  const urlWatchList = "https://www.crunchyroll.com/content/v2/" + accountId + "/watchlist";
  const testOptions = {
    muteHttpExceptions: true,
    "method": "post",
    contentType: 'application/json',
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Authorization": token
    },
    payload: JSON.stringify({ "content_id": watchlist[0] })
  };

  message += "--- Test Import (erster Eintrag) ---\n";
  message += "URL: " + urlWatchList + "\n";
  message += "Payload: " + testOptions.payload + "\n\n";

  try {
    const response = UrlFetchApp.fetch(urlWatchList, testOptions);
    const code = response.getResponseCode();
    const body = response.getContentText();

    console.log("Import Response Code: " + code);
    console.log("Import Response Body: " + body);

    message += "Response Code: " + code + "\n";
    message += "Response Body: " + body.substring(0, 500) + "\n\n";

    if (code === 200 || code === 201) {
      message += "✅ Import funktioniert!\n";
      message += "ℹ Wenn nur ein Anime importiert wird aber nicht alle:\n";
      message += "→ Das ist ein bekanntes Problem mit fetchAll()\n";
      message += "→ Zwischen den Requests eine Pause einbauen\n";
    } else if (code === 401) {
      message += "❌ Token abgelaufen oder ungültig\n";
      message += "→ Neuen Token aus dem Browser holen\n";
    } else if (code === 409) {
      message += "⚠ Anime bereits in der Watchlist (kein Fehler)\n";
    } else {
      message += "❌ Unbekannter Fehler\n";
    }
  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
    console.log("Exception beim Import: " + e.message);
  }

  SpreadsheetApp.getUi().alert(message);
}

// ============================================================
// 4. IMPORT HISTORY DEBUGGEN
// Testet den History Import mit dem ersten Eintrag
// ============================================================
function debugImportHistory() {
  const token = getToken();
  if (token == "") return;

  const options = {
    muteHttpExceptions: true,
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Authorization": token
    }
  };

  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("History");
  if (!ss || ss.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("❌ History Sheet ist leer oder nicht gefunden!");
    return;
  }

  const history = ss.getRange("A2:A" + ss.getLastRow()).getValues().flat().filter(v => v !== "");

  console.log("=== IMPORT HISTORY DEBUG ===");
  console.log("Anzahl Einträge: " + history.length);
  console.log("Erster Eintrag: " + history[0]);

  var message = "=== IMPORT HISTORY DEBUG ===\n\n";
  message += "📋 Einträge im Sheet: " + history.length + "\n";
  message += "Erster Eintrag (episode_id): " + history[0] + "\n\n";

  // Account ID holen
  var accountId;
  try {
    accountId = getAccountId(options);
    message += "✅ Account ID: " + accountId + "\n\n";
  } catch(e) {
    message += "❌ Account ID Fehler: " + e.message + "\n";
    SpreadsheetApp.getUi().alert(message);
    return;
  }

  // Nur ersten Eintrag testen
  const urlMarkAsWatched = "https://www.crunchyroll.com/content/v2/discover/" + accountId + "/mark_as_watched/" + history[0];
  const testOptions = {
    muteHttpExceptions: true,
    "method": "post",
    contentType: 'application/json',
    "headers": {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Authorization": token
    }
  };

  message += "--- Test Import (erster Eintrag) ---\n";
  message += "URL: " + urlMarkAsWatched + "\n\n";

  try {
    const response = UrlFetchApp.fetch(urlMarkAsWatched, testOptions);
    const code = response.getResponseCode();
    const body = response.getContentText();

    console.log("History Import Response Code: " + code);
    console.log("History Import Response Body: " + body);

    message += "Response Code: " + code + "\n";
    message += "Response Body: " + (body || "(leer)") + "\n\n";

    if (code === 200 || code === 201 || code === 204) {
      message += "✅ History Import funktioniert!\n";
    } else if (code === 401) {
      message += "❌ Token abgelaufen oder ungültig\n";
      message += "→ Neuen Token aus dem Browser holen\n";
      message += "→ Token muss mit 'Bearer ' beginnen\n";
    } else if (code === 404) {
      message += "❌ Episode nicht gefunden\n";
      message += "→ Die episode_id in Spalte A könnte falsch sein\n";
      message += "→ Prüfe ob Spalte A wirklich die Episode-ID enthält\n";
      message += "\nAlle Spalten im History Sheet:\n";
      const cols = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues().flat();
      cols.forEach((c, i) => { message += "[" + i + "] " + c + "\n"; });
    } else if (code === 400) {
      message += "❌ Ungültige Anfrage\n";
      message += "→ Episode-ID Format könnte falsch sein\n";
      message += "→ Erwartet wird z.B. 'GRDQPM1ZE' (Crunchyroll Episode ID)\n";
    } else {
      message += "❌ Unbekannter Fehler " + code + "\n";
    }
  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
    console.log("Exception beim History Import: " + e.message);
  }

  SpreadsheetApp.getUi().alert(message);
}
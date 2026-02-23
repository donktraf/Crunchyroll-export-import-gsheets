// ============================================================
// SETUP FUNKTION
// Erstellt automatisch alle Sheets mit den richtigen Spalten
// Einmalig ausführen über Crunchyroll → Setup
// ============================================================

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    "Setup starten?",
    "Es werden folgende Sheets erstellt (falls nicht vorhanden):\n\n" +
    "• Watch List\n• History\n• Crunchylist\n• All Anime\n• Dashboard\n• Columns to Use\n\n" +
    "Bereits vorhandene Sheets werden NICHT überschrieben.",
    ui.ButtonSet.OK_CANCEL
  );

  if (result !== ui.Button.OK) return;

  // ---- Farben ----
  const ORANGE = "#FF5400";
  const ORANGE_LIGHT = "#fff0e8";
  const DARK = "#1a1a1a";
  const WHITE = "#FFFFFF";
  const GRAY = "#f5f5f5";

  // ============================================================
  // WATCH LIST SHEET
  // ============================================================
  var watchListSheet = ss.getSheetByName("Watch List");
  if (!watchListSheet) {
    watchListSheet = ss.insertSheet("Watch List");

    const wlHeaders = [
      "Anime Code",
      "Anime Title",
      "Anime Type",
      "Is Favorite",
      "Date Added"
    ];

    _setupSheet(watchListSheet, wlHeaders, ORANGE, WHITE, ORANGE_LIGHT, GRAY);
    Logger.log("✅ Sheet 'Watch List' erstellt");
  } else {
    Logger.log("⏭ Sheet 'Watch List' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // HISTORY SHEET
  // ============================================================
  var historySheet = ss.getSheetByName("History");
  if (!historySheet) {
    historySheet = ss.insertSheet("History");

    // Nachher:
    const histHeaders = [
      "Episode Code",
      "Anime Title",
      "Season",
      "Episode",
      "Geschaut am"
    ];

    _setupSheet(historySheet, histHeaders, ORANGE, WHITE, ORANGE_LIGHT, GRAY);
    Logger.log("✅ Sheet 'History' erstellt");
  } else {
    Logger.log("⏭ Sheet 'History' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // CRUNCHYLIST SHEET
  // ============================================================
  var crunchylistSheet = ss.getSheetByName("Crunchylist");
  if (!crunchylistSheet) {
    crunchylistSheet = ss.insertSheet("Crunchylist");

    const clHeaders = [
      "Crunchylist Title",
      "Anime Code",
      "Anime Title"
    ];

    _setupSheet(crunchylistSheet, clHeaders, ORANGE, WHITE, ORANGE_LIGHT, GRAY);
    Logger.log("✅ Sheet 'Crunchylist' erstellt");
  } else {
    Logger.log("⏭ Sheet 'Crunchylist' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // ALL ANIME SHEET
  // ============================================================
  var allAnimeSheet = ss.getSheetByName("All Anime");
  if (!allAnimeSheet) {
    allAnimeSheet = ss.insertSheet("All Anime");

    const aaHeaders = ["Title", "Link", "Anime Code", "Audio", "Subtitles"];

    _setupSheet(allAnimeSheet, aaHeaders, DARK, ORANGE, ORANGE_LIGHT, GRAY);

    // Filter aktivieren
    allAnimeSheet.getRange(1, 1, 1, aaHeaders.length).createFilter();

    Logger.log("✅ Sheet 'All Anime' erstellt");
  } else {
    Logger.log("⏭ Sheet 'All Anime' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // COLUMNS TO USE SHEET
  // ============================================================
  var columnsSheet = ss.getSheetByName("Columns to Use");
  if (!columnsSheet) {
    columnsSheet = ss.insertSheet("Columns to Use");

    columnsSheet.getRange("A1").setValue("Alle verfügbaren Spalten (generiert per Formel):")
      .setFontWeight("bold").setBackground(DARK).setFontColor(ORANGE);
    columnsSheet.getRange("A2").setFormula("=showAllAvailableColumns()");

    columnsSheet.setColumnWidth(1, 200);
    columnsSheet.setColumnWidth(2, 300);
    columnsSheet.setColumnWidth(3, 120);

    Logger.log("✅ Sheet 'Columns to Use' erstellt");
  } else {
    Logger.log("⏭ Sheet 'Columns to Use' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // DASHBOARD SHEET (leer, wird per Funktion befüllt)
  // ============================================================
  var dashboardSheet = ss.getSheetByName("Dashboard");
  if (!dashboardSheet) {
    dashboardSheet = ss.insertSheet("Dashboard");

    dashboardSheet.getRange("A1").setValue("Dashboard noch nicht erstellt.")
      .setFontColor("#999999").setFontStyle("italic");
    dashboardSheet.getRange("A2").setValue("→ Crunchyroll → Dashboard erstellen (nach dem History Export)")
      .setFontColor(ORANGE);

    Logger.log("✅ Sheet 'Dashboard' erstellt");
  } else {
    Logger.log("⏭ Sheet 'Dashboard' bereits vorhanden, übersprungen");
  }

  // ============================================================
  // REIHENFOLGE DER SHEETS FESTLEGEN
  // ============================================================
  const sheetOrder = ["Watch List", "History", "Crunchylist", "All Anime", "Dashboard", "Columns to Use"];
  sheetOrder.forEach(function (name, index) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.setActiveSheet(sheet);
      ss.moveActiveSheet(index + 1);
    }
  });

  // Zum Watch List Sheet navigieren
  ss.setActiveSheet(ss.getSheetByName("Watch List"));

  ui.alert(
    "✅ Setup abgeschlossen!",
    "Alle Sheets wurden erstellt.\n\n" +
    "Nächste Schritte:\n" +
    "1. Crunchyroll → Watch List → Export Watch List\n" +
    "2. Crunchyroll → History → Export History\n" +
    "3. Crunchyroll → Dashboard erstellen\n\n" +
    "Bei Problemen: Crunchyroll → Debug → Token testen",
    ui.ButtonSet.OK
  );
}

// ============================================================
// HILFSFUNKTION: Sheet formatieren
// ============================================================
function _setupSheet(sheet, headers, headerBg, headerFg, rowAltColor, rowColor) {
  // Header schreiben
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setBackground(headerBg)
    .setFontColor(headerFg)
    .setFontWeight("bold")
    .setFontSize(11);

  // Header Zeile fixieren
  sheet.setFrozenRows(1);

  // Spaltenbreiten anpassen
  headers.forEach(function (_, i) {
    sheet.setColumnWidth(i + 1, 180);
  });

  // Abwechselnde Zeilenfarben für erste 1000 Zeilen
  sheet.getRange(2, 1, 500, headers.length).setBackground(rowColor);
  for (var r = 2; r <= 500; r += 2) {
    sheet.getRange(r, 1, 1, headers.length).setBackground(rowAltColor);
  }

  // Header Zeile Höhe
  sheet.setRowHeight(1, 35);
}
// ============================================================
// DASHBOARD - Aktivität pro Monat/Jahr
// ============================================================

function createDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Dashboard Sheet erstellen oder leeren
  let dashboard = ss.getSheetByName("Dashboard");
  if (!dashboard) {
    dashboard = ss.insertSheet("Dashboard");
  } else {
    dashboard.clear();
  }

  // History Sheet holen
  const historySheet = ss.getSheetByName("History");
  if (!historySheet || historySheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert("Keine History-Daten gefunden. Bitte erst History exportieren.");
    return;
  }

  // Spaltennamen aus History lesen
  const historyColumns = historySheet.getRange(1, 1, 1, historySheet.getLastColumn()).getValues().flat();
  const dateColIndex = historyColumns.indexOf("Geschaut am");
  const titleColIndex = historyColumns.indexOf("Anime Title");


  // Alle History-Daten lesen
  const historyData = historySheet.getRange(2, 1, historySheet.getLastRow() - 1, historySheet.getLastColumn()).getValues();

  // ---- Daten auswerten ----
  var monthlyCount = {};   // { "2024-01": 5, "2024-02": 12, ... }
  var yearlyCount = {};    // { "2024": 30, "2023": 45, ... }
  var monthlyAnime = {};   // { "2024-01": Set{anime1, anime2}, ... }

  const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

  for (let i = 0; i < historyData.length; i++) {
    var rawDate = historyData[i][dateColIndex];
    if (!rawDate) continue;

    //var date = new Date(rawDate);
    var date;
    if (typeof rawDate === "string" && rawDate.includes(".")) {
      // Format: 23.02.2026 12:55:36
      const [datePart, timePart] = rawDate.split(" ");
      const [day, month, year] = datePart.split(".");
      const [h, m, s] = timePart ? timePart.split(":") : [0, 0, 0];
      date = new Date(year, month - 1, day, h, m, s);
    } else {
      date = new Date(rawDate);
    }

    if (isNaN(date.getTime())) continue;

    var year = date.getFullYear().toString();
    var month = date.getMonth(); // 0-11
    var monthKey = year + "-" + String(month + 1).padStart(2, "0");
    var monthLabel = monthNames[month] + " " + year;

    // Monatlich zählen
    if (!monthlyCount[monthKey]) {
      monthlyCount[monthKey] = { label: monthLabel, count: 0, key: monthKey };
    }
    monthlyCount[monthKey].count++;

    // Jährlich zählen
    if (!yearlyCount[year]) {
      yearlyCount[year] = 0;
    }
    yearlyCount[year]++;

    // Einzigartige Anime pro Monat (falls Titelspalte vorhanden)
    if (titleColIndex !== -1) {
      if (!monthlyAnime[monthKey]) {
        monthlyAnime[monthKey] = new Set();
      }
      monthlyAnime[monthKey].add(historyData[i][titleColIndex]);
    }
  }


  // Nach der for-Schleife, vor "Sortieren nach Datum"
  console.log("Monatliche Daten:", JSON.stringify(monthlyCount));
  console.log("Jährliche Daten:", JSON.stringify(yearlyCount));
  console.log("Erster Rohwert:", historyData[0][dateColIndex]);
  console.log("Typ:", typeof historyData[0][dateColIndex]);

  // Sortieren nach Datum
  var sortedMonths = Object.values(monthlyCount).sort((a, b) => a.key.localeCompare(b.key));
  var sortedYears = Object.keys(yearlyCount).sort();

  // ============================================================
  // DASHBOARD AUFBAUEN
  // ============================================================

  // --- Styling Farben ---
  const COLOR_HEADER_BG = "#FF5400";      // Crunchyroll Orange
  const COLOR_HEADER_TEXT = "#FFFFFF";
  const COLOR_SECTION_BG = "#1a1a1a";     // Dunkel
  const COLOR_SECTION_TEXT = "#FF5400";
  const COLOR_ROW_ALT = "#f9f0eb";        // Helles Orange
  const COLOR_TEXT = "#333333";
  const COLOR_BAR = "#FF5400";
  const COLOR_BAR_BG = "#f0f0f0";

  var row = 1;

  // ---- TITEL ----
  dashboard.getRange(row, 1, 1, 6).merge()
    .setValue("🎌 Crunchyroll Dashboard")
    .setBackground(COLOR_HEADER_BG)
    .setFontColor(COLOR_HEADER_TEXT)
    .setFontSize(18)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle");
  dashboard.setRowHeight(row, 50);
  row++;

  dashboard.getRange(row, 1, 1, 6).merge()
    .setValue("Zuletzt aktualisiert: " + new Date().toLocaleString("de-DE"))
    .setBackground("#333333")
    .setFontColor("#aaaaaa")
    .setFontSize(10)
    .setHorizontalAlignment("center");
  row += 2;

  // ---- JAHRES-ZUSAMMENFASSUNG ----
  dashboard.getRange(row, 1, 1, 6).merge()
    .setValue("📅 Aktivität pro Jahr")
    .setBackground(COLOR_SECTION_BG)
    .setFontColor(COLOR_SECTION_TEXT)
    .setFontSize(13)
    .setFontWeight("bold")
    .setHorizontalAlignment("left");
  dashboard.getRange(row, 1).setHorizontalAlignment("left");
  row++;

  // Header
  dashboard.getRange(row, 1).setValue("Jahr").setFontWeight("bold").setBackground("#eeeeee");
  dashboard.getRange(row, 2).setValue("Episoden").setFontWeight("bold").setBackground("#eeeeee");
  dashboard.getRange(row, 3).setValue("Verlauf").setFontWeight("bold").setBackground("#eeeeee");
  dashboard.getRange(row, 3, 1, 4).merge();
  row++;

  var maxYearCount = Math.max(...Object.values(yearlyCount));
  var yearStartRow = row;

  sortedYears.forEach(function (year) {
    var count = yearlyCount[year];
    var barLength = Math.round((count / maxYearCount) * 20);
    var bar = "█".repeat(barLength) + "░".repeat(20 - barLength);

    var isAlt = (row - yearStartRow) % 2 === 0;
    var bg = isAlt ? COLOR_ROW_ALT : "#FFFFFF";

    dashboard.getRange(row, 1).setValue(year).setBackground(bg).setFontColor(COLOR_TEXT);
    dashboard.getRange(row, 2).setValue(count).setBackground(bg).setFontColor(COLOR_TEXT).setHorizontalAlignment("center");
    dashboard.getRange(row, 3, 1, 4).merge().setValue(bar + "  " + count)
      .setBackground(bg).setFontColor(COLOR_BAR).setFontFamily("Courier New");
    row++;
  });

  row += 2;

  // ---- MONATS-DETAIL ----
  dashboard.getRange(row, 1, 1, 6).merge()
    .setValue("📆 Aktivität pro Monat")
    .setBackground(COLOR_SECTION_BG)
    .setFontColor(COLOR_SECTION_TEXT)
    .setFontSize(13)
    .setFontWeight("bold");
  row++;

  // Header
  var headers = ["Monat", "Episoden", "Verlauf"];
  if (titleColIndex !== -1) headers.push("Einz. Anime");

  headers.forEach(function (h, i) {
    dashboard.getRange(row, i + 1).setValue(h).setFontWeight("bold").setBackground("#eeeeee");
  });
  if (titleColIndex !== -1) {
    dashboard.getRange(row, 3, 1, 3).merge();
  } else {
    dashboard.getRange(row, 3, 1, 4).merge();
  }
  row++;

  var maxMonthCount = Math.max(...sortedMonths.map(m => m.count));
  var monthStartRow = row;

  sortedMonths.forEach(function (m) {
    var barLength = Math.round((m.count / maxMonthCount) * 20);
    var bar = "█".repeat(barLength) + "░".repeat(20 - barLength);
    var isAlt = (row - monthStartRow) % 2 === 0;
    var bg = isAlt ? COLOR_ROW_ALT : "#FFFFFF";

    dashboard.getRange(row, 1).setValue(m.label).setBackground(bg).setFontColor(COLOR_TEXT);
    dashboard.getRange(row, 2).setValue(m.count).setBackground(bg).setFontColor(COLOR_TEXT).setHorizontalAlignment("center");

    if (titleColIndex !== -1) {
      var animeCount = monthlyAnime[m.key] ? monthlyAnime[m.key].size : 0;
      dashboard.getRange(row, 3, 1, 3).merge().setValue(bar + "  " + m.count)
        .setBackground(bg).setFontColor(COLOR_BAR).setFontFamily("Courier New");
      dashboard.getRange(row, 4).setValue(animeCount).setBackground(bg).setFontColor(COLOR_TEXT).setHorizontalAlignment("center");
    } else {
      dashboard.getRange(row, 3, 1, 4).merge().setValue(bar + "  " + m.count)
        .setBackground(bg).setFontColor(COLOR_BAR).setFontFamily("Courier New");
    }
    row++;
  });

  row += 2;

  // ---- GESAMT-STATISTIK ----
  var totalEpisodes = historyData.filter(r => r[dateColIndex]).length;

  dashboard.getRange(row, 1, 1, 6).merge()
    .setValue("📊 Gesamt")
    .setBackground(COLOR_SECTION_BG)
    .setFontColor(COLOR_SECTION_TEXT)
    .setFontSize(13)
    .setFontWeight("bold");
  row++;

  var stats = [
    ["Gesamt Episoden geschaut", totalEpisodes],
    ["Aktive Monate", sortedMonths.length],
    ["Aktivstes Jahr", sortedYears.reduce((a, b) => yearlyCount[a] > yearlyCount[b] ? a : b) + " (" + Math.max(...Object.values(yearlyCount)) + " Episoden)"],
    ["Aktivster Monat", sortedMonths.reduce((a, b) => a.count > b.count ? a : b).label + " (" + Math.max(...sortedMonths.map(m => m.count)) + " Episoden)"],
    ["Ø Episoden pro Monat", (totalEpisodes / sortedMonths.length).toFixed(1)],
  ];

  stats.forEach(function (s, i) {
    var bg = i % 2 === 0 ? COLOR_ROW_ALT : "#FFFFFF";
    dashboard.getRange(row, 1, 1, 3).merge().setValue(s[0]).setBackground(bg).setFontColor(COLOR_TEXT).setFontWeight("bold");
    dashboard.getRange(row, 4, 1, 3).merge().setValue(s[1]).setBackground(bg).setFontColor(COLOR_BAR).setFontWeight("bold");
    row++;
  });

  // ---- SPALTENBREITEN ANPASSEN ----
  dashboard.setColumnWidth(1, 160);
  dashboard.setColumnWidth(2, 90);
  dashboard.setColumnWidth(3, 250);
  dashboard.setColumnWidth(4, 120);
  dashboard.setColumnWidth(5, 120);
  dashboard.setColumnWidth(6, 120);

  // Zum Dashboard navigieren
  ss.setActiveSheet(dashboard);

  SpreadsheetApp.getUi().alert("✅ Dashboard wurde erstellt!");
}
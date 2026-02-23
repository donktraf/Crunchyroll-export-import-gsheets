// ============================================================
// PROFIL FUNKTIONEN
// Zeigt alle Profile auf dem Account und welches aktiv ist
// ============================================================

function debugProfiles() {
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

  var message = "=== PROFIL DEBUG ===\n\n";

  // ---- Aktuelles Profil holen ----
  console.log("=== PROFIL DEBUG ===");
  try {
    const meResponse = UrlFetchApp.fetch("https://www.crunchyroll.com/accounts/v1/me", options);
    const meCode = meResponse.getResponseCode();
    const meBody = JSON.parse(meResponse.getContentText());

    console.log("Account Info Status: " + meCode);
    console.log("Account Info: " + JSON.stringify(meBody));

    if (meCode !== 200) {
      message += "❌ Token ungültig (Code " + meCode + ")\n";
      message += "→ Neuen Token holen und sicherstellen dass er mit 'Bearer ' beginnt\n";
      SpreadsheetApp.getUi().alert(message);
      return;
    }

    message += "✅ Token gültig\n";
    message += "Account ID: " + (meBody.account_id || "unbekannt") + "\n\n";

  } catch(e) {
    message += "❌ Fehler beim Account-Abruf: " + e.message + "\n";
    SpreadsheetApp.getUi().alert(message);
    return;
  }

  // ---- Alle Profile abrufen ----
  message += "--- Alle Profile auf diesem Account ---\n";
  try {
    const profilesResponse = UrlFetchApp.fetch("https://www.crunchyroll.com/accounts/v1/me/profiles", options);
    const profilesCode = profilesResponse.getResponseCode();
    const profilesBody = JSON.parse(profilesResponse.getContentText());

    console.log("Profiles Status: " + profilesCode);
    console.log("Profiles: " + JSON.stringify(profilesBody));

    if (profilesCode === 200) {
      var profiles = profilesBody;
      if (profilesBody.data) profiles = profilesBody.data;
      if (profilesBody.profiles) profiles = profilesBody.profiles;

      if (!Array.isArray(profiles) || profiles.length === 0) {
        message += "⚠ Keine Profile gefunden oder unbekanntes Format\n";
        message += "Rohdaten: " + JSON.stringify(profilesBody).substring(0, 300) + "\n";
      } else {
        message += "Anzahl Profile: " + profiles.length + "\n\n";
        profiles.forEach(function(profile, i) {
          message += "Profil " + (i + 1) + ":\n";
          message += "  Name:       " + (profile.profile_name || profile.username || profile.name || "unbekannt") + "\n";
          message += "  Profil ID:  " + (profile.profile_id || profile.id || "unbekannt") + "\n";
          message += "  Avatar:     " + (profile.avatar || "keiner") + "\n";
          message += "  Ist Kind:   " + (profile.is_primary ? "Nein (Haupt)" : "Nein") + "\n";
          if (profile.maturity_rating) {
            message += "  Altersfreig: " + profile.maturity_rating + "\n";
          }
          message += "\n";
          console.log("Profil " + (i+1) + ": " + JSON.stringify(profile));
        });
      }
    } else if (profilesCode === 404) {
      message += "⚠ Profile-Endpoint nicht verfügbar (Code 404)\n";
      message += "→ Möglicherweise kein Multi-Profil Account\n";
      message += "→ Der Token ist trotzdem gültig für einen Account\n";
    } else {
      message += "❌ Fehler " + profilesCode + "\n";
      message += "Antwort: " + profilesResponse.getContentText().substring(0, 300) + "\n";
    }

  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
    console.log("Exception bei Profiles: " + e.message);
  }

  // ---- Aktives Profil herausfinden ----
  message += "--- Aktives Profil (anhand Token) ---\n";
  try {
    const activeResponse = UrlFetchApp.fetch("https://www.crunchyroll.com/accounts/v1/me/profile", options);
    const activeCode = activeResponse.getResponseCode();
    const activeBody = JSON.parse(activeResponse.getContentText());

    console.log("Active Profile Status: " + activeCode);
    console.log("Active Profile: " + JSON.stringify(activeBody));

    if (activeCode === 200) {
      message += "✅ Aktives Profil gefunden:\n";
      message += "  Name:      " + (activeBody.profile_name || activeBody.username || activeBody.name || "unbekannt") + "\n";
      message += "  Profil ID: " + (activeBody.profile_id || activeBody.id || "unbekannt") + "\n";
      message += "\n⚠ Der Token ist immer an das Profil gebunden\n";
      message += "mit dem du beim Token-Holen eingeloggt warst.\n";
      message += "Um ein anderes Profil zu nutzen:\n";
      message += "→ Im Browser zu dem gewünschten Profil wechseln\n";
      message += "→ Dann einen neuen Token kopieren\n";
    } else {
      message += "⚠ Aktives Profil nicht abrufbar (Code " + activeCode + ")\n";
      message += "Rohdaten: " + activeResponse.getContentText().substring(0, 200) + "\n";
    }

  } catch(e) {
    message += "❌ Exception: " + e.message + "\n";
    console.log("Exception bei Active Profile: " + e.message);
  }

  SpreadsheetApp.getUi().alert(message);
}

// ============================================================
// PROFIL AUSWÄHLEN & TOKEN SPEICHERN
// Speichert Token pro Profil im Script, sodass man nicht
// jedes Mal den Token neu eingeben muss
// ============================================================
function selectProfile() {
  const ui = SpreadsheetApp.getUi();

  // Gespeicherte Profile anzeigen
  const scriptProperties = PropertiesService.getScriptProperties();
  const savedProfiles = scriptProperties.getProperty("crunchyroll_profiles");
  var profiles = savedProfiles ? JSON.parse(savedProfiles) : {};

  var profileNames = Object.keys(profiles);
  var message = "=== PROFIL AUSWÄHLEN ===\n\n";

  if (profileNames.length === 0) {
    message += "Noch keine Profile gespeichert.\n\n";
    message += "Zuerst ein Profil hinzufügen:\n";
    message += "→ 'Profil hinzufügen' auswählen";
  } else {
    message += "Gespeicherte Profile:\n";
    profileNames.forEach(function(name, i) {
      message += (i + 1) + ". " + name + "\n";
    });
    message += "\nAktives Profil: " + (scriptProperties.getProperty("active_profile") || "keines") + "\n";
  }

  var result = ui.alert(
    message + "\n\nMöchtest du ein neues Profil hinzufügen?",
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    addProfile();
  } else if (profileNames.length > 0) {
    // Bestehendes Profil aktivieren
    var nameResult = ui.prompt("Welches Profil aktivieren?\n\nVerfügbare Profile:\n" + profileNames.join("\n"));
    var chosenName = nameResult.getResponseText().trim();

    if (profiles[chosenName]) {
      scriptProperties.setProperty("active_profile", chosenName);
      scriptProperties.setProperty("active_token", profiles[chosenName]);
      ui.alert("✅ Profil '" + chosenName + "' ist jetzt aktiv!\n\nAlle Export/Import Funktionen nutzen ab jetzt dieses Profil automatisch.");
    } else {
      ui.alert("❌ Profil '" + chosenName + "' nicht gefunden.");
    }
  }
}

function addProfile() {
  const ui = SpreadsheetApp.getUi();

  // Profilname abfragen
  var nameResult = ui.prompt("Profilname eingeben (z.B. 'Don', 'Max'):").getResponseText().trim();
  if (!nameResult) return;

  // Token abfragen
  var tokenResult = ui.prompt(
    "Token für Profil '" + nameResult + "' eingeben:\n\n" +
    "So holst du ihn:\n" +
    "1. Im Browser zu Profil '" + nameResult + "' wechseln\n" +
    "2. F12 → Network Tab\n" +
    "3. Watchlist aufrufen\n" +
    "4. Request zu crunchyroll.com/content/v2 suchen\n" +
    "5. Authorization Header kopieren (inkl. 'Bearer ')"
  ).getResponseText().trim();

  if (!tokenResult) return;

  // Profil speichern
  const scriptProperties = PropertiesService.getScriptProperties();
  var saved = scriptProperties.getProperty("crunchyroll_profiles");
  var profiles = saved ? JSON.parse(saved) : {};

  profiles[nameResult] = tokenResult;
  scriptProperties.setProperty("crunchyroll_profiles", JSON.stringify(profiles));
  scriptProperties.setProperty("active_profile", nameResult);
  scriptProperties.setProperty("active_token", tokenResult);

  ui.alert("✅ Profil '" + nameResult + "' gespeichert und aktiviert!\n\nDu kannst jetzt weitere Profile hinzufügen oder direkt exportieren.");
}

// ============================================================
// HILFSFUNKTION: Gibt den aktiven Token zurück
// Falls ein Profil gespeichert ist, wird dieser genutzt
// Falls nicht, wird wie bisher nach dem Token gefragt
// ============================================================
function getTokenForActiveProfile() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const savedToken = scriptProperties.getProperty("active_token");
  const activeProfile = scriptProperties.getProperty("active_profile");

  if (savedToken && activeProfile) {
    const ui = SpreadsheetApp.getUi();
    var result = ui.alert(
      "Aktives Profil: " + activeProfile,
      "Gespeicherten Token für '" + activeProfile + "' verwenden?",
      ui.ButtonSet.YES_NO
    );

    if (result === ui.Button.YES) {
      return savedToken;
    }
  }

  // Fallback: Token manuell eingeben
  return getToken();
}
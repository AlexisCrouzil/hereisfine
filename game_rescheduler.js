//Fonction initiale pour établir les variables et lancer les fonctions
function proposerNouvelleDate() {
  //capture du spreadsheet du calendrier
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  //capture de la feuille du calendrier
  var calendarSheet = sheet.getSheetByName("Calendrier 2024/2025");
  //capture des données de la feuille du calendrier
  var calendarData = calendarSheet.getDataRange().getValues();
  
  //capture du match à déplacer
  //var gameID = 'D2_C01';
  //id slot de destination de test
  //var slotID = '40BLSA19'

  var gameID = Browser.inputBox('Saisisser l\'ID du match à déplacer:');
  if (gameID == 'cancel') {
    Browser.msgBox('Action annulée.');
    return;
  }

  //capture des match plannifiés
  var games = parseMatchData(calendarData, gameID);
  //Logger.log(games[gameID]);
  //Logger.log(games);
  //capture des créneaux (disponibles ou pas)
  var slots = parseSlotData(calendarData);
  //Logger.log(slots);

  //capture des contraintes
  //prios par catégories
  var catSheet = sheet.getSheetByName("Categories");
  var catData = catSheet.getDataRange().getValues();
  var prioParCat = parsePrioParCatData(catData);
  //Logger.log(prioParCat);
  //selon la patinoire
  var patSheet = sheet.getSheetByName("Patinoires");
  var patData = patSheet.getDataRange().getValues();
  var prioParPat = parsePrioParPatData(patData);
  //Logger.log(prioParPat)
  //selon le jour
  var daySheet = sheet.getSheetByName("Jours");
  var dayData = daySheet.getDataRange().getValues();
  var prioParDay = parsePrioParDayData(dayData);
  //Logger.log(prioParDay)

  
  //Logger.log(prioParCat[gameID.categorie])
  
  
  
  //recherche de la meilleure solution et du match éventuel à déplacer
  var meilleursVoisins = gameScheduler(games, slots, prioParCat, prioParPat, prioParDay, gameID);

  Logger.log(meilleursVoisins);

  writeResultsToSheet(meilleursVoisins);
}

function writeResultsToSheet(tableau) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('meilleursVoisins');
  sheet.clear();
  sheet.appendRow(['ID slot', 'malus', 'categorie', 'date', 'heure', 'lieu']);
  for (var id in tableau) {
    var row = [id, tableau[id].malus, tableau[id].categorie, tableau[id].date, tableau[id].heure, tableau[id].lieu];
    sheet.appendRow(row);
  }
}

function parsePrioParDayData(dayData) {
  //capture de la valeur de malus pour le jour privilégié
  var malusDay = {};
  var headers = dayData[0];
  for (var i = 1; i < dayData.length; i++) {
    var id = dayData[i][0];
    var values = {};
    for (var j = 1; j < dayData[i].length; j++) {
      values[headers[j]] = dayData[i][j];
    }
    malusDay[id] = values;
    }
  return malusDay;
}

function parsePrioParPatData(patData) {
  //capture de la valeur de malus par patinoire privilégiée
  var malusPat = {};
  var headers = patData[0];
  for (var i = 1; i < patData.length; i++) {
    var id = patData[i][0];
    var values = {};
    for (var j = 1; j < patData[i].length; j++) {
      values[headers[j]] = patData[i][j];
    }
    malusPat[id] = values;
    }
  return malusPat;
}

function parsePrioParCatData(catData) {
  //capture de la valeur des malus par priorisation de catégories
  var malusCat = {};
  //capture des headers du tableau
  var headers = catData[0];
  for (var i = 1; i < catData.length; i++) {
    var id = catData[i][0];
    var values = {};
    for (var j = 1; j < catData[i].length; j++) {
      values[headers[j]] = catData[i][j];
    }
    malusCat[id] = values;
  }
  return malusCat;
}

function parseMatchData(calendrier) {
  //Capture les matchs plannifiés
  var games = {};
  for (var i = 1; i < calendrier.length; i++) {
    var game = {
      id: calendrier[i][14],
      categorie: calendrier[i][15],
      date: calendrier[i][1],
      heure: calendrier[i][2],
      lieu: calendrier[i][3]
    };  
  games[game.id] = game;
  }
  //gameDay=games[solutionInitiale].date

  return games;

}

function parseSlotData(calendrier) {
  //Capture les créneaux de match dans le fichier (chaque ligne prévue pour un match)
  var slots = {};
  for (var i = 1; i < calendrier.length; i++) {
    var slot = {
      id: calendrier[i][0],
      categorie: calendrier[i][15],
      date: calendrier[i][1],
      heure: calendrier[i][2],
      lieu: calendrier[i][3]
    };  
  slots[slot.id] = slot;
  }
  //gameDay=games[solutionInitiale].date

  return slots;

}

function gameScheduler(games, slots, prioParCat, prioParPat, prioParDay, gameID) {
  var meilleursVoisins = {};
  var gameCategorie = games[gameID].categorie;
  for (var i in slots) {
    if (slots[i].heure != null) {
      var slotCat = slots[i].categorie; //Faut-il rajouter que ça ne doit pas être de la même catégorie?
      var slotPat = slots[i].lieu;
      var slotDay = slots[i].date;
      slotDay = slotDay.getDay();
      var malusCat = prioParCat[gameCategorie][slotCat];
      var malusPat = prioParPat[gameCategorie][slotPat];
      var malusDay = prioParDay[gameCategorie][slotDay];
      var voisin = {
        id: slots[i].id,
        malus: 
          ((malusCat !== undefined) ? malusCat : 0) +
          ((malusPat !== undefined) ? malusPat : 0) +
          ((malusDay !== undefined) ? malusDay : 0),
        categorie: slots[i].categorie,
        date: slots[i].date,
        heure: slots[i].heure,
        lieu: slots[i].lieu
      }
      meilleursVoisins[slots[i].id] = voisin;
      //((malusCat !== undefined) ? malusCat : 0) + 
      //((malusPat !== undefined) ? malusPat : 0) + 
      //((malusDay !== undefined) ? malusDay : 0); /*prioParCat[games[gameID].categorie].slot[i] Trophee_Federal+prioParCat[games[gameID].categorie].Trophee_Federal*/;      
    }
  }
  
  return meilleursVoisins
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Scripts').addItem('Game Scheduler','proposerNouvelleDate').addToUi();
}

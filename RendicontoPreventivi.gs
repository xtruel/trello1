/**
 * Istruzioni d'uso:
 * 1. Apri il progetto Apps Script collegato allo Spreadsheet "Rendiconto Preventivi".
 * 2. In "Proprietà del progetto" → "Proprietà script" imposta: TRELLO_KEY, TRELLO_TOKEN, BOARD_ID.
 * 3. Esegui la funzione createTimeTrigger() per pianificare la sincronizzazione automatica ogni 15 minuti.
 * 4. Avvia manualmente syncTrello() quando desideri forzare un aggiornamento immediato.
 */

const TARGET_LIST_NAMES = ['Preventivi', 'Entrate', 'Uscite'];
const SHEET_NAME = 'Dati';
const SHEET_HEADERS = ['ID', 'Lista', 'Titolo', 'Importo', 'Cliente', 'Data', 'UltimaAttività'];

/**
 * Sincronizza i dati delle card Trello con lo Spreadsheet.
 */
function syncTrello() {
  const logPrefix = '[syncTrello]';

  try {
    const props = PropertiesService.getScriptProperties();
    const apiKey = props.getProperty('TRELLO_KEY');
    const token = props.getProperty('TRELLO_TOKEN');
    const boardId = props.getProperty('BOARD_ID');

    if (!apiKey || !token || !boardId) {
      throw new Error('Proprietà script mancanti. Impostare TRELLO_KEY, TRELLO_TOKEN e BOARD_ID.');
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateDataSheet(spreadsheet);

    const credentials = { key: apiKey, token: token };
    const listResponse = trelloRequest(`/boards/${boardId}/lists`, { fields: 'name' }, credentials);
    const relevantLists = listResponse.filter(function(list) {
      return TARGET_LIST_NAMES.indexOf(list.name) !== -1;
    });

    if (relevantLists.length === 0) {
      Logger.log(logPrefix + ' Nessuna lista Trello corrispondente trovata.');
      return;
    }

    const customFields = trelloRequest(`/boards/${boardId}/customFields`, {}, credentials);
    const { nameToIdMap, idToNameMap } = buildCustomFieldMaps(customFields);

    const targetFieldNames = ['Importo', 'Cliente', 'Data'];
    targetFieldNames.forEach(function(fieldName) {
      if (!nameToIdMap[fieldName]) {
        Logger.log(logPrefix + ' Attenzione: campo personalizzato "' + fieldName + '" non trovato sulla board.');
      }
    });

    const existingRows = buildSheetIndex(sheet);

    relevantLists.forEach(function(list) {
      try {
        const cards = trelloRequest(`/lists/${list.id}/cards`, {
          fields: 'id,name,dateLastActivity'
        }, credentials);

        cards.forEach(function(card) {
          try {
            const customItems = trelloRequest(`/cards/${card.id}/customFieldItems`, {}, credentials);
            const cfValues = extractCustomFieldValues(customItems, idToNameMap);

            const importoValue = normalizeImporto(cfValues.Importo);
            const dataValue = normalizeDateValue(cfValues.Data);
            const lastActivity = normalizeDateValue(card.dateLastActivity);

            const rowValues = [
              card.id,
              list.name,
              card.name,
              importoValue,
              cfValues.Cliente || '',
              dataValue,
              lastActivity
            ];

            upsertRow(sheet, existingRows, card.id, rowValues);
          } catch (cardError) {
            Logger.log(logPrefix + ' Errore nell\'elaborazione della card ' + card.id + ': ' + cardError);
          }
        });
      } catch (listError) {
        Logger.log(logPrefix + ' Errore nel recupero delle card per la lista ' + list.name + ': ' + listError);
      }
    });

    Logger.log(logPrefix + ' Sincronizzazione completata.');
  } catch (error) {
    Logger.log(logPrefix + ' Errore critico: ' + error);
    throw error;
  }
}

/**
 * Crea un trigger time-driven che esegue syncTrello() ogni 15 minuti.
 */
function createTimeTrigger() {
  try {
    const handler = 'syncTrello';
    const existing = ScriptApp.getProjectTriggers().filter(function(trigger) {
      return trigger.getHandlerFunction() === handler;
    });

    const alreadyExists = existing.some(function(trigger) {
      try {
        return trigger.getEventType() === ScriptApp.EventType.CLOCK && trigger.getTriggerSource() === ScriptApp.TriggerSource.CLOCK;
      } catch (e) {
        return false;
      }
    });

    if (alreadyExists) {
      Logger.log('Trigger già presente per syncTrello(). Nessuna azione necessaria.');
      return;
    }

    ScriptApp.newTrigger(handler)
      .timeBased()
      .everyMinutes(15)
      .create();

    Logger.log('Trigger creato: syncTrello() verrà eseguita ogni 15 minuti.');
  } catch (error) {
    Logger.log('[createTimeTrigger] Errore durante la creazione del trigger: ' + error);
    throw error;
  }
}

/**
 * Esegue una richiesta GET alle API di Trello.
 * @param {string} path percorso relativo, ad esempio "/boards/{id}".
 * @param {Object} params parametri query addizionali.
 * @param {Object} credentials { key, token }.
 * @return {Object|Array} risultato JSON parsato.
 */
function trelloRequest(path, params, credentials) {
  if (!path) {
    throw new Error('Percorso API Trello non valido.');
  }

  const query = Object.assign({}, params || {}, {
    key: credentials.key,
    token: credentials.token
  });

  const queryString = Object.keys(query)
    .map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
    })
    .join('&');

  const url = 'https://api.trello.com/1' + path + (queryString ? '?' + queryString : '');

  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      contentType: 'application/json'
    });

    const code = response.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Richiesta Trello fallita (' + code + '): ' + response.getContentText());
    }

    const text = response.getContentText();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    Logger.log('[trelloRequest] Errore per URL ' + url + ': ' + error);
    throw error;
  }
}

/**
 * Restituisce o crea il foglio "Dati" con le intestazioni previste.
 * @param {SpreadsheetApp.Spreadsheet} spreadsheet
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateDataSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureSheetHeaders(sheet);
  return sheet;
}

/**
 * Garantisce che l'intestazione del foglio corrisponda a SHEET_HEADERS.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function ensureSheetHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, SHEET_HEADERS.length);
  const current = range.getValues()[0];
  var needsUpdate = false;

  for (var i = 0; i < SHEET_HEADERS.length; i++) {
    if (current[i] !== SHEET_HEADERS[i]) {
      needsUpdate = true;
      break;
    }
  }

  if (needsUpdate) {
    range.setValues([SHEET_HEADERS]);
    range.setFontWeight('bold');
  }
}

/**
 * Costruisce una mappa ID riga → numero di riga esistente.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @return {Object} mappa { id: rowNumber }
 */
function buildSheetIndex(sheet) {
  const lastRow = sheet.getLastRow();
  const index = {};

  if (lastRow < 2) {
    return index;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, SHEET_HEADERS.length).getValues();
  for (var i = 0; i < data.length; i++) {
    const id = data[i][0];
    if (id) {
      index[id] = i + 2; // +2 per compensare intestazione e indice base 0
    }
  }

  return index;
}

/**
 * Inserisce o aggiorna la riga corrispondente alla card Trello.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object} index mappa ID card → numero di riga.
 * @param {string} id identificativo della card.
 * @param {Array} values valori da scrivere.
 */
function upsertRow(sheet, index, id, values) {
  if (index[id]) {
    sheet.getRange(index[id], 1, 1, values.length).setValues([values]);
  } else {
    sheet.appendRow(values);
    index[id] = sheet.getLastRow();
  }
}

/**
 * Costruisce mappe di supporto per i campi personalizzati.
 * @param {Array} customFields lista dei campi personalizzati.
 * @return {{nameToIdMap: Object, idToNameMap: Object}}
 */
function buildCustomFieldMaps(customFields) {
  const nameToIdMap = {};
  const idToNameMap = {};

  (customFields || []).forEach(function(field) {
    if (field && field.name && field.id) {
      nameToIdMap[field.name] = field.id;
      idToNameMap[field.id] = field.name;
    }
  });

  return { nameToIdMap: nameToIdMap, idToNameMap: idToNameMap };
}

/**
 * Estrae i valori dei campi personalizzati di interesse per una card.
 * @param {Array} items elementi customFieldItems della card.
 * @param {Object} idToNameMap mappa id campo → nome campo.
 * @return {Object} valori per nome campo.
 */
function extractCustomFieldValues(items, idToNameMap) {
  const values = {};

  (items || []).forEach(function(item) {
    const fieldName = idToNameMap[item.idCustomField];
    if (!fieldName) {
      return;
    }

    values[fieldName] = parseCustomFieldValue(item);
  });

  return values;
}

/**
 * Normalizza il campo "Importo" convertendolo in numero quando possibile.
 * @param {*} rawValue valore grezzo.
 * @return {number|string}
 */
function normalizeImporto(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return '';
  }

  const sanitized = String(rawValue).replace(/[^0-9,\.-]/g, '').replace(',', '.');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? rawValue : parsed;
}

/**
 * Converte un valore data in oggetto Date quando possibile.
 * @param {*} value valore input.
 * @return {Date|string}
 */
function normalizeDateValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date;
}

/**
 * Determina il valore leggibile da un elemento customFieldItem.
 * @param {Object} item elemento customFieldItem.
 * @return {string}
 */
function parseCustomFieldValue(item) {
  if (!item) {
    return '';
  }

  if (item.value) {
    if (item.value.text !== undefined) {
      return item.value.text;
    }
    if (item.value.date !== undefined) {
      return item.value.date;
    }
    if (item.value.number !== undefined) {
      return item.value.number;
    }
    if (item.value.checked !== undefined) {
      return item.value.checked;
    }
  }

  if (item.text !== undefined) {
    return item.text;
  }
  if (item.date !== undefined) {
    return item.date;
  }
  if (item.number !== undefined) {
    return item.number;
  }

  return '';
}

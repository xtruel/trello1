# Sistema Trello Personalizzato

## 📋 Descrizione

Sistema di gestione trattative e ordini personalizzato basato su Trello, sviluppato per ottimizzare il workflow aziendale con 3 bacheche principali e integrazione simulata con Excel/Google Drive.

## 🚀 Demo Live

**[Visualizza Demo](https://xtruel.github.io/trello1/)**

## ✨ Funzionalità Principali

### 🎯 **3 Bacheche Strategiche**
- **OBIETTIVI** - Trattative importanti ad alto valore
- **TRATTATIVE ATTIVE** - Negoziazioni in corso
- **ORDINI** - Ordini confermati con tracking completo

### 📊 **Gestione Clienti Avanzata**
- Anagrafica completa (Nome, Azienda, Contatti)
- Valori trattativa e descrizioni dettagliate
- Sistema di priorità con indicatori visivi
- Commenti e cronologia avvenimenti

### 🔄 **Workflow Automatizzato**
- Duplicazione intelligente da TRATTATIVE → ORDINI
- Checklist automatica per fasi ordine (10 step)
- Tracking progresso in tempo reale
- Notifiche visive per le azioni

### 📈 **Integrazione Excel Simulata**
- Sincronizzazione automatica dei dati
- Separazione trattative/ordini/consegne
- Esportazione dati in formato JSON
- Compatibilità con Google Drive

### 🎨 **Interfaccia Moderna**
- Design responsive per desktop e mobile
- Drag & Drop tra liste e bacheche
- Tema moderno con gradiente e glassmorphism
- Animazioni fluide e feedback visivo

## 🛠️ Tecnologie Utilizzate

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Storage**: LocalStorage per persistenza dati
- **Design**: CSS Grid, Flexbox, Animazioni CSS
- **Deployment**: GitHub Pages

## 📦 Installazione

### Opzione 1: Clone Repository
```bash
git clone https://github.com/xtruel/trello1.git
cd trello1
```

### Opzione 2: Download ZIP
1. Scarica il file ZIP dal repository
2. Estrai in una cartella locale
3. Apri `index.html` nel browser

### Opzione 3: Server Locale
```bash
# Con Python
python -m http.server 8000

# Con Node.js
npx http-server -p 8000

# Con PHP
php -S localhost:8000
```

## 🎮 Come Utilizzare

### 1. **Navigazione Base**
- Usa i tab in alto per spostarti tra le bacheche
- Ogni bacheca contiene liste organizzate per città/tipologia

### 2. **Gestione Schede**
- Clicca "+ Aggiungi Scheda" per creare nuovi clienti
- Compila tutti i campi richiesti (anagrafica + trattativa)
- Usa il campo "Commenti" per tracciare gli avvenimenti

### 3. **Workflow Trattative → Ordini**
- Nelle bacheche OBIETTIVI/TRATTATIVE usa "→ Ordini"
- La scheda viene duplicata in ORDINI con checklist automatica
- Traccia il progresso spuntando le fasi completate

### 4. **Drag & Drop**
- Trascina le schede tra liste diverse
- Sposta tra bacheche per cambiare stato
- Ricevi notifiche per ogni spostamento

### 5. **Esportazione Dati**
- Clicca "Esporta Dati Excel" in alto a destra
- Scarica file JSON compatibile con Excel
- Importa in Google Sheets o Excel Online

## 📋 Struttura Dati

### Scheda Cliente
```javascript
{
  id: "unique_id",
  clientName: "Nome Cliente",
  clientCompany: "Azienda SRL",
  clientPhone: "+39 xxx xxxxxxx",
  clientEmail: "email@azienda.com",
  dealValue: 50000,
  dealDescription: "Descrizione trattativa",
  dealPriority: "alta|media|bassa|critica",
  comments: "Note e avvenimenti",
  listId: "obj-milano",
  board: "obiettivi",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T15:45:00Z",
  checklist: [...] // Solo per ordini
}
```

### Checklist Ordine
```javascript
[
  { id: 1, text: "Conferma ordine ricevuta", completed: true },
  { id: 2, text: "Analisi tecnica completata", completed: false },
  // ... altre fasi
]
```

## 🔧 Personalizzazione

### Aggiungere Nuove Liste
1. Modifica `index.html` aggiungendo nuove liste
2. Aggiorna `getBoardFromListId()` in `script.js`
3. Personalizza gli ID delle liste

### Modificare Checklist Ordini
1. Edita `createOrderChecklist()` in `script.js`
2. Aggiungi/rimuovi fasi secondo il tuo workflow
3. Personalizza i testi delle fasi

### Cambiare Tema Colori
1. Modifica le variabili CSS in `styles.css`
2. Aggiorna i colori di priorità
3. Personalizza il gradiente di sfondo

## 🔗 Integrazione Trello

### Power-Up Personalizzato
1. Vai su [Trello Power-Ups](https://trello.com/power-ups)
2. Crea nuovo Power-Up
3. Configura webhook per sincronizzazione
4. Usa le API Trello per import/export

### Webhook Configuration
```javascript
// Esempio webhook Trello
const webhookUrl = 'https://api.trello.com/1/webhooks';
const callbackUrl = 'https://tuonome.github.io/trello1/webhook';
```

## 📊 Integrazione Excel/Google Drive

### Google Sheets API
```javascript
// Configurazione Google Sheets
const SPREADSHEET_ID = 'your-spreadsheet-id';
const API_KEY = 'your-api-key';
const RANGE = 'Trattative!A1:Z1000';
```

### Microsoft Graph API
```javascript
// Configurazione Excel Online
const CLIENT_ID = 'your-client-id';
const TENANT_ID = 'your-tenant-id';
const WORKBOOK_ID = 'your-workbook-id';
```

## 🚀 Deploy su GitHub Pages

### Setup Automatico
1. Fork questo repository
2. Vai in Settings → Pages
3. Seleziona "Deploy from a branch"
4. Scegli "main" branch
5. La tua app sarà disponibile su `https://xtruel.github.io/trello1/`

### Deploy Manuale
```bash
# Clone e setup
git clone https://github.com/tuonome/trello1.git
cd trello1

# Personalizza e commit
git add .
git commit -m "Personalizzazione iniziale"
git push origin main

# Attiva GitHub Pages dalle impostazioni
```

## 📱 Compatibilità

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile iOS/Android

## 🤝 Contribuire

1. Fork del progetto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 👨‍💻 Autore

**xtruel**
- GitHub: [@xtruel](https://github.com/xtruel)
- Repository: [trello1](https://github.com/xtruel/trello1)
- Demo Live: [https://xtruel.github.io/trello1/](https://xtruel.github.io/trello1/)

## 🙏 Ringraziamenti

- Ispirato da Trello per il design e UX
- Icone da [Heroicons](https://heroicons.com/)
- Font da [Google Fonts](https://fonts.google.com/)

---

⭐ **Se questo progetto ti è stato utile, lascia una stella!** ⭐
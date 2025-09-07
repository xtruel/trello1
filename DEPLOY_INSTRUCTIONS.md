# 🚀 Istruzioni per Deploy GitHub e Integrazione Trello

## 📋 Prerequisiti

- Account GitHub attivo
- Account Trello (opzionale per integrazione)
- Git installato localmente

## 🔧 Deploy su GitHub Pages

### Passo 1: Crea Repository su GitHub

1. Vai su [GitHub.com](https://github.com) e accedi
2. Clicca su "New repository" (+ in alto a destra)
3. Inserisci nome repository: `trello1` (o nome a tua scelta)
4. Seleziona "Public" per GitHub Pages gratuito
5. **NON** inizializzare con README (già presente)
6. Clicca "Create repository"

### Passo 2: Collega Repository Locale

```bash
# Aggiungi remote origin (sostituisci USERNAME con il tuo username GitHub)
git remote add origin https://github.com/USERNAME/trello1.git

# Rinomina branch principale (se necessario)
git branch -M main

# Push iniziale
git push -u origin main
```

### Passo 3: Attiva GitHub Pages

1. Vai nel tuo repository su GitHub
2. Clicca su "Settings" (tab in alto)
3. Scorri fino a "Pages" nel menu laterale
4. In "Source" seleziona:
   - **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Clicca "Save"
6. Attendi 2-5 minuti per il deploy
7. La tua app sarà disponibile su: `https://USERNAME.github.io/trello1/`

### Passo 4: Verifica Deploy Automatico

- Il file `.github/workflows/deploy.yml` è già configurato
- Ogni push su `main` attiverà il deploy automatico
- Controlla lo stato in "Actions" tab del repository

## 🔗 Integrazione con Trello

### Opzione 1: Power-Up Personalizzato (Avanzato)

#### Setup Power-Up
1. Vai su [Trello Power-Ups](https://trello.com/power-ups/admin)
2. Clicca "Create new Power-Up"
3. Compila i dettagli:
   - **Name**: Sistema Trello Personalizzato
   - **Workspace**: Seleziona il tuo workspace
   - **Iframe connector URL**: `https://USERNAME.github.io/trello1/trello-connector.html`
   - **Author**: Il tuo nome

#### Crea File Connector
```html
<!-- Salva come trello-connector.html nella root del progetto -->
<!DOCTYPE html>
<html>
<head>
    <script src="https://p.trellocdn.com/power-up.min.js"></script>
</head>
<body>
    <script>
        TrelloPowerUp.initialize({
            'card-buttons': function(t, options) {
                return [{
                    icon: './icon.png',
                    text: 'Apri in Sistema',
                    callback: function(t) {
                        return t.popup({
                            title: 'Sistema Trello',
                            url: './index.html',
                            height: 600
                        });
                    }
                }];
            }
        });
    </script>
</body>
</html>
```

### Opzione 2: Webhook Integration (Raccomandato)

#### Setup Webhook Trello
1. Ottieni il tuo **API Key**: [https://trello.com/app-key](https://trello.com/app-key)
2. Genera **Token**: Clicca sul link "Token" nella pagina API Key
3. Trova l'**ID della Board**: Vai sulla board → Menu → More → Print and Export → Export JSON

#### Configura Webhook
```javascript
// Aggiungi questo codice in script.js
class TrelloIntegration {
    constructor() {
        this.apiKey = 'TUA_API_KEY';
        this.token = 'TUO_TOKEN';
        this.boardId = 'ID_BOARD_TRELLO';
    }
    
    async syncToTrello(card) {
        const trelloCard = {
            name: `${card.clientName} - ${card.clientCompany}`,
            desc: `Valore: €${card.dealValue}\n${card.dealDescription}\n\nContatti:\nTel: ${card.clientPhone}\nEmail: ${card.clientEmail}\n\nPriorità: ${card.dealPriority}\n\nCommenti:\n${card.comments}`,
            idList: this.getListId(card.board, card.listId)
        };
        
        const response = await fetch(`https://api.trello.com/1/cards?key=${this.apiKey}&token=${this.token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(trelloCard)
        });
        
        return response.json();
    }
    
    getListId(board, localListId) {
        // Mappa le liste locali a quelle Trello
        const listMapping = {
            'obj-milano': 'ID_LISTA_OBIETTIVI_MILANO',
            'obj-roma': 'ID_LISTA_OBIETTIVI_ROMA',
            'tra-milano': 'ID_LISTA_TRATTATIVE_MILANO',
            // ... aggiungi tutte le mappature
        };
        return listMapping[localListId];
    }
}
```

### Opzione 3: Import/Export Manuale

#### Export da Sistema a Trello
1. Usa "Esporta Dati Excel" nel sistema
2. Apri il file JSON scaricato
3. Copia i dati e incollali in Trello usando:
   - [Trello CSV Import](https://help.trello.com/article/751-importing-data-into-trello)
   - [Butler Power-Up](https://trello.com/power-ups/butler) per automazioni

#### Import da Trello a Sistema
1. Esporta board Trello: Menu → More → Print and Export → Export JSON
2. Usa questo script per convertire:

```javascript
// Converter Trello → Sistema
function convertTrelloToSystem(trelloData) {
    const systemCards = [];
    
    trelloData.cards.forEach(card => {
        if (!card.closed) {
            const systemCard = {
                id: generateId(),
                clientName: extractClientName(card.name),
                clientCompany: extractCompany(card.desc),
                clientPhone: extractPhone(card.desc),
                clientEmail: extractEmail(card.desc),
                dealValue: extractValue(card.desc),
                dealDescription: card.desc,
                dealPriority: extractPriority(card.labels),
                comments: card.desc,
                listId: mapTrelloList(card.idList),
                board: mapTrelloBoard(card.idList),
                createdAt: card.dateLastActivity
            };
            systemCards.push(systemCard);
        }
    });
    
    return systemCards;
}
```

## 🔄 Workflow Completo

### Scenario 1: Sistema → Trello
1. Crea schede nel sistema locale
2. Usa "Sync con Trello" (se implementato)
3. Le schede appaiono automaticamente in Trello

### Scenario 2: Trello → Sistema
1. Lavora normalmente in Trello
2. Esporta periodicamente i dati
3. Importa nel sistema per analisi avanzate

### Scenario 3: Doppio Workflow
1. Usa Trello per collaborazione team
2. Usa il sistema per analisi e reporting
3. Sincronizza periodicamente

## 📊 Monitoraggio e Analytics

### Google Analytics (Opzionale)
```html
<!-- Aggiungi in index.html prima di </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Hotjar per UX (Opzionale)
```html
<!-- Aggiungi in index.html prima di </head> -->
<script>
    (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
    })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

## 🛠️ Manutenzione

### Aggiornamenti Regolari
```bash
# Workflow tipico per aggiornamenti
git add .
git commit -m "Descrizione modifiche"
git push origin main
# GitHub Pages si aggiorna automaticamente
```

### Backup Dati
- I dati sono salvati in LocalStorage
- Usa "Esporta Dati" regolarmente
- Considera integrazione con Google Drive API

### Monitoraggio Errori
- Controlla Console del browser per errori
- Usa GitHub Issues per bug tracking
- Implementa error logging se necessario

## 🆘 Troubleshooting

### Problemi Comuni

**GitHub Pages non si aggiorna**
- Controlla "Actions" tab per errori
- Verifica che il branch sia "main"
- Attendi fino a 10 minuti per propagazione

**Trello API non funziona**
- Verifica API Key e Token
- Controlla CORS policy
- Usa HTTPS per le chiamate API

**Dati persi in LocalStorage**
- Implementa backup automatico
- Usa "Esporta Dati" prima di aggiornamenti
- Considera database esterno per produzione

## 📞 Supporto

- **GitHub Issues**: Per bug e feature request
- **Trello Community**: [https://community.trello.com/](https://community.trello.com/)
- **Documentazione API**: [https://developer.atlassian.com/cloud/trello/](https://developer.atlassian.com/cloud/trello/)

---

✅ **Checklist Deploy Completo**
- [ ] Repository GitHub creato
- [ ] Codice pushato su main
- [ ] GitHub Pages attivato
- [ ] URL funzionante testato
- [ ] Trello integration configurata (opzionale)
- [ ] Backup dati implementato
- [ ] Documentazione aggiornata
// Sistema Trello Personalizzato - JavaScript
class TrelloSystem {
    constructor() {
        this.currentBoard = 'obiettivi';
        this.cards = JSON.parse(localStorage.getItem('trelloCards')) || {};
        this.excelData = JSON.parse(localStorage.getItem('excelData')) || {
            trattative: [],
            ordini: [],
            consegne: []
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCards();
        this.populateWithSampleData();
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchBoard(e.target.dataset.board);
            });
        });

        // Add card buttons
        document.querySelectorAll('.add-card-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const listId = e.target.closest('.list').dataset.listId;
                this.openCardModal(null, listId);
            });
        });

        // Setup drag and drop
        this.setupDragAndDrop();

        // Modal events
        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('cardModal')) {
                this.closeModal();
            }
        });
    }

    switchBoard(boardId) {
        // Update active tab
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-board="${boardId}"]`).classList.add('active');

        // Update active board
        document.querySelectorAll('.board').forEach(board => board.classList.remove('active'));
        document.getElementById(boardId).classList.add('active');

        this.currentBoard = boardId;
    }

    openCardModal(cardId = null, listId = null) {
        const modal = document.getElementById('cardModal');
        const form = document.getElementById('cardForm');
        const title = document.getElementById('modalTitle');

        if (cardId) {
            // Edit existing card
            const card = this.cards[cardId];
            title.textContent = 'Modifica Scheda Cliente';
            this.populateForm(card);
            form.dataset.cardId = cardId;
        } else {
            // Create new card
            title.textContent = 'Nuova Scheda Cliente';
            form.reset();
            form.dataset.listId = listId;
            delete form.dataset.cardId;
        }

        modal.style.display = 'block';
    }

    populateForm(card) {
        document.getElementById('clientName').value = card.clientName || '';
        document.getElementById('clientCompany').value = card.clientCompany || '';
        document.getElementById('clientPhone').value = card.clientPhone || '';
        document.getElementById('clientEmail').value = card.clientEmail || '';
        document.getElementById('dealValue').value = card.dealValue || '';
        document.getElementById('dealDescription').value = card.dealDescription || '';
        document.getElementById('dealPriority').value = card.dealPriority || 'media';
        document.getElementById('comments').value = card.comments || '';
    }

    saveCard() {
        const form = document.getElementById('cardForm');
        const cardId = form.dataset.cardId;
        const listId = form.dataset.listId;

        const cardData = {
            id: cardId || this.generateId(),
            clientName: document.getElementById('clientName').value,
            clientCompany: document.getElementById('clientCompany').value,
            clientPhone: document.getElementById('clientPhone').value,
            clientEmail: document.getElementById('clientEmail').value,
            dealValue: parseFloat(document.getElementById('dealValue').value) || 0,
            dealDescription: document.getElementById('dealDescription').value,
            dealPriority: document.getElementById('dealPriority').value,
            comments: document.getElementById('comments').value,
            listId: cardId ? this.cards[cardId].listId : listId,
            board: this.getBoardFromListId(cardId ? this.cards[cardId].listId : listId),
            createdAt: cardId ? this.cards[cardId].createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Add checklist for orders board
        if (cardData.board === 'ordini' && !cardId) {
            cardData.checklist = this.createOrderChecklist();
        } else if (cardId && this.cards[cardId].checklist) {
            cardData.checklist = this.cards[cardId].checklist;
        }

        this.cards[cardData.id] = cardData;
        this.saveToLocalStorage();
        this.updateExcelData(cardData);
        this.renderCard(cardData);
        this.closeModal();
    }

    createOrderChecklist() {
        return [
            { id: 1, text: 'Conferma ordine ricevuta', completed: false },
            { id: 2, text: 'Analisi tecnica completata', completed: false },
            { id: 3, text: 'Materiali ordinati', completed: false },
            { id: 4, text: 'Produzione avviata', completed: false },
            { id: 5, text: 'Controllo qualità', completed: false },
            { id: 6, text: 'Imballaggio completato', completed: false },
            { id: 7, text: 'Spedizione programmata', completed: false },
            { id: 8, text: 'Consegna effettuata', completed: false },
            { id: 9, text: 'Installazione completata', completed: false },
            { id: 10, text: 'Collaudo finale', completed: false }
        ];
    }

    duplicateToOrders(cardId) {
        const originalCard = this.cards[cardId];
        const newCard = {
            ...originalCard,
            id: this.generateId(),
            listId: 'ord-in-lavorazione',
            board: 'ordini',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: this.createOrderChecklist()
        };

        this.cards[newCard.id] = newCard;
        this.saveToLocalStorage();
        this.updateExcelData(newCard);
        
        // If we're currently viewing the orders board, render the card
        if (this.currentBoard === 'ordini') {
            this.renderCard(newCard);
        }

        alert(`Scheda duplicata nella bacheca ORDINI con ID: ${newCard.id}`);
    }

    deleteCard(cardId) {
        if (confirm('Sei sicuro di voler eliminare questa scheda?')) {
            delete this.cards[cardId];
            this.saveToLocalStorage();
            document.querySelector(`[data-card-id="${cardId}"]`).remove();
        }
    }

    renderCard(cardData) {
        const listContainer = document.querySelector(`[data-list-id="${cardData.listId}"] .cards-container`);
        if (!listContainer) return;

        // Remove existing card if updating
        const existingCard = document.querySelector(`[data-card-id="${cardData.id}"]`);
        if (existingCard) {
            existingCard.remove();
        }

        const cardElement = document.createElement('div');
        cardElement.className = `card priority-${cardData.dealPriority}`;
        cardElement.dataset.cardId = cardData.id;
        cardElement.draggable = true;

        let checklistHtml = '';
        if (cardData.checklist && cardData.board === 'ordini') {
            const completedCount = cardData.checklist.filter(item => item.completed).length;
            checklistHtml = `
                <div class="checklist">
                    <h4>Fasi Ordine (${completedCount}/${cardData.checklist.length})</h4>
                    ${cardData.checklist.map(item => `
                        <div class="checklist-item ${item.completed ? 'completed' : ''}">
                            <input type="checkbox" ${item.completed ? 'checked' : ''} 
                                   onchange="trelloSystem.toggleChecklistItem('${cardData.id}', ${item.id})">
                            <label>${item.text}</label>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        cardElement.innerHTML = `
            <div class="card-title">${cardData.clientName}</div>
            <div class="card-company">${cardData.clientCompany}</div>
            <div class="card-value">€ ${cardData.dealValue.toLocaleString('it-IT')}</div>
            <div class="card-description">${cardData.dealDescription}</div>
            <div class="card-priority priority-${cardData.dealPriority}">${cardData.dealPriority}</div>
            ${checklistHtml}
            <div class="card-actions">
                <button class="card-action-btn edit-btn" onclick="trelloSystem.openCardModal('${cardData.id}')">Modifica</button>
                ${cardData.board !== 'ordini' ? `<button class="card-action-btn duplicate-btn" onclick="trelloSystem.duplicateToOrders('${cardData.id}')">→ Ordini</button>` : ''}
                <button class="card-action-btn delete-btn" onclick="trelloSystem.deleteCard('${cardData.id}')">Elimina</button>
            </div>
        `;

        listContainer.appendChild(cardElement);
    }

    toggleChecklistItem(cardId, itemId) {
        const card = this.cards[cardId];
        const item = card.checklist.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            this.cards[cardId].updatedAt = new Date().toISOString();
            this.saveToLocalStorage();
            this.updateExcelData(card);
            this.renderCard(card);
        }
    }

    loadCards() {
        Object.values(this.cards).forEach(card => {
            this.renderCard(card);
        });
    }

    getBoardFromListId(listId) {
        if (listId.startsWith('obj-')) return 'obiettivi';
        if (listId.startsWith('tra-')) return 'trattative';
        if (listId.startsWith('ord-')) return 'ordini';
        return 'obiettivi';
    }

    updateExcelData(cardData) {
        // Simulate Excel integration
        const excelRecord = {
            id: cardData.id,
            cliente: cardData.clientName,
            azienda: cardData.clientCompany,
            telefono: cardData.clientPhone,
            email: cardData.clientEmail,
            valore: cardData.dealValue,
            descrizione: cardData.dealDescription,
            priorita: cardData.dealPriority,
            stato: cardData.board,
            lista: cardData.listId,
            dataCreazione: cardData.createdAt,
            dataAggiornamento: cardData.updatedAt
        };

        if (cardData.board === 'ordini') {
            // Update orders Excel
            const existingIndex = this.excelData.ordini.findIndex(item => item.id === cardData.id);
            if (existingIndex >= 0) {
                this.excelData.ordini[existingIndex] = excelRecord;
            } else {
                this.excelData.ordini.push(excelRecord);
            }

            // Add checklist progress
            if (cardData.checklist) {
                excelRecord.faseCompletate = cardData.checklist.filter(item => item.completed).length;
                excelRecord.faseTotali = cardData.checklist.length;
                excelRecord.percentualeCompletamento = Math.round((excelRecord.faseCompletate / excelRecord.faseTotali) * 100);
            }
        } else {
            // Update deals Excel
            const existingIndex = this.excelData.trattative.findIndex(item => item.id === cardData.id);
            if (existingIndex >= 0) {
                this.excelData.trattative[existingIndex] = excelRecord;
            } else {
                this.excelData.trattative.push(excelRecord);
            }
        }

        localStorage.setItem('excelData', JSON.stringify(this.excelData));
        console.log('Dati Excel aggiornati:', this.excelData);
    }

    setupDragAndDrop() {
        // Make cards draggable
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('card')) {
                e.dataTransfer.setData('text/plain', e.target.dataset.cardId);
                e.target.style.opacity = '0.5';
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('card')) {
                e.target.style.opacity = '1';
            }
        });

        // Make lists drop zones
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const cardsContainer = e.target.closest('.cards-container');
            if (cardsContainer) {
                cardsContainer.style.backgroundColor = '#e8f4fd';
            }
        });

        document.addEventListener('dragleave', (e) => {
            const cardsContainer = e.target.closest('.cards-container');
            if (cardsContainer && !cardsContainer.contains(e.relatedTarget)) {
                cardsContainer.style.backgroundColor = '';
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const cardsContainer = e.target.closest('.cards-container');
            if (cardsContainer) {
                cardsContainer.style.backgroundColor = '';
                const cardId = e.dataTransfer.getData('text/plain');
                const newListId = cardsContainer.closest('.list').dataset.listId;
                this.moveCard(cardId, newListId);
            }
        });
    }

    moveCard(cardId, newListId) {
        const card = this.cards[cardId];
        if (!card || card.listId === newListId) return;

        const oldBoard = card.board;
        const newBoard = this.getBoardFromListId(newListId);

        // Update card data
        card.listId = newListId;
        card.board = newBoard;
        card.updatedAt = new Date().toISOString();

        // If moving to orders board and doesn't have checklist, add it
        if (newBoard === 'ordini' && !card.checklist) {
            card.checklist = this.createOrderChecklist();
        }

        // Save changes
        this.saveToLocalStorage();
        this.updateExcelData(card);

        // Re-render the card in new location
        this.renderCard(card);

        // Remove card from old location
        const oldCardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (oldCardElement && oldCardElement.closest('.list').dataset.listId !== newListId) {
            oldCardElement.remove();
        }

        // Show notification
        this.showNotification(`Scheda spostata da ${oldBoard.toUpperCase()} a ${newBoard.toUpperCase()}`);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    generateId() {
        return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    saveToLocalStorage() {
        localStorage.setItem('trelloCards', JSON.stringify(this.cards));
    }

    closeModal() {
        document.getElementById('cardModal').style.display = 'none';
    }

    populateWithSampleData() {
        // Check if we already have data
        if (Object.keys(this.cards).length > 0) return;

        const sampleCards = [
            {
                id: 'sample_1',
                clientName: 'Mario Rossi',
                clientCompany: 'Rossi Costruzioni SRL',
                clientPhone: '+39 02 1234567',
                clientEmail: 'mario.rossi@rossiconstruzioni.it',
                dealValue: 150000,
                dealDescription: 'Fornitura e installazione sistema di climatizzazione per nuovo edificio commerciale',
                dealPriority: 'alta',
                comments: 'Cliente molto interessato. Richiesta preventivo dettagliato entro fine mese. Possibile espansione su altri progetti.',
                listId: 'obj-milano',
                board: 'obiettivi',
                createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_2',
                clientName: 'Laura Bianchi',
                clientCompany: 'TechSolutions SpA',
                clientPhone: '+39 06 9876543',
                clientEmail: 'l.bianchi@techsolutions.com',
                dealValue: 85000,
                dealDescription: 'Upgrade sistema di sicurezza e controllo accessi per sede centrale',
                dealPriority: 'media',
                comments: 'In attesa di approvazione budget dal CDA. Prossimo incontro programmato per la settimana prossima.',
                listId: 'tra-napoli',
                board: 'trattative',
                createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_3',
                clientName: 'Giuseppe Verdi',
                clientCompany: 'Verdi Manifatture SNC',
                clientPhone: '+39 011 5555555',
                clientEmail: 'g.verdi@verdimanifatture.it',
                dealValue: 45000,
                dealDescription: 'Sistema di automazione per linea di produzione tessile',
                dealPriority: 'critica',
                comments: 'URGENTE: Sistema attuale in avaria. Cliente necessita intervento immediato. Preventivo già approvato.',
                listId: 'ord-in-lavorazione',
                board: 'ordini',
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date().toISOString(),
                checklist: [
                    { id: 1, text: 'Conferma ordine ricevuta', completed: true },
                    { id: 2, text: 'Analisi tecnica completata', completed: true },
                    { id: 3, text: 'Materiali ordinati', completed: true },
                    { id: 4, text: 'Produzione avviata', completed: false },
                    { id: 5, text: 'Controllo qualità', completed: false },
                    { id: 6, text: 'Imballaggio completato', completed: false },
                    { id: 7, text: 'Spedizione programmata', completed: false },
                    { id: 8, text: 'Consegna effettuata', completed: false },
                    { id: 9, text: 'Installazione completata', completed: false },
                    { id: 10, text: 'Collaudo finale', completed: false }
                ]
            },
            {
                id: 'sample_4',
                clientName: 'Anna Ferrari',
                clientCompany: 'Ferrari Logistics',
                clientPhone: '+39 02 7777777',
                clientEmail: 'a.ferrari@ferrarilogistics.com',
                dealValue: 220000,
                dealDescription: 'Sistema completo di gestione magazzino automatizzato',
                dealPriority: 'alta',
                comments: 'Cliente di riferimento nel settore. Progetto pilota che potrebbe portare ad altri 3 impianti simili.',
                listId: 'obj-grandi-clienti',
                board: 'obiettivi',
                createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: 'sample_5',
                clientName: 'Marco Neri',
                clientCompany: 'Neri Alimentari SRL',
                clientPhone: '+39 081 3333333',
                clientEmail: 'm.neri@nerialimentari.it',
                dealValue: 32000,
                dealDescription: 'Sistema di refrigerazione per nuovo punto vendita',
                dealPriority: 'bassa',
                comments: 'Trattativa in fase iniziale. Cliente sta valutando anche altri fornitori.',
                listId: 'tra-pmi',
                board: 'trattative',
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        sampleCards.forEach(card => {
            this.cards[card.id] = card;
            this.updateExcelData(card);
        });

        this.saveToLocalStorage();
        this.loadCards();
    }

    // Method to export Excel data (simulation)
    exportExcelData() {
        const dataToExport = {
            trattative: this.excelData.trattative,
            ordini: this.excelData.ordini,
            timestamp: new Date().toISOString()
        };
        
        console.log('Dati Excel da esportare:', dataToExport);
        
        // In a real implementation, this would send data to Google Drive or Excel Online
        const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trello_data_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize the system
const trelloSystem = new TrelloSystem();

// Add export button functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add export button to header
    const header = document.querySelector('.header');
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Esporta Dati Excel';
    exportBtn.className = 'add-list-btn';
    exportBtn.style.position = 'absolute';
    exportBtn.style.right = '20px';
    exportBtn.style.top = '20px';
    exportBtn.onclick = () => trelloSystem.exportExcelData();
    header.appendChild(exportBtn);
});

// Console helper for debugging
console.log('Sistema Trello Personalizzato caricato. Usa trelloSystem per accedere alle funzionalità.');
console.log('Comandi utili:');
console.log('- trelloSystem.exportExcelData() - Esporta i dati Excel');
console.log('- trelloSystem.cards - Visualizza tutte le schede');
console.log('- trelloSystem.excelData - Visualizza i dati Excel simulati');
console.log('- localStorage.clear() - Cancella tutti i dati salvati');
new Vue({
    el: '#app',
    data: {
        columns: [[], [], []], 
        showAddNoteForm: false, 
        newNoteTitle: '',
        newNoteItems: [{ text: '' }, { text: '' }, { text: '' }], 
    },
    computed: {
        isBlocked() {
            return this.columns[1].length >= 5 && this.columns[0].some(note => {
                let completed = note.items.filter(i => i.done).length;
                return completed / note.items.length > 0.5;
            });
        },
        canAddItem() {
            return this.newNoteItems.length < 5; 
        }
    },
    methods: {
        addNote() {
            if (this.isBlocked) {
                alert("Добавление новых карточек запрещено, пока не освободится место во втором столбце!");
                return;
            }

            
            const items = this.newNoteItems.map(item => ({
                text: item.text.trim(),
                done: false,
                disabled: false
            }));

            const newNote = {
                id: Date.now(),
                title: this.newNoteTitle.trim(),
                items: items,
                completedAt: null,
                isFavorite: false,
            };

            
            this.columns[0].push(newNote);

            
            this.newNoteTitle = '';
            this.newNoteItems = [{ text: '' }, { text: '' }, { text: '' }];
            this.showAddNoteForm = false;

            this.saveData();
        },

        addItem() {
            
            if (this.canAddItem) {
                this.newNoteItems.push({ text: '' });
            }
        },

        removeItem(index) {
            
            if (this.newNoteItems.length >= 4) {
                this.newNoteItems.splice(index, 1);
            }
        },

        clearItem(index) {
            
            if (this.newNoteItems.length === 3) {
                this.newNoteItems[index].text = '';
            }
        },

        updateProgress() {
          
            let secondColumnFull = this.columns[1].length >= 5;

          
            this.columns[0].forEach(note => {
                let completed = note.items.filter(i => i.done).length;
                let total = note.items.length;

                
                note.canCompleteMoreThan50 = !(secondColumnFull && completed / total >= 0.5);

                
                note.items.forEach(item => {
                    item.disabled = !item.done && !note.canCompleteMoreThan50;
                });

                
                if (completed / total > 0.5 && !secondColumnFull) {
                    this.columns[0] = this.columns[0].filter(n => n.id !== note.id);
                    this.columns[1].push(note);
                }
            });

            
            this.columns[1].forEach(note => {
                let completed = note.items.every(i => i.done) && note.items.length > 0;

                if (completed) {
                  
                    note.completedAt = new Date().toLocaleString();
                    
                    this.columns[1] = this.columns[1].filter(n => n.id !== note.id);
                    this.columns[2].unshift(note);
                }
            });

            this.saveData();
        },

        saveData() {
            localStorage.setItem('notes', JSON.stringify(this.columns));
        },

        loadData() {
            let data = localStorage.getItem('notes');
            if (data) {
                this.columns = JSON.parse(data);
            }
        },

        toggleFavorite(note) {
            note.isFavorite = !note.isFavorite;
            this.saveData();
            this.$forceUpdate(); // Форсируем обновление Vue
        },

        clearStorage() {
            localStorage.removeItem('notes');
            this.columns = [[], [], []];
        }
    },
    mounted() {
        this.loadData();
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [[], [], []],
        showAddNoteForm: false,
        newNoteTitle: '',
        newNoteItems: [{ text: '' }, { text: '' }, { text: '' }],
        isPriority: false,
        canAddNote: true,
        canMarkItems: true,
        isPriorityCardActive: false
    },
    computed: {

        canAddItem() {
            return this.newNoteItems.length < 5;
        },

        addNoteButtonText() {
            return this.showAddNoteForm ? "Отменить" : "Добавить новую заметку";
        }
    },
    methods: {

        checkCanAddNote() {
            this.canAddNote = this.columns[0].length < 3;
        },


        checkCanMarkItems() {

            const isSecondColumnFull = this.columns[1].length >= 5;


            const hasReadyNote = this.columns[0].some(note => {
                const completed = note.items.filter(i => i.done).length;
                const total = note.items.length;
                return completed / total >= 0.5;
            });


            this.canMarkItems = !(isSecondColumnFull && hasReadyNote);


            this.columns[0].forEach(note => {
                note.items.forEach(item => {

                    item.disabled = (this.isPriorityCardActive && !note.isPriority) || (!this.canMarkItems && !note.isPriority);
                });
            });

            console.log("canMarkItems:", this.canMarkItems);
            console.log("Second column full:", isSecondColumnFull);
            console.log("Has ready note:", hasReadyNote);
        },


        checkPriorityCard() {

            const hasPriorityCard = this.columns[0].some(note => note.isPriority) ||
                this.columns[1].some(note => note.isPriority);


            this.isPriorityCardActive = hasPriorityCard;


            this.columns.forEach(column => {
                column.forEach(note => {
                    note.items.forEach(item => {

                        item.disabled = this.isPriorityCardActive && !note.isPriority;
                    });
                });
            });


            if (!hasPriorityCard) {
                this.columns.forEach(column => {
                    column.forEach(note => {
                        note.items.forEach(item => {
                            item.disabled = false;
                        });
                    });
                });
            }


            this.checkCanMarkItems();
        },


        toggleAddNoteForm() {
            if (!this.canAddNote) return;
            this.showAddNoteForm = !this.showAddNoteForm;
            if (!this.showAddNoteForm) {
                this.newNoteTitle = '';
                this.newNoteItems = [{ text: '' }, { text: '' }, { text: '' }];
                this.isPriority = false;
            }
        },


        addNote() {
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
                isPriority: this.isPriority
            };

            this.columns[0].push(newNote);


            if (newNote.isPriority) {
                this.columns[0].sort((a, b) => b.isPriority - a.isPriority);
            }

            this.newNoteTitle = '';
            this.newNoteItems = [{ text: '' }, { text: '' }, { text: '' }];
            this.showAddNoteForm = false;
            this.isPriority = false;

            this.saveData();
            this.checkCanAddNote();
            this.checkPriorityCard();
        },


        updateProgress() {

            this.columns[0] = this.columns[0].filter(note => {
                let completed = note.items.filter(i => i.done).length;
                let total = note.items.length;

                if (completed / total >= 0.5) {

                    if (note.isPriority) {
                        this.columns[1].unshift(note);
                        return false;
                    }

                    if (this.columns[1].length >= 5) {
                        return true;
                    }

                    this.columns[1].push(note);
                    return false;
                }
                return true;
            });


            this.columns[1] = this.columns[1].filter(note => {
                let completed = note.items.every(i => i.done);

                if (completed) {
                    note.completedAt = new Date().toLocaleString();
                    this.columns[2].unshift(note);
                    return false;
                }
                return true;
            });

            this.columns[1] = this.columns[1].filter(note => {
                let completed = note.items.filter(i => i.done).length;
                let total = note.items.length;


                if (completed / total < 0.5) {
                    this.columns[0].push(note);
                    return false;
                }
                return true;
            });

            this.columns.forEach(column => {
                column.sort((a, b) => b.isPriority - a.isPriority);
            });


            this.checkPriorityCard();


            this.moveReadyNotesToSecondColumn();


            this.checkCanAddNote();
            this.saveData();

            console.log("Columns after update:", this.columns);
        },


        moveReadyNotesToSecondColumn() {

            if (this.columns[1].length < 5) {
                this.columns[0] = this.columns[0].filter(note => {
                    let completed = note.items.filter(i => i.done).length;
                    let total = note.items.length;

                    if (completed / total >= 0.5) {

                        this.columns[1].push(note);
                        return false;
                    }
                    return true;
                });
            }
        },


        saveData() {
            localStorage.setItem('notes', JSON.stringify(this.columns));
        },


        loadData() {
            let data = localStorage.getItem('notes');
            if (data) {
                this.columns = JSON.parse(data);
            }
            this.checkCanAddNote();
            this.checkPriorityCard();
        },


        clearStorage() {
            localStorage.removeItem('notes');
            this.columns = [[], [], []];
        },


        addItem() {
            if (this.canAddItem) {
                this.newNoteItems.push({ text: '' });
            }
        },


        clearItem(index) {
            this.newNoteItems[index].text = '';
        },


        removeItem(index) {
            this.newNoteItems.splice(index, 1);
        }
    },
    mounted() {
        this.loadData();
    }
});
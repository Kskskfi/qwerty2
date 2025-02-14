new Vue({
    el: '#app',
    data: {
        columns: [[], [], []], // Три столбца: новые, в процессе, завершенные
        showAddNoteForm: false, // Показывать ли форму добавления заметки
        newNoteTitle: '', // Заголовок новой заметки
        newNoteItems: [{ text: '' }, { text: '' }, { text: '' }], // Пункты новой заметки
        isPriority: false, // Приоритетная карточка
        canAddNote: true, // Можно ли добавлять новую заметку
        canMarkItems: true, // Можно ли отмечать пункты в первом столбце
        isPriorityCardActive: false // Есть ли активная приоритетная карточка
    },
    computed: {
        // Можно ли добавить новый пункт в форму
        canAddItem() {
            return this.newNoteItems.length < 5;
        },
        // Текст кнопки добавления заметки
        addNoteButtonText() {
            return this.showAddNoteForm ? "Отменить" : "Добавить новую заметку";
        }
    },
    methods: {
        // Проверка, можно ли добавлять новую заметку
        checkCanAddNote() {
            this.canAddNote = this.columns[0].length < 3;
        },

        // Проверка, можно ли отмечать пункты в первом столбце
        checkCanMarkItems() {
            // Проверяем, есть ли во втором столбце 5 карточек
            const isSecondColumnFull = this.columns[1].length >= 5;

            // Проверяем, есть ли в первом столбце карточка, готовая к переходу (> 50% выполнено)
            const hasReadyNote = this.columns[0].some(note => {
                const completed = note.items.filter(i => i.done).length;
                const total = note.items.length;
                return completed / total >= 0.5;
            });

            // Блокируем первый столбец, если второй столбец заполнен и есть готовая карточка
            this.canMarkItems = !(isSecondColumnFull && hasReadyNote);

            // Обновляем состояние disabled для каждого пункта в карточках первого столбца
            this.columns[0].forEach(note => {
                note.items.forEach(item => {
                    item.disabled = (!this.canMarkItems && !note.isPriority) || this.isPriorityCardActive;
                });
            });

            console.log("canMarkItems:", this.canMarkItems); // Лог для отладки
            console.log("Second column full:", isSecondColumnFull); // Лог для отладки
            console.log("Has ready note:", hasReadyNote); // Лог для отладки
        },

        // Проверка, есть ли активная приоритетная карточка
        checkPriorityCard() {
            // Проверяем, есть ли приоритетная карточка в первом или втором столбце
            const hasPriorityCard = this.columns[0].some(note => note.isPriority) ||
                this.columns[1].some(note => note.isPriority);

            // Если есть приоритетная карточка, блокируем все чекбоксы, кроме её собственных
            this.isPriorityCardActive = hasPriorityCard;

            // Обновляем состояние блокировки для всех карточек
            this.columns.forEach(column => {
                column.forEach(note => {
                    note.items.forEach(item => {
                        item.disabled = this.isPriorityCardActive && !note.isPriority;
                    });
                });
            });

            // Если приоритетная карточка переместилась в третий столбец, разблокируем все чекбоксы
            if (!hasPriorityCard) {
                this.columns.forEach(column => {
                    column.forEach(note => {
                        note.items.forEach(item => {
                            item.disabled = false;
                        });
                    });
                });
            }

            // Проверяем блокировку для первого столбца
            this.checkCanMarkItems();
        },

        // Переключение видимости формы добавления заметки
        toggleAddNoteForm() {
            if (!this.canAddNote) return;
            this.showAddNoteForm = !this.showAddNoteForm;
            if (!this.showAddNoteForm) {
                this.newNoteTitle = '';
                this.newNoteItems = [{ text: '' }, { text: '' }, { text: '' }];
                this.isPriority = false;
            }
        },

        // Добавление новой заметки
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
                isPriority: this.isPriority // Добавляем флаг приоритетности
            };

            this.columns[0].push(newNote);

            // Если карточка приоритетная, перемещаем её вверх
            if (newNote.isPriority) {
                this.columns[0].sort((a, b) => b.isPriority - a.isPriority);
            }

            this.newNoteTitle = '';
            this.newNoteItems = [{ text: '' }, { text: '' }, { text: '' }];
            this.showAddNoteForm = false;
            this.isPriority = false;

            this.saveData();
            this.checkCanAddNote();
            this.checkPriorityCard(); // Проверяем, есть ли приоритетная карточка
        },

        // Обновление прогресса и перемещение карточек между столбцами
        updateProgress() {
            // Перемещаем карточки из первого столбца во второй, если выполнено > 50% пунктов
            this.columns[0] = this.columns[0].filter(note => {
                let completed = note.items.filter(i => i.done).length;
                let total = note.items.length;

                if (completed / total >= 0.5) {
                    // Если карточка приоритетная, перемещаем её, даже если во втором столбце 5 карточек
                    if (note.isPriority) {
                        this.columns[1].unshift(note); // Добавляем в начало второго столбца
                        return false;
                    }
                    // Если второй столбец заполнен, оставляем карточку в первом столбце
                    if (this.columns[1].length >= 5) {
                        return true;
                    }
                    // Иначе перемещаем во второй столбец
                    this.columns[1].push(note);
                    return false;
                }
                return true; // Оставляем карточку в первом столбце
            });

            // Перемещаем карточки из второго столбца в третий, если все пункты выполнены
            this.columns[1] = this.columns[1].filter(note => {
                let completed = note.items.every(i => i.done);

                if (completed) {
                    note.completedAt = new Date().toLocaleString();
                    this.columns[2].unshift(note); // Добавляем в начало третьего столбца
                    return false; // Удаляем карточку из второго столбца
                }
                return true; // Оставляем карточку во втором столбце
            });

            // Сортируем карточки в каждом столбце: приоритетные всегда сверху
            this.columns.forEach(column => {
                column.sort((a, b) => b.isPriority - a.isPriority);
            });

            // Проверяем, есть ли активная приоритетная карточка
            this.checkPriorityCard();

            // Обновляем состояния
            this.checkCanAddNote();
            this.saveData();

            console.log("Columns after update:", this.columns); // Лог для отладки
        },

        // Сохранение данных в localStorage
        saveData() {
            localStorage.setItem('notes', JSON.stringify(this.columns));
        },

        // Загрузка данных из localStorage
        loadData() {
            let data = localStorage.getItem('notes');
            if (data) {
                this.columns = JSON.parse(data);
            }
            this.checkCanAddNote();
            this.checkPriorityCard(); // Проверяем, есть ли приоритетная карточка
        },

        // Очистка localStorage
        clearStorage() {
            localStorage.removeItem('notes');
            this.columns = [[], [], []];
        },

        // Добавление нового пункта в форму
        addItem() {
            if (this.canAddItem) {
                this.newNoteItems.push({ text: '' });
            }
        },

        // Очистка текста пункта
        clearItem(index) {
            this.newNoteItems[index].text = '';
        },

        // Удаление пункта из формы
        removeItem(index) {
            this.newNoteItems.splice(index, 1);
        }
    },
    mounted() {
        this.loadData(); // Загружаем данные при монтировании компонента
    }
});
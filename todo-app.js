(function() {
    // создаем и возвращаем заголовок приложения
    function createAppTitle(title) {
        const appTitle = document.createElement('h2');
        appTitle.innerHTML = title;
        return appTitle;
    }

    // создаем и возвращаем форму для создания дела
    function createTodoItemForm() {
        const form = document.createElement('form');
        const input = document.createElement('input');
        const buttonWrapper = document.createElement('div');
        const button = document.createElement('button');

        form.classList.add('input-group', 'mb-3');
        input.classList.add('form-control');
        input.placeholder = 'Введите название нового дела';
        buttonWrapper.classList.add('input-group-append');
        button.classList.add('btn', 'btn-primary');
        button.setAttribute('disabled', 'true');
        button.textContent = 'Добавить дело';
        
        // при загрузке и очистке формы кнопка недоступна
        input.addEventListener('input', function() {
            
            // trim()-при вводе пробелов кнопка недоступна
            if (input.value.trim()) {
                button.removeAttribute('disabled');                
            } 
            else {
                button.setAttribute('disabled', 'true');
            }            
        });
        
        buttonWrapper.append(button);
        form.append(input);
        form.append(buttonWrapper);

        return {
            form,
            input,
            button
        };
    }    
   
    // создаем и возвращаем список элементов
    function createTodoList() {
        const list = document.createElement('ul');
        list.classList.add('List-group');
        return list;
    }

    function createTodoItem(todo, listType) {               
        const item = document.createElement('li');
        // кнопки помещаем в элемент, который красиво покажет их в одной группе
        const buttonGroup = document.createElement('div');
        const doneButton = document.createElement('button');
        const deleteButton = document.createElement('button');

        // присваиваем id объекта элементу разметки(li) для доступа в обработчиках кнопок удалить и готово
        item.id = todo.id;

        // устанавливаем стили для элемента списка, а так же для размещения кнопок
        // в его правой части с помощью flex
        item.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
       
        if (todo.done){
            item.classList.add('list-group-item-success');
        };

        item.textContent = todo.name;

        buttonGroup.classList.add('btn-group', 'btn-group-sm');
        doneButton.classList.add('btn', 'btn-success');        
        doneButton.textContent = 'Готово';
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.textContent = 'Удалить';

        // вкладываем кнопки в отдельный элемент, чтобы они объединились в один блок
        buttonGroup.append(doneButton);
        buttonGroup.append(deleteButton);
        item.append(buttonGroup);

        // обработчики кнопок готово и удалить здесь, т.к нужны для элементов дефолтного списка
        doneButton.addEventListener('click', function() {
            item.classList.toggle('list-group-item-success');

            const todoArray = loadFromLocalStorage(listType);

            for (let todo of todoArray) {
                if (todo.id === item.id) {
                    todo.done = todo.done ? false : true;
                }
            }

            updateInLocalStorage(listType, todoArray);
        });

        deleteButton.addEventListener('click', function() {
            if (confirm('Вы уверены?')) {
                item.remove();
                removeTodoFromLocalStorage(item.id, listType);
            }
        });

        // приложению нужен доступ к самому элементу и кнопкам, чтобы обрабатывать события нажатия
        return {
            item,
            doneButton,
            deleteButton,
        };
    }

    function createTodoApp(container, title = 'Список дел', defaultTodos, listType) {
        const todoAppTitle = createAppTitle(title);
        const todoItemForm = createTodoItemForm();
        const todoList = createTodoList();   
        
        // добавляем дела по умолчанию в Local storage, тут не совсем так, дела по умолчанию должны использоваться только тогда, когда localStorage пуст
        // if (defaultTodos) {
        //     for (let todo of defaultTodos) {
        //         saveTodoInLocalStorage(todo, listType);           
        //     }
        // };

        // загружаем дела из Local storage
        const localStorageTodos = loadFromLocalStorage(listType) || defaultTodos;

        if (localStorageTodos) {            
            for (let todo of localStorageTodos) {
                const todoItem = createTodoItem(todo, listType); // идентификатор, это отличное решение, и даже правильное, и когда вы будете работать с данными с сервера, он всегда будет. Но если такой возможности нет, можно замыкаться на индексе элемента в массиве, а при удалении обновлять список, в том числе в localStorage, и запускать createTodoApp снова, чтобы создать новый список. Для этого в createTodoItem необходимо будет считать localStorage удалять от туда дело, и после записывать обратно.
                todoList.append(todoItem.item);            
            }   
        };

        container.append(todoAppTitle);
        container.append(todoItemForm.form);
        container.append(todoList);

        // браузер создает событие submit (событие только для эл. form) на форме по нажатию на Enter или на кнопку создания дела
        todoItemForm.form.addEventListener('submit', function(e) {
            
            // эта строка необходима, чтобы предотвратить стандартное действие браузера
            // в даннлом случае мы не хотим, чтобы страница перезагружалась при отправки формы
            e.preventDefault();
            // кнопка недоступна после отправки формы
            document.querySelector('button').disabled = true;
            
            // игнорируем создание элемента, если пользователь ничего не ввёл в поле 
            if (!todoItemForm.input.value) {
                return;                
            }

            // создаём объект дела
            const todoObject = createTodoObject(todoItemForm.input.value, false);

            // создаём элемент разметки
            const todoItem = createTodoItem(todoObject, listType); 

            // сохраняем объект в Local storage
            saveTodoInLocalStorage(todoObject, listType);           
                       
                        
            todoList.append(todoItem.item);
                               
            // обнуляем значение в поле, чтобы не стирать вручную
            todoItemForm.input.value = '';
        });
        
    } 

    function saveTodoInLocalStorage(todoObject, listType) {
        let todoArray = loadFromLocalStorage(listType);

        if (!todoArray) {
            todoArray = [];
            todoArray.push(todoObject);

            updateInLocalStorage(listType, todoArray);
        }
        else {
            if (!isTodoExist(todoObject, todoArray)) {
                todoArray.push(todoObject);
                updateInLocalStorage(listType, todoArray);
            }
        }
    }  

    function removeTodoFromLocalStorage(todoId, listType) {
        const todoArray = loadFromLocalStorage(listType);

        let resultTodoArray = todoArray.filter(function(todo) { 
            return todo.id !== todoId;
        });

        updateInLocalStorage(listType, resultTodoArray);
    }
    
    function isTodoExist(todoObject, todoArray) {
        let isTodoExist = false;

        for (let todo of todoArray) {
            if (todo.id === todoObject.id) {
                isTodoExist = true;
            }      
        }

        return isTodoExist;
    }

    // генерацию нашла в нете
    function generateId() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    } 

    function createTodoObject(name, done) {
        const todoObject = {};

        todoObject.id = generateId();
        todoObject.name = name;
        todoObject.done = done;

        return todoObject;
    }

    function loadFromLocalStorage(key) {
        return JSON.parse(localStorage.getItem(key));
    }

    function updateInLocalStorage(key, value){
        localStorage.removeItem(key);  
        localStorage.setItem(key, JSON.stringify(value));  
    }
    
    window.createTodoApp = createTodoApp;
})();

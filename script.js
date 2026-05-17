const toolTabs = document.querySelectorAll('[data-tool]');
const activeToolLabel = document.getElementById('activeToolLabel');
const sessionCount = document.getElementById('sessionCount');

const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const todoEmpty = document.getElementById('todoEmpty');
const todoFilterButtons = document.querySelectorAll('#todoTool [data-filter]');
const todoClearCompleted = document.getElementById('todoClearCompleted');

const expenseForm = document.getElementById('expenseForm');
const expenseDescription = document.getElementById('expenseDescription');
const expenseAmount = document.getElementById('expenseAmount');
const expenseType = document.getElementById('expenseType');
const expenseList = document.getElementById('expenseList');
const expenseEmpty = document.getElementById('expenseEmpty');
const expenseFilterButtons = document.querySelectorAll('#expenseTool [data-filter]');
const expenseClear = document.getElementById('expenseClear');
const expenseTotal = document.getElementById('expenseTotal');
const expenseIncome = document.getElementById('expenseIncome');
const expenseSpent = document.getElementById('expenseSpent');

const pomodoroModeButtons = document.querySelectorAll('#pomodoroTool [data-mode]');
const pomodoroTime = document.getElementById('pomodoroTime');
const pomodoroStatus = document.getElementById('pomodoroStatus');
const pomodoroStart = document.getElementById('pomodoroStart');
const pomodoroPause = document.getElementById('pomodoroPause');
const pomodoroReset = document.getElementById('pomodoroReset');
const pomodoroSessions = document.getElementById('pomodoroSessions');

const habitForm = document.getElementById('habitForm');
const habitInput = document.getElementById('habitInput');
const habitList = document.getElementById('habitList');
const habitEmpty = document.getElementById('habitEmpty');

const calcDisplay = document.getElementById('calcDisplay');
const calcButtons = document.getElementById('calcButtons');

const toolSections = document.querySelectorAll('.tool-card');

let todoTasks = JSON.parse(localStorage.getItem('miniAppTodos') || '[]');
let todoFilter = 'all';

let expenses = JSON.parse(localStorage.getItem('miniAppExpenses') || '[]');
let expenseFilter = 'all';

let habits = JSON.parse(localStorage.getItem('miniAppHabits') || '[]');

const defaultPomodoro = {
    mode: 'work',
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    timeRemaining: 25 * 60,
    running: false,
    sessionsCompleted: 0,
};
let pomodoro = JSON.parse(localStorage.getItem('miniAppPomodoro') || JSON.stringify(defaultPomodoro));
let pomodoroInterval = null;

let calcValue = '0';

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function switchTool(tool) {
    toolTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.tool === tool));
    toolSections.forEach(section => section.classList.toggle('active', section.id === `${tool}Tool`));
    updateGlobalStats(tool);
}

function updateGlobalStats(tool) {
    activeToolLabel.textContent = {
        todo: 'To-do',
        expense: 'Expense Tracker',
        pomodoro: 'Pomodoro',
        habit: 'Habit Tracker',
        calculator: 'Calculator',
    }[tool];

    const count = {
        todo: todoTasks.length,
        expense: expenses.length,
        pomodoro: pomodoro.sessionsCompleted,
        habit: habits.length,
        calculator: 0,
    }[tool];

    sessionCount.textContent = tool === 'calculator' ? 'Ready' : count;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function renderTodo() {
    const visibleTasks = todoTasks.filter(task => {
        if (todoFilter === 'active') return !task.completed;
        if (todoFilter === 'completed') return task.completed;
        return true;
    });

    todoList.innerHTML = '';
    if (!visibleTasks.length) {
        todoEmpty.style.display = 'block';
        return;
    }
    todoEmpty.style.display = 'none';

    visibleTasks.forEach(task => {
        const item = document.createElement('li');
        item.className = `task-item${task.completed ? ' completed' : ''}`;

        const check = document.createElement('button');
        check.type = 'button';
        check.className = `task-check${task.completed ? ' active' : ''}`;
        check.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
        check.addEventListener('click', () => toggleTodoComplete(task.id));

        const text = document.createElement('p');
        text.className = `task-text${task.completed ? ' completed' : ''}`;
        text.textContent = task.text;

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-task';
        remove.textContent = '✕';
        remove.setAttribute('aria-label', 'Delete task');
        remove.addEventListener('click', () => deleteTodo(task.id));

        item.append(check, text, remove);
        todoList.appendChild(item);
    });
}

function saveTodos() {
    saveData('miniAppTodos', todoTasks);
}

function addTodoTask(text) {
    const value = text.trim();
    if (!value) return;
    todoTasks.push({ id: Date.now().toString(), text: value, completed: false });
    saveTodos();
    renderTodo();
    updateGlobalStats('todo');
}

function deleteTodo(id) {
    todoTasks = todoTasks.filter(task => task.id !== id);
    saveTodos();
    renderTodo();
    updateGlobalStats('todo');
}

function toggleTodoComplete(id) {
    todoTasks = todoTasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTodos();
    renderTodo();
    updateGlobalStats('todo');
}

function clearTodoCompleted() {
    todoTasks = todoTasks.filter(task => !task.completed);
    saveTodos();
    renderTodo();
    updateGlobalStats('todo');
}

function renderExpense() {
    const visibleExpenses = expenses.filter(entry => {
        if (expenseFilter === 'income') return entry.type === 'income';
        if (expenseFilter === 'expense') return entry.type === 'expense';
        return true;
    });

    expenseList.innerHTML = '';
    if (!visibleExpenses.length) {
        expenseEmpty.style.display = 'block';
        return;
    }
    expenseEmpty.style.display = 'none';

    visibleExpenses.forEach(entry => {
        const item = document.createElement('li');
        item.className = 'expense-item';

        const meta = document.createElement('div');
        meta.className = 'expense-meta';
        const label = document.createElement('p');
        label.textContent = entry.description;
        const type = document.createElement('small');
        type.textContent = entry.type === 'income' ? 'Income' : 'Expense';
        type.style.color = entry.type === 'income' ? '#34d399' : '#f87171';
        meta.append(label, type);

        const amount = document.createElement('p');
        amount.className = 'expense-amount';
        amount.textContent = formatCurrency(entry.amount * (entry.type === 'expense' ? -1 : 1));

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-task';
        remove.textContent = '✕';
        remove.setAttribute('aria-label', 'Delete entry');
        remove.addEventListener('click', () => deleteExpense(entry.id));

        item.append(meta, amount, remove);
        expenseList.appendChild(item);
    });
}

function saveExpenses() {
    saveData('miniAppExpenses', expenses);
}

function updateExpenseSummary() {
    const income = expenses.filter(e => e.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const spent = expenses.filter(e => e.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    const balance = income - spent;
    expenseIncome.textContent = formatCurrency(income);
    expenseSpent.textContent = formatCurrency(spent);
    expenseTotal.textContent = formatCurrency(balance);
}

function addExpense(description, amount, type) {
    const descriptionText = description.trim();
    const value = parseFloat(amount);
    if (!descriptionText || Number.isNaN(value) || value <= 0) return;

    expenses.push({ id: Date.now().toString(), description: descriptionText, amount: value, type });
    saveExpenses();
    renderExpense();
    updateExpenseSummary();
    updateGlobalStats('expense');
}

function deleteExpense(id) {
    expenses = expenses.filter(entry => entry.id !== id);
    saveExpenses();
    renderExpense();
    updateExpenseSummary();
    updateGlobalStats('expense');
}

function clearExpenses() {
    expenses = [];
    saveExpenses();
    renderExpense();
    updateExpenseSummary();
    updateGlobalStats('expense');
}

function loadPomodoroState() {
    if (!pomodoro.timeRemaining) {
        pomodoro = { ...defaultPomodoro };
    }
    saveData('miniAppPomodoro', pomodoro);
}

function renderPomodoro() {
    pomodoroModeButtons.forEach(button => button.classList.toggle('active', button.dataset.mode === pomodoro.mode));
    pomodoroTime.textContent = formatTime(pomodoro.timeRemaining);
    pomodoroStatus.textContent = pomodoro.running ? 'Running' : 'Paused';
    pomodoroSessions.textContent = pomodoro.sessionsCompleted;
}

function formatTime(seconds) {
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
}

function getPomodoroDuration(mode) {
    return {
        work: pomodoro.workMinutes,
        shortBreak: pomodoro.shortBreakMinutes,
        longBreak: pomodoro.longBreakMinutes,
    }[mode] * 60;
}

function setPomodoroMode(mode) {
    pomodoro.mode = mode;
    pomodoro.timeRemaining = getPomodoroDuration(mode);
    pomodoro.running = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    saveData('miniAppPomodoro', pomodoro);
    renderPomodoro();
}

function startPomodoro() {
    if (pomodoro.running) return;
    pomodoro.running = true;
    saveData('miniAppPomodoro', pomodoro);
    renderPomodoro();

    pomodoroInterval = setInterval(() => {
        if (pomodoro.timeRemaining <= 0) {
            completePomodoroCycle();
            return;
        }

        pomodoro.timeRemaining -= 1;
        saveData('miniAppPomodoro', pomodoro);
        renderPomodoro();
    }, 1000);
}

function pausePomodoro() {
    pomodoro.running = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    saveData('miniAppPomodoro', pomodoro);
    renderPomodoro();
}

function resetPomodoro() {
    pomodoro.timeRemaining = getPomodoroDuration(pomodoro.mode);
    pomodoro.running = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    saveData('miniAppPomodoro', pomodoro);
    renderPomodoro();
}

function completePomodoroCycle() {
    clearInterval(pomodoroInterval);
    pomodoro.running = false;

    if (pomodoro.mode === 'work') {
        pomodoro.sessionsCompleted += 1;
        pomodoro.mode = pomodoro.sessionsCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
    } else {
        pomodoro.mode = 'work';
    }

    pomodoro.timeRemaining = getPomodoroDuration(pomodoro.mode);
    saveData('miniAppPomodoro', pomodoro);
    renderPomodoro();
    updateGlobalStats('pomodoro');
}

function renderHabits() {
    habitList.innerHTML = '';
    if (!habits.length) {
        habitEmpty.style.display = 'block';
        return;
    }
    habitEmpty.style.display = 'none';

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    habits.forEach(habit => {
        const item = document.createElement('li');
        item.className = 'habit-item';

        const row = document.createElement('div');
        row.className = 'habit-row';
        const label = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent = habit.name;
        const progress = document.createElement('small');
        const completedCount = habit.progress.filter(Boolean).length;
        progress.textContent = `${completedCount}/7 days`;
        label.append(title, progress);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'delete-task';
        remove.textContent = '✕';
        remove.setAttribute('aria-label', 'Delete habit');
        remove.addEventListener('click', () => deleteHabit(habit.id));
        row.append(label, remove);

        const days = document.createElement('div');
        days.className = 'habit-days';

        habit.progress.forEach((completed, index) => {
            const dayButton = document.createElement('button');
            dayButton.type = 'button';
            dayButton.className = `habit-day${completed ? ' active' : ''}`;
            dayButton.textContent = dayLabels[index];
            dayButton.addEventListener('click', () => toggleHabitDay(habit.id, index));
            days.appendChild(dayButton);
        });

        item.append(row, days);
        habitList.appendChild(item);
    });
}

function saveHabits() {
    saveData('miniAppHabits', habits);
}

function addHabit(name) {
    const label = name.trim();
    if (!label) return;
    habits.push({ id: Date.now().toString(), name: label, progress: [false, false, false, false, false, false, false] });
    saveHabits();
    renderHabits();
    updateGlobalStats('habit');
}

function toggleHabitDay(id, dayIndex) {
    habits = habits.map(habit => {
        if (habit.id !== id) return habit;
        const progress = [...habit.progress];
        progress[dayIndex] = !progress[dayIndex];
        return { ...habit, progress };
    });
    saveHabits();
    renderHabits();
}

function deleteHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    saveHabits();
    renderHabits();
    updateGlobalStats('habit');
}

function renderCalculator() {
    calcDisplay.textContent = calcValue;
}

function setCalculatorValue(value) {
    if (calcValue === '0') {
        calcValue = value;
    } else {
        calcValue += value;
    }
    renderCalculator();
}

function deleteCalculatorCharacter() {
    calcValue = calcValue.length > 1 ? calcValue.slice(0, -1) : '0';
    renderCalculator();
}

function clearCalculator() {
    calcValue = '0';
    renderCalculator();
}

function evaluateCalculator() {
    const sanitized = calcValue.replace(/[^0-9.+\-*/() ]/g, '');
    try {
        const result = new Function(`return ${sanitized}`)();
        calcValue = String(Number.isFinite(result) ? result : 0);
    } catch {
        calcValue = 'Error';
    }
    renderCalculator();
}

toolTabs.forEach(tab => {
    tab.addEventListener('click', () => switchTool(tab.dataset.tool));
});

todoForm.addEventListener('submit', event => {
    event.preventDefault();
    addTodoTask(todoInput.value);
    todoInput.value = '';
    todoInput.focus();
});

todoFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
        todoFilter = button.dataset.filter;
        todoFilterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
        renderTodo();
    });
});

todoClearCompleted.addEventListener('click', clearTodoCompleted);

expenseForm.addEventListener('submit', event => {
    event.preventDefault();
    addExpense(expenseDescription.value, expenseAmount.value, expenseType.value);
    expenseDescription.value = '';
    expenseAmount.value = '';
    expenseDescription.focus();
});

expenseFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
        expenseFilter = button.dataset.filter;
        expenseFilterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
        renderExpense();
    });
});

expenseClear.addEventListener('click', clearExpenses);

pomodoroModeButtons.forEach(button => {
    button.addEventListener('click', () => setPomodoroMode(button.dataset.mode));
});

pomodoroStart.addEventListener('click', startPomodoro);
pomodoroPause.addEventListener('click', pausePomodoro);
pomodoroReset.addEventListener('click', resetPomodoro);

habitForm.addEventListener('submit', event => {
    event.preventDefault();
    addHabit(habitInput.value);
    habitInput.value = '';
    habitInput.focus();
});

calcButtons.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value) {
        setCalculatorValue(value);
        return;
    }

    if (action === 'clear') {
        clearCalculator();
        return;
    }

    if (action === 'delete') {
        deleteCalculatorCharacter();
        return;
    }

    if (action === 'equals') {
        evaluateCalculator();
    }
});

window.addEventListener('beforeunload', () => {
    if (pomodoroInterval) clearInterval(pomodoroInterval);
});

loadPomodoroState();
renderTodo();
renderExpense();
updateExpenseSummary();
renderPomodoro();
renderHabits();
renderCalculator();
updateGlobalStats('todo');

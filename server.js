import express from 'express';
import cors from 'cors'; // Импортирай cors модула
import { users } from './data/users.js';

const app = express();

// Използвай cors като middleware
app.use(cors());

// Middleware за парсване на JSON заявки
app.use(express.json());

// Начална страница
app.get('/', (req, res) => {
    res.send('Welcome to the Users and Books API');
});

// Всички потребители
app.get('/users', (req, res) => {
    res.json(users);
});

// Конкретен потребител по ID
app.get('/users/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
});

// Книги на конкретен потребител по ID на потребителя
app.get('/users/:id/books', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (user) {
        res.json(user.books);
    } else {
        res.status(404).send('User not found');
    }
});

// Създаване на нов потребител
app.post('/users', (req, res) => {
    const newUser = {
        id: users.length + 1,
        name: req.body.name,
        books: req.body.books || []
    };

    users.push(newUser);
    res.status(201).json(newUser);
});

// Добавяне на нова книга към потребител по ID
app.post('/users/:id/books', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);

    if (user) {
        const newBook = {
            id: user.books.length + 1,
            title: req.body.title
        };
        user.books.push(newBook);
        res.status(201).json(newBook);
    } else {
        res.status(404).send('User not found');
    }
});

// Стартиране на сървъра
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

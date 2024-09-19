import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db('bookstore');  // Базата данни се казва "bookstore"
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err);
  }
}

connectDB();

// Начална страница
app.get('/', (req, res) => {
  res.send('Welcome to the Users and Books API');
});

// Всички потребители
app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

// Конкретен потребител по ID
app.get('/users/:id', async (req, res) => {
  try {
    const user = await db
      .collection('users')
      .findOne({ id: +req.params.id });
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching user');
  }
});

// Книги на конкретен потребител по ID на потребителя
app.get('/users/:id/books', async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ id: +req.params.id });
    if (user) {
      res.json(user.books);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching user books');
  }
});

// Създаване на нов потребител
app.post('/users', async (req, res) => {
  try {
    const newUser = {
      name: req.body.name,
      books: req.body.books || [],
    };

    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json(result.ops[0]); // Връщаме новосъздадения потребител
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// Добавяне на нова книга към потребител по ID
app.post('/users/:id', async (req, res) => {
  try {

    const user = await db.collection('users').findOne({ id: +req.params.id });

    if (user) {
      const newBook = {
        id: user.books.length + 1,
        title: req.body.title,
      };

      await db.collection('users').updateOne(
        { id: +req.params.id },
        { $push: { books: newBook } }
      );

      res.status(201).json(newBook);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error adding book');
  }
});

app.delete('/users/:userId/books/:bookId', async (req, res) => {
  try {
    const userId = +req.params.userId;
    const bookId = +req.params.bookId;

    console.log(`UserId: ${userId}, BookId: ${bookId}`);

    const user = await db.collection('users').findOne({ id: userId });

    if (user) {
      const bookIndex = user.books.findIndex(book => book.id === bookId);

      if (bookIndex === -1) {
        return res.status(404).send('Book not found');
      }

      user.books.splice(bookIndex, 1);

      await db.collection('users').updateOne(
        { id: userId },
        { $set: { books: user.books } }
      );

      return res.status(200).json({ message: 'Book deleted successfully', books: user.books });
    } else {
      return res.status(404).send('User not found');
    }
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error deleting book');
  }
});


// Стартиране на сървъра
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

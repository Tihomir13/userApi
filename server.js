import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db('bookstore');
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err);
  }
}

connectDB();

// Middleware за удостоверяване на JWT токена
function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).send('Access Denied');

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
}

// Начална страница
app.get('/', (req, res) => {
  res.send('Welcome to the Users and Books API');
});

// Регистрация на потребител
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).send('All fields are required');
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      books: [],
    };

    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// Логин на потребител
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const user = await db.collection('users').findOne({ email });
    if (!user) return res.status(404).send('User not found');

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).send('Invalid password');

    const token = jwt.sign({ id: user._id, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token });
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

// Защитени маршрути (изискват валиден JWT)
app.get('/users', authenticateToken, async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

app.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
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
app.get('/users/:id/books', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
    if (user) {
      res.json(user.books);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching user books');
  }
});

// Създаване на нов потребител (само за тест, не се ползва след логин система)
app.post('/users', authenticateToken, async (req, res) => {
  try {
    const newUser = {
      name: req.body.name,
      books: req.body.books || [],
    };

    const result = await db.collection('users').insertOne(newUser);
    res.status(201).json(result.ops[0]);
  } catch (err) {
    res.status(500).send('Error creating user');
  }
});

// Добавяне на нова книга към потребител по ID
app.post('/users/:id/books', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });

    if (user) {
      const newBook = {
        id: user.books.length + 1,
        title: req.body.title,
      };

      await db.collection('users').updateOne(
        { _id: new ObjectId(req.params.id) },
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

// Стартиране на сървъра
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
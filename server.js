import express from 'express';
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';

const app = express();
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI);

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

app.get('/users', async (req, res) => {
  try {
    const users = await db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).send('Error fetching users');
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (user) {
      res.json(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching user');
  }
});

app.get('/users/:id/books', async (req, res) => {
  try {
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (user) {
      res.json(user.books);
    } else {
      res.status(404).send('User not found');
    }
  } catch (err) {
    res.status(500).send('Error fetching user books');
  }
});

app.post('/users', async (req, res) => {
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

app.post('/users/:id/books', async (req, res) => {
  try {
    const user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(req.params.id) });

    if (user) {
      const newBook = {
        id: user.books.length + 1,
        title: req.body.title,
      };

      await db
        .collection('users')
        .updateOne(
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

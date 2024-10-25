const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');


public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  if (users.find(user => user.username === username)) {
    return res.status(409).json({ message: "Username already exists" });
  }

  users.push({ username, password });
  return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  res.json(JSON.parse(JSON.stringify(books, null, 2)));
  return res.status(300).json({message: "Yet to be implemented"});
});

public_users.get('/books', function (req, res) {
  const getBooksPromise = new Promise((resolve, reject) => {
    axios.get('http://localhost:5000/')
      .then(response => {
        resolve(response.data);
      })
      .catch(error => {
        reject(error);
      });
  });

  getBooksPromise
    .then(books => {
      res.json(books);
    })
    .catch(error => {
      res.status(500).json({ message: "Error fetching books", error: error.message });
    });
});

public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  
  try {
    const response = await axios.get(`http://localhost:5000/isbn/${isbn}`);
    res.json(response.data);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      res.status(404).json({ message: "Book not found" });
    } else {
      res.status(500).json({ message: "Error fetching book details", error: error.message });
    }
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    res.json(book);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
 });

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const bookISBNs = Object.keys(books);
  const matchingBooks = [];

  for (const isbn of bookISBNs) {
    if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
      matchingBooks.push({ isbn, ...books[isbn] });
    }
  }

  if (matchingBooks.length > 0) {
    res.json(matchingBooks);
  } else {
    res.status(404).json({ message: "No books found for this author" });
  }
});

public_users.get('/async-author/:author', async function (req, res) {
  const author = req.params.author;
  
  try {
    const response = await axios.get(`http://localhost:5000/`);
    const allBooks = response.data;
    const matchingBooks = Object.values(allBooks).filter(book => 
      book.author.toLowerCase() === author.toLowerCase()
    );

    if (matchingBooks.length > 0) {
      res.json(matchingBooks);
    } else {
      res.status(404).json({ message: "No books found for this author" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching book details", error: error.message });
  }
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const bookISBNs = Object.keys(books);
  const matchingBooks = [];

  for (const isbn of bookISBNs) {
    if (books[isbn].title.toLowerCase().includes(title)) {
      matchingBooks.push({ isbn, ...books[isbn] });
    }
  }

  if (matchingBooks.length > 0) {
    res.json(matchingBooks);
  } else {
    res.status(404).json({ message: "No books found with this title" });
  }
});

public_users.get('/async-title/:title', async function (req, res) {
  const title = req.params.title.toLowerCase();
  
  try {
    const response = await axios.get('http://localhost:5000/');
    const allBooks = response.data;
    const matchingBooks = Object.values(allBooks).filter(book => 
      book.title.toLowerCase().includes(title)
    );

    if (matchingBooks.length > 0) {
      res.json(matchingBooks);
    } else {
      res.status(404).json({ message: "No books found with this title" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error fetching book details", error: error.message });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    res.json(book.reviews);
  } else {
    res.status(404).json({ message: "Book not found" });
  }
});

module.exports.general = public_users;

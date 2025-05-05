# Express Todo API

A fully functional and secure RESTful API built with **Express.js**, implementing basic CRUD operations for a Todo list. This project was built as part of my ongoing **Web Development Apprenticeship** through **Creating Coding Careers**.

---

## Features

- GET all todo items
- GET a single item by ID
- POST a new todo item
- PUT to fully update an item
- PATCH to partially update an item
- DELETE a todo item
- Filter items by `?completed=true` or `?completed=false`
- Input validation and sanitization
- Protection against HTML and SQL injection
- Error logging to `logs/error.log` for 404 and 500 errors
- Uptime display at `/` root route

---

## Tech Stack

- Node.js
- Express.js
- JavaScript (ES6+)
- Postman (for manual testing)
- Morgan (request logging)
- dotenv
- File system for error logging

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
node server/index.js
```

---

## Sample Requests (Using Postman)

### Create a New Todo (POST)

`POST /api/TodoItems`

```json
{
  "todoItemId": 3,
  "name": "Finish homework",
  "priority": 1,
  "completed": false
}
```

---

### Update an Item (PUT)

`PUT /api/TodoItems/3`

```json
{
  "name": "Finish homework today",
  "priority": 2,
  "completed": true
}
```

---

### Partial Update (PATCH)

`PATCH /api/TodoItems/3`

```json
{
  "completed": true
}
```

---

### Send Unsafe Input (POST)

`POST /api/TodoItems`

```json
{
  "todoItemId": 4,
  "name": "<script>alert('x')</script>",
  "priority": 1,
  "completed": false
}
```

**Response should be:**

```json
{
  "todoItemId": 4,
  "name": "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;",
  "priority": 1,
  "completed": false
}
```

---

## Notes

- The app uses an in-memory array for data. Restarting the server resets the list.
- Error logs are saved to `/logs/error.log` with timestamps.
- PUT and PATCH requests both validate and sanitize inputs before modifying the in-memory array.
- All 404 and 500 errors are logged with timestamps for easier debugging.
- HTML and SQL injection attempts are gracefully blocked and rejected.

---

## 🔮 Future Improvements

- Add persistent storage using a database (e.g., MongoDB or PostgreSQL)
- Implement user authentication and authorization
- Create a frontend interface using React or Vue

---

## 🙏 Thank You

Thank you for taking the time to view this project.  
This apprenticeship opportunity through **Creating Coding Careers** has been an incredible learning experience, and I’m excited to keep growing as a developer.

Feel free to reach out with any feedback or questions!

const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');

const app = express();
const port = process.env.PORT || 3000;

// Set up Handlebars as the view engine
app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Set up static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', require('./controllers/index'));

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
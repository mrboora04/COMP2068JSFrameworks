var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 'Coding Assignment Tracker': 'Express' });
});

module.exports = router;

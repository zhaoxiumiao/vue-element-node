var express = require('express');
const boom = require('boom')
var router = express.Router();
const {
  CODE_ERROR
} = require('../utils/constant')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('欢迎来到fool书城')
});



module.exports = router;

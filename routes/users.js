var express = require('express');
const Result = require('../models/Result')
var router = express.Router();

/* GET users listing. */
router.post('/login', function(req, res, next) {
  console.log(req.body);
  const {username, password} = req.body
  if(username === 'admin' && password === 'admin'){
    new Result('登录成功').success(res)
  }else{
    new Result('登录失败').fail(res)
  }
  // next()
});



module.exports = router;

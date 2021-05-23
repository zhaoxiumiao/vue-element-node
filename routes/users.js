var express = require('express');
var router = express.Router();
const {genPassword} = require('../utils/cryp')
const Result = require('../models/Result')
const {login, findUser} = require('../controller/user');
const {body, validationResult} = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')
const {JWT_EXPIRED, PRIVATE_KEY} = require('../utils/constant')


/* GET users listing. */
router.post('/login', 
[
  body('username').isString().withMessage('用户名必须为字符'),
  body('password').isString().withMessage('密码必须为字符')
],
function(req, res, next) {
  const err = validationResult(req)
  if(!err.isEmpty()){
    const [{msg}] = err.errors
    next(boom.badRequest(msg))
  }else{
    let {username, password} = req.body
    password = genPassword(password)
    login(username, password).then(user=>{
      if(!user || user.length === 0) {
        new Result('登录失败').fail(res)
      }else{
        const [_user] = user
        const token = jwt.sign( //生成jwt
          {username},
          PRIVATE_KEY, //密钥
          {expiresIn: JWT_EXPIRED}
        )
        new Result({token}, '登录成功').success(res)
      }
    })
  }
    
    // next()
});

router.get('/info', function(req, res, next){
  findUser('admin').then(user=>{
    console.log(user);
    if(user){
      user.roles = [user.role]
      new Result(user, '用户信息查询成功').success(res)
    }else{
      new Result('用户信息查询失败').fail(res)
    }
  })
  
})



module.exports = router;

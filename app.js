var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan')
const jwtAuth = require('./routes/jwt')
const Result = require('./models/Result')
const boom = require('boom')
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const bookRouter = require('./routes/book')

var app = express();
// app.use(jwtAuth) //jwt验证

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/api/user', usersRouter);
app.use('/api/book', bookRouter);
app.use('/api/', indexRouter);


/**
 * 集中处理404请求的中间件
 * 注意：该中间件必须放在正常处理流程之后
 * 否则，会拦截正常请求
 */
app.use((req, res, next) => {
  next(boom.notFound('接口不存在'))
})

app.use((err, req, res, next) => {
  console.log(err);
  if(err.name && err.name === 'UnauthorizedError') {
    const {status = 401, message } = err
    new Result(null, 'Token验证失败', {
      error: status,
      errMsg: message
    }).jwtError(res.status(status))
  }else{
    const msg = (err && err.message) || '系统错误'
    const statusCode = (err.output && err.output.statusCode) || 500;
    const errorMsg = (err.output && err.output.payload && err.output.payload.error) || err.message
    new Result(null, msg, {
      error: statusCode,
      errorMsg
    }).fail(res.status(statusCode))
  }
})





module.exports = app;

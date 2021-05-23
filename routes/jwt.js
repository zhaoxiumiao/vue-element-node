const jwt = require('express-jwt')
const {PRIVATE_KEY} = require('../utils/constant')

module.exports = jwt({
    secret: PRIVATE_KEY,
    algorithms: ['HS256'],
    credentialsRequired: true //是否进行验证
}).unless({ //白名单
    path: [
        '/api',
        '/api/user/login'
    ]
})
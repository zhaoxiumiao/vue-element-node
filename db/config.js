const { env } = require('../utils/env.js')

let config = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'book'
}

if(env==='prod'){
    config = {
        host: 'localhost',
        user: 'root',
        password: 'Zxm159753486.',
        database: 'book'
    }
}

module.exports = config
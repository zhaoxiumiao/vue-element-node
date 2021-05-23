const {querySql, queryOne} = require('../db/index')

async function login (username, password) {
    const sql = `select * from admin_user where username="${username}" and password="${password}"`
    const rows = await querySql(sql)
    return rows
}

function findUser(username){
    return queryOne(`select id, username, nickname, role, avatar from admin_user where username="${username}"`)
}

module.exports = {
    login,
    findUser
}
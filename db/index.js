const mysql = require('mysql')
const config = require('./config')

const con = mysql.createConnection(config)

con.connect()

function querySql(sql) {
    return new Promise((resolve,reject) => {
        con.query(sql,(err,result) => {
            if(err){
                reject(err)
                return
            }
            resolve(result)
        })
    })
}

function queryOne(sql) {
    return new Promise((resolve, reject) => {
        querySql(sql).then(results => {
            if(results && results.length > 0) {
                resolve(results[0])
            }else{
                resolve(null)
            }
        }).catch(err => {
            reject(err)
        })
    })
}


module.exports = {
    querySql,
    queryOne
}
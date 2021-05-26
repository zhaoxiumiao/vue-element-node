const mysql = require('mysql')
const config = require('./config')
const {isObject} = require('../utils/isObject')

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

function insert (model, tableName){
    return new Promise((resolve, reject) => {
        if(!isObject(model)){
            reject(new Error('插入数据库失败,插入数据非对象'))

        }else{
            const keys = []
            const values =[]
            Object.keys(model).forEach(key => {
                if(model.hasOwnProperty(key)){
                    keys.push(`\`${key}\``)
                    values.push(`'${model[key]}'`)
                }
            })
            if(keys.length > 0 && values.length > 0){
                let sql = `INSERT INTO \`${tableName}\` (`
                const keysString = keys.join(',')
                const valuesString = values.join(',')
                sql = `${sql}${keysString}) VALUES (${valuesString})`
                try{
                    querySql(sql).then(res => {
                        resolve(res)
                    })
                }catch (e){
                    reject(e)
                }
            }else{
                reject(new Error('插入数据库失败,对象中没有任何属性'))
            }
        }
    })
}

module.exports = {
    querySql,
    queryOne,
    insert
}
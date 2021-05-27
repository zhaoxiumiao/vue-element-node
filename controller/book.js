const Book = require('../models/Book')
const {insert, queryOne, querySql, update} = require('../db/index')
const _ = require('lodash')

function exists (book){
    const {title, author, publisher} = book
    const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
    return queryOne(sql)
}

async function removeBook(book){
    if(book){
        book.reset() //文件删除操作
        if(book.fileName){ //数据库删除操作
            const removeBookSql = `delete from book where fileName='${book.fileName}'`
            const removeContentsSql = `delete from contents where fileName='${book.fileName}'`
            await querySql(removeBookSql)
            await querySql(removeContentsSql)
        }
    }
}

async function insertContents(book){
    const contents = book.getContents()
    if(contents && contents.length > 0){
        for(let i = 0; i < contents.length; i++){
            const content = contents[i]
            const _content = _.pick(content, [ //使用lodash过滤数据
                'fileName',
                'id',
                'href',
                'order',
                'level',
                'label',
                'pid',
                'navId',
                'text'
            ])
            console.log('_content', _content);
            insert(_content, 'contents')
        }
    }
}

function insertBook(book) {
    return new Promise(async (resolve, reject) => {
        try{
            if(book instanceof Book){ //判断是不是Book的实例
                const result = await exists(book)
                console.log(result);
                if(result){
                    await removeBook(book)
                    reject(new Error('电子书已存在'))
                }else{
                    await insert(book.toDb(), 'book')
                    await insertContents(book)
                    resolve()
                }
            }else{
                reject(new Error('添加的图书对象不合法'))
            }
        }catch(e) {
            reject(e)
        }
    })
}

function getBook(fileName){
    return new Promise(async (resolve, reject) => {
        const bookSql = `select * from book where fileName='${fileName}'`
        const contentSql = `select * from contents where fileName='${fileName}' ORDER BY \`order\`+0`
        const book = await queryOne(bookSql)
        const contents = await querySql(contentSql)
        if(book){
            book.cover = Book.genCoverUrl(book)
            book.contentsTree = Book.genContentsTree(contents)
            resolve(book)
        }else{
            reject(new Error('电子书不存在'))
        }
        
    })
}

function updateBook(book){
    return new Promise(async (resolve, reject) => {
        try{
            if(book instanceof Book){
                const result = await getBook(book.fileName)
                if(result){
                    const model = book.toDb()
                    if(+result.updateType === 0){
                        reject(new Error('内置图书不能编辑'))
                    }else{
                        await update(model, 'book', `where fileName='${book.fileName}'`)
                        resolve()
                    }
                }
                console.log(result);
            }else{
                reject(new Error('添加的图书对象不合法'))
            }
        }catch(e){
            reject(e)
        }
    })
}

async function getCategory(){
    const sql = 'select * from category order by category asc'
    const result = await querySql(sql)
    const categoryList = []
    result.forEach(item=>{
        categoryList.push({
            label: item.categoryText,
            value: item.category,
            num: item.num
        })
    })
    return categoryList
}

module.exports = {
    insertBook,
    getBook,
    updateBook,
    getCategory
}
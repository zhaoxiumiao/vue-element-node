const Book = require('../models/Book')
const {insert, queryOne, querySql, update, and, andLike} = require('../db/index')
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

async function listBook(query){
    const {
        category,
        title,
        sort,
        author,
        page = 1,
        pageSize = 20
    } = query
    const offset = (page - 1) * pageSize
    let bookSql = `select * from book`
    let where = 'where'
    title && (where = andLike(where, 'title', title))
    author && (where = andLike(where, 'author', author))
    category && (where = and(where, 'category', category))
    if(where !== 'where'){
        bookSql = `${bookSql} ${where}`
    }
    if(sort){
        const symbol = sort[0]
        const column = sort.slice(1, sort.length)
        const order = symbol === '+' ? 'asc' : 'desc'
        bookSql = `${bookSql} order by \`${column}\` ${order}`
    }
    let countSql = `select count(*) as count from book`
    if(where !== 'where'){
        countSql = `${countSql} ${where}`
    }
    const count = await querySql(countSql)
    bookSql = `${bookSql} limit ${offset},${pageSize}`
    const list = await querySql(bookSql)
    list.forEach(book => book.cover = Book.genCoverUrl(book))
    return {list, count: count[0].count, page, pageSize}
}

function deleteBook(fileName) {
    return new Promise(async (resolve, reject) => {
        let book = await getBook(fileName)
        if(book){
            if(+book.updateType === 0){
                reject(new Error('内置电子书不能删除'))
            }else{
                const bookObj = new Book(null, book)
                const sql = `delete from book where fileName='${fileName}'`
                querySql(sql).then(() =>{
                    bookObj.reset()
                    resolve()
                })
            }
        }else{
            reject(new Error('电子书不存在'))
        }
    })
}

module.exports = {
    insertBook,
    getBook,
    updateBook,
    getCategory,
    listBook,
    deleteBook
}
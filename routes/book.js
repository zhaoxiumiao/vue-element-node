const express = require('express')
const multer = require('multer') //文件放在的位置
const Result = require('../models/Result')
const router = express.Router()
const {UPLOAD_PATH} = require('../utils/constant')
const Book = require('../models/Book')
const boom = require('boom')
const {decoded} = require('../utils/decoded')
const {insertBook, getBook, updateBook, getCategory} = require('../controller/book')

router.post('/upload',
multer({dest: `${UPLOAD_PATH}/book`}).single('file'),
(req, res, next) => {
    if(!req.file || req.file.length === 0){
        new Result('上传电子书失败').fail(res)
    }else{
        const book = new Book(req.file)
        book.parse().then(book =>{
            console.log('book',book);
            new Result(book, '上传成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err)) //返回500status
        })
    }
})

router.post('/create',function(req,res,next){
    const decode = decoded(req)
    if(decode && decode.username){
        req.body.username = decode.username
    }
    const book = new Book(null, req.body)
    insertBook(book).then(() => {
        new Result('添加电子书成功').success(res)
    }).catch(err=>{
        next(boom.badImplementation(err))
    })
})

router.post('/update', function(req, res, next){
    const decode = decoded(req)
    if(decode && decode.username){
        req.body.username = decode.username
    }
    const book = new Book(null, req.body)
    updateBook(book).then(() => {
        new Result('更新电子书成功').success(res)
    }).catch(err=>{
        next(boom.badImplementation(err))
    })
})

router.get('/get', function(req, res, next){
    const {fileName} = req.query
    if(!fileName){
        next(boom.badRequest(new Error('参数fileName不能为空')))

    }else{
        getBook(fileName).then(book => {
            new Result(book, '获取图书信息成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })
    }
})

router.get('/category',function(req, res, next){
    getCategory().then(category=>{
        new Result(category, '获取分类成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})

router.get('/list',function(req, res, next){
    listBook(req.query).then(category=>{
        new Result( '获取图书列表成功').success(res)
    }).catch(err => {
        next(boom.badImplementation(err))
    })
})



module.exports = router
const express = require('express')
const multer = require('multer') //文件放在的位置
const Result = require('../models/Result')
const router = express.Router()
const {UPLOAD_PATH} = require('../utils/constant')
const Book = require('../models/Book')
const boom = require('boom')

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
            next(boom.badImplementation(err))
        })
        
    }
})

module.exports = router
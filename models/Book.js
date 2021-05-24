const {
    MIME_TYPE_EPUB, 
    UPLOAD_URL,
    UPLOAD_PATH
} = require('../utils/constant')
const fs = require('fs')

class Book {
    constructor(file, data){
        if(file){
            this.createBookFromFile(file)
        }else{
            this.createBookFromData(data)
        }
    }
    createBookFromFile(file){
        console.log('createBookFromFile', UPLOAD_URL);
        const {
            destination,
            filename,
            mimetype = MIME_TYPE_EPUB,
            path,
            originalname
        } = file
        // 电子书的文件后缀名
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        //电子书的原有路径
        const oldBookPath = path
        // 电子书的新路径
        const bookPath = `${destination}/${filename}${suffix}`
        // 电子书的下载URL
        const url = `${UPLOAD_URL}/book/${filename}${suffix}`
        // 电子书解压后的文件夹路径
        const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
        // 电子书解压后的文件URL
        const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
        if(!fs.existsSync(unzipPath)){
            //创建文件夹
            fs.mkdirSync(unzipPath, {recursive: true})
        }
        if(fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)){
            //更改文件后缀添加上.epub
            fs.renameSync(oldBookPath, bookPath)
        }
        this.fileName = filename //文件名
        this.path = `/book/${filename}${suffix}` // epub文件相对路径
        this.filePath = this.path
        this.unzipPath = `/unzip/${filename}` // epub解压后相对路径
        this.url = url // epub文件下载链接
        this.title = '' // 电子书的标题或者书名
        this.author = '' //作者
        this.publisher = '' //出版社
        this.contents = [] //目录
        this.cover = '' //封面图片URL
        this.category = -1 // 分类ID
        this.categoryText = '' //分类名称
        this.language = '' // 语种
        this.unzipUrl = unzipUrl //解压后文件夹链接
        this.originalname = originalname // 文件原名
    }
    createBookFromData(data){

    }
}

module.exports = Book
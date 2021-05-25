const {
    MIME_TYPE_EPUB, 
    UPLOAD_URL,
    UPLOAD_PATH
} = require('../utils/constant')
const fs = require('fs')
const Epub = require('../utils/epub')
const xml2js = require('xml2js').parseString; //进行电子书的解析

class Book {
    constructor(file, data){
        if(file){
            this.createBookFromFile(file)
        }else{
            this.createBookFromData(data)
        }
    }
    createBookFromFile(file){
        console.log('createBookFromFile', file);
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
        this.coverPath = '' // 封面图片路径
        this.category = -1 // 分类ID
        this.categoryText = '' //分类名称
        this.language = '' // 语种
        this.unzipUrl = unzipUrl //解压后文件夹链接
        this.originalname = originalname // 文件原名
    }
    createBookFromData(data){

    }

    parse(){
        return new Promise((resolve, reject)=>{
            const bookPath = `${UPLOAD_PATH}${this.filePath}`
            if(!fs.existsSync(bookPath)){
                reject(new Error('电子书不存在'))
            }
            const epub = new Epub(bookPath) //进行解析
            epub.on('error', err=>{
                reject(err)
            })
            epub.on('end', err =>{
                if(err){
                    reject(err)
                }else{
                    const {
                        language,
                        creator,
                        creatorFileAs,
                        title,
                        cover,
                        publisher
                    } = epub.metadata
                    if(!title){
                        reject(new Error(图书标题为空))
                    }else{
                        this.title = title
                        this.language = language
                        this.author = creator || creatorFileAs || 'unknown'
                        this.publisher = publisher || 'unknown'
                        this.rootFile = epub.rootFile
                        const handleGetImage = (err, file, mimeType) => {
                            if(err){
                                reject(err)
                            }else{
                                const sffix = mimeType.split('/')[1] //封面后缀
                                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${sffix}`
                                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${sffix}`
                                fs.writeFileSync(coverPath, file, 'binary')
                                this.coverPath = `/img/${this.fileName}.${sffix}`
                                this.cover = coverUrl
                                resolve(this) //返回最终的数据
                            }
                            // console.log(err, file, mimeType);
                        }
                        try{
                            this.unzip() //同步的方法
                            this.parseContents(epub).then(({chapters}) => {
                                this.contents = chapters
                                epub.getImage(cover, handleGetImage)
                            })
                        }catch(e){
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
        })
        
    }
    unzip(){
        const AdmZip = require('adm-zip')
        const zip = AdmZip(Book.genPath(this.path))
        zip.extractAllTo(Book.genPath(this.unzipPath), true) //定义将文件解压的路径
    }

    parseContents(epub){
        function getNcxFilePath(){ //获取ncx目录文件
            const spine = epub && epub.spine
            const manifest = epub && epub.manifest
            const ncx = spine.toc && spine.toc.href
            const id = spine.toc && spine.toc.id
            
            // console.log('spine', spine.toc, ncx, id, manifest[id].href);
            if(ncx){
                return ncx
            }else{
                return manifest[id].href
            }
        }

        function findParent(array, level=0, pid=''){ //如果有多层目录进行迭代
            return array.map(item => {
                item.level = level
                item.pid = pid
                if(item.navPoint && item.navPoint.length > 0){ //如果是数组
                    item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
                }else if(item.navPoint){ //如果是对象
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }
                return item
            })
        }

        function flatten(array){
            return [].concat(...array.map(item => {
                if(item.navPoint && item.navPoint.length > 0){
                    return [].concat(item, ...flatten(item.navPoint))
                }else if(item.navPoint){
                    return [].concat(item, item.navPoint)
                }
                return item
            }))
        }

        const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)
        if(fs.existsSync(ncxFilePath)){
            return new Promise((resolve, reject) => {
                const xml = fs.readFileSync(ncxFilePath, 'utf-8')
                const fileName = this.fileName
                xml2js(xml, {
                    explicitArray: false, //这里是配置去掉外层数组包裹
                    ignoreAttrs: false
                },function(err,json){
                    if(err){
                        reject(err)
                    }else{
                        const navMap = json.ncx.navMap //解析出来的目录对象
                        // console.log(JSON.stringify(navMap));
                        if(navMap.navPoint && navMap.navPoint.length > 0){
                            
                            navMap.navPoint = findParent(navMap.navPoint)
                            const newNavMap = flatten(navMap.navPoint)
                            // console.log(epub.flow.length, newNavMap.length);
                            // console.log('newNavMap', newNavMap);
                            const chapters = []
                            //epub.flow
                            newNavMap.forEach((item, index) => { //对每个章节内容进行提取
                                const chapter = {}
                                if(index + 1 > newNavMap.length){
                                    return
                                }
                                const nav = newNavMap[index]
                                chapter.href = nav.content['$'].src
                                chapter.id = nav['$'].id
                                chapter['media-type']=epub.flow[0]['media-type']
                                chapter.text = `${UPLOAD_URL}/unzip/${fileName}/${chapter.href}`
                                if(nav && nav.navLabel){
                                    chapter.label = nav.navLabel.text || ''
                                }else{
                                    chapter.label = ''
                                }
                                chapter.level = nav.level
                                chapter.pid = nav.pid
                                chapter.navId = nav['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                // console.log(chapter);
                                chapters.push(chapter)
                            })
                            resolve({chapters})
                            // console.log(newNavMap === navMap.navPoint);
                        }else{
                            reject(new Error('目录解析失败, 目录数为0'))
                        }
                    }
                })
            })
        }else{
            throw new Error('目录文件不存在')
        }
        // console.log('ncxFilePath', ncxFilePath);
    }

    static genPath(path) { //静态方法 用来获取绝对路径
        if(!path.startsWith('/')){ //startsWith用来判断字符串头部
            path = `/${path}`
        }
        return `${UPLOAD_PATH}${path}`
    }
}



module.exports = Book
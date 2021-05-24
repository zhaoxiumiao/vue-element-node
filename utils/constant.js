const {env} = require('./env')

const UPLOAD_PATH = env === 'dev' ? 'D:/data/nginx/upload/admin-upload-ebook':''

const UPLOAD_URL = env === 'dev' ? 'http://localhost:8089/admin-upload-ebook': ''


module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    CODE_TOKEN_EXPIRED: -2,
    PRIVATE_KEY: 'admin_fool_ink',
    JWT_EXPIRED: 60 * 60 ,//token失效时间 (s)
    UPLOAD_PATH,
    UPLOAD_URL,
    MIME_TYPE_EPUB: 'application/epub+zip'
}
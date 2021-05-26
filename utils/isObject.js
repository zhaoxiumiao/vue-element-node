const isObject = (o) => {
    return Object.prototype.toString.call(o) === '[object Object]' //判断数据类型
}

module.exports = {
    isObject
}
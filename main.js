var fs = require('fs');
var util = require('util');

var autoGenerateFilenamesByType = function (types) {
    var filenamesByType = {};
    types.forEach(function (type) {
        filenamesByType[type] = type + '.log';
    });
    return filenamesByType;
};

var defaultDateFormatCallback = function () {
    return new Date().toISOString();
};

/**
 * @param {Array} types Типы логов
 * @param {Object} filenamesByType Типы логов
 * @param {String} path Путь у логам
 * @param {Object} inheritance Ассоциативный массив наследник => родитель
 */
var Log = function (params) {
    params = params || {};
    var path = params.path || '.';
    var types = params.types || ['info', 'error'];
    var filenamesByType = params.filenamesByType || autoGenerateFilenamesByType(types);
    var inheritance = params.inheritance || {};
    var inspectOptions = params.inspectOptions || {depth: 10};
    var dateFormatCallback = params.dateFormatCallback || defaultDateFormatCallback;

    if (!path) { // дописываем слеш к пути если его нет, и пытаемся создать такую папку
        path = '';
    } else {
        if (path[path.length - 1] !== '/') {
            path += '/';
        }
        try {
            fs.mkdirSync(path);
        } catch (e) {
            if (e.code !== 'EEXIST') {
                throw e;
            }
        }
    }

    var pathsByType = {};
    types.forEach(function (type) { // Заполняем ассоциативный массив pathsByType полными путями к файлам в соответствии с наследованием типов
        var paths = [];
        pathsByType[type] = paths;
        while (true) {
            if (type in filenamesByType) {
                paths.push(path + filenamesByType[type]);
            }
            if (!(type in inheritance)) {
                return;
            }
            type = inheritance[type];
        }

    });

    var log = this;
    types.forEach(function (type) { // Для каждого типа создаём в текущем объекте метод который логирует переданные аргументы во все файлы соответствующие данному типу
        var paths = pathsByType[type];

        if (paths.length === 0) {
            this[type] = function () {
            };
            return;
        }

        log[type] = function () {
            var args = Array.prototype.slice.call(arguments, 0);

            args.unshift(type);
            args.unshift(dateFormatCallback());

//            var str = JSON.stringify(args) + '\n';
            var str = util.inspect(args, inspectOptions).replace(/\n\s*/g, ' ') + '\n';
            paths.forEach(function (path) {
                fs.appendFile(path, str, function (err) {
                    if (err) {
                        console.log('Error writing to log file!', path, str);
                        process.exit(1);
                    }
                });
            });
        };
    });
};

module.exports = Log;
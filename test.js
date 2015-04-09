var assert = require('assert');
var fs = require('fs');
var Log = require('./main');

var simpleLog = new Log();

assert('info' in simpleLog);
assert('error' in simpleLog);
assert.equal(false, 'debug' in simpleLog);

try {
    fs.unlinkSync('error.log');
} catch (e) {

}
try {
    fs.unlinkSync('info.log');
} catch (e) {

}
try {
    fs.unlinkSync('customLogs/debug.log');
} catch (e) {

}
try {
    fs.unlinkSync('customLogs/error.log');
} catch (e) {

}
try {
    fs.unlinkSync('customLogs/custom_error.log');
} catch (e) {

}

var deep = [{a: {b: {c: {d: {e: {f: {g: {h: {i: {j: {h: {i: {j: {k: {l: {m: {n: {o: {p: [1.5]}}}}}}}}}}}}}}}}}}}, -2, [], {}];

simpleLog.error('Some error');
simpleLog.info(deep);

var customLog = new Log({
    types: [
        'debug',
        'info',
        'error',
        'customError',
    ],
    filenamesByType: {
        error: 'error.log',
        debug: 'debug.log',
        customError: 'custom_error.log',
    },
    inheritance: {
        info: 'debug', // info have no own file, inherites 'debug'
        error: 'debug',
        customError: 'error',
    },
    path: 'customLogs',
    inspectOptions: {depth: 2},
    dateFormatCallback: function () {
        return "custom date";
    }
});

assert('info' in customLog);
assert('error' in customLog);
assert('debug' in customLog);
assert('customError' in customLog);

customLog.info(deep);
customLog.error('Some error');
customLog.customError('Some custom error');

process.on('exit', function () {
    assert.equal("'error', 'Some error' ]\n", fs.readFileSync('error.log').toString().slice(30));
    assert.equal("'info', [ { a: { b: { c: { d: { e: { f: { g: { h: { i: [Object] } } } } } } } } }, -2, [], {} ] ]\n", fs.readFileSync('info.log').toString().slice(30));

    assert.equal("[ 'custom date', 'customError', 'Some custom error' ]\n", fs.readFileSync('customLogs/custom_error.log').toString());
    assert.equal("[ 'custom date', 'error', 'Some error' ]\n[ 'custom date', 'customError', 'Some custom error' ]\n", fs.readFileSync('customLogs/error.log').toString());
    assert.equal("[ 'custom date', 'info', [ { a: [Object] }, -2, [], {} ] ]\n\
[ 'custom date', 'error', 'Some error' ]\n\
[ 'custom date', 'customError', 'Some custom error' ]\n", fs.readFileSync('customLogs/debug.log').toString());

    console.log('OK');
});
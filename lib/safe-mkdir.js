var fs = require('fs');

module.exports.mkdir = mkdir
module.exports.mkdirSync = mkdirSync

function mkdir (path, callback) {
  if (callback) {
    fs.mkdir(path, function (err) {
      if (err && err.code != 'EEXIST') {
        callback(err);
      } else {
        callback();
      }
    })
  } else {
    process.nextTick(function () {
      mkdirSync(path, mode)
    })
  }
}

function mkdirSync (path, mode) {
  try {
    fs.mkdirSync(path, mode)
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
}
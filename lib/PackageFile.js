var Path = require('path');

/**
 * A package file
 * @constructor
 * @param   {Package}   package
 * @param   {string}    path
 * @param   {string}    source
 */
function PackageFile(package, path, source) {
  this.package  = package;
  this.type     =
  this.path     = path;
  this.source   = source;
  this.slug     = package.slug+'/'+path;
}

module.exports = PackageFile;
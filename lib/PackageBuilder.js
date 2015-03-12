var fs            = require('fs');
var Path          = require('path');
var mkdir         = require('./safe-mkdir').mkdir;
var Queue         = require('queue');
var Package       = require('./Package');
var PackageFile   = require('./PackageFile');
var debug         = require('debug')('PackageBuilder');
var deps          = require('file-deps');
var jsonfile      = require('jsonfile');
var emitter       = require('emitter-on-steroids');

var CONCURRENCY = 10;

/**
 * A package builder
 * @constructor
 */
function PackageBuilder(options) {
  options                 = options || {};
  this._registry          = options.registries[0] || [];
  this._installDirectory  = options.installDirectory || 'packages';
  this._buildDirectory    = options.buildDirectory || 'build';
}
emitter(PackageBuilder.prototype);

PackageBuilder.prototype.installPath = function(path) {

};

/**
 * Get a package manifest (from disk)
 * @param   {Package}                   package
 * @param   {function(Error, Object)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype.manifest = function(package, callback) {

  var file = this._installDirectory+'/'+package.path('component.json');

  jsonfile.readFile(file, function(error, manifest) {
    callback(error, manifest);
  });

  return this;
};

/**
 * Build the packages
 * @param   {Array.<string>}    packages
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype.build = function(packages, callback) {
  var self = this;

  //build the scripts
  this._files('scripts', packages, function(error, files) {
    if (err) return callback(error);

    self._scripts(files, function(error) {
      //done
    });

  });

  //build the styles
  //this._files('styles', packages, function(error, files) {
  //  if (err) return callback(error);
  //
  //  self._styles(files, function(error) {
  //    //done
  //  });
  //
  //});

};

/**
 * Collect a list of packages
 *  - note: does not lookup and install the dependencies of each package - expect you've done that already
 * @private
 * @param   {Array.<string>}    packages
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype._files = function(packages, callback) {
  var self = this;

  function pack_package(package) {
    return function(next) {
      self.manifest(package, function(error, manifest) {
        if (error) return next(error);

        var files = [].concat(
          manifest.scripts || [],
          manifest.styles || [],
          manifest.files || []
        );

        //create the async queue
        var queue = new Queue({concurrency: CONCURRENCY});

        files.forEach(function(path) {
          queue.push(function(next) {
            fs.readFile(self._installDirectory+'/'+package.path(path), function(error, source) {
              if (error) return next(error);

              var file = new PackageFile(package, path, source.toString());//todo: how to handle binary files?


              //run the plugins on the file
              next();

            });
          });
        });

        //run the async methods queue
        queue.start(function(error) {
          next(error);
        });

      });
    };

  }

  mkdir(this._buildDirectory, function(error) {
    if (error) return callback(error);

    //create the async queue
    var queue = new Queue({concurrency: CONCURRENCY});

    for (var i=0; i<packages.length; ++i) {

      //get the package
      var package = Package.fromSlug(packages[i]);

      //install the package
      queue.push(pack_package(package));

    }

    //run the async methods queue
    queue.start(function(error) {
      callback(error);
    });

  });

  return this;
};

/**
 * Build and package scripts
 * @private
 * @param   {Array}     files
 * @param   {function}  callback
 */
PackageBuilder.prototype._scripts = function(files, callback) {
  var requiresrc = 'function require(module) {}\n';
  var output = '(function() {\n'+requiresrc+output+'})();\n'; //TODO: indent output

  //rewrite the dependencies
  var source = deps(file.source, 'js', function(req) {
    return req+'_test'; //TODO: rewrite names
  });

  output += 'require.modules.push(\''+file.package.slug+'\', function() {\n'+source+'\n});\n\n';

  var fs = require('fs');
  fs.writeFile(builder.installPath()+'/build.js', output, function(error) {
    if (error) console.log(error);
  });
};

/**
 * Build and package styles
 * @private
 * @param   {Array}     files
 * @param   {function}  callback
 */
PackageBuilder.prototype._styles = function(files, callback) {

};

module.exports = PackageBuilder;
var fs        = require('fs');
var mkdir     = require('./safe-mkdir').mkdir;
var Queue     = require('queue');
var Package   = require('./Package');
var debug     = require('debug')('PackageBuilder');
var deps      = require('file-deps');

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

/**
 * Build a list of packages
 *  - note: does not lookup and install the dependencies of each package - expect you've done that already
 * @param   {Array.<string>}    packages
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype.build = function(packages, callback) {
  var self = this;
  var output = '';

  function pack_file(package, file) {
    return function(next) {
      fs.readFile(self._installDirectory+'/'+package.path+'/'+file, function(err, source) {
        if (err) return next(err);

        //rewrite
        source = deps(source.toString(), 'js', function(req) {
          console.log(req);
          return req+'_test';
        });

        output += 'modules.push(\''+package.slug+'\', function() {\n'+source+'\n});\n\n';

        next();


      });
    };
  }

  function pack_package(package) {
    return function(next) {
      self._registry.manifest(package, function(error, manifest) {
        if (error) return next(error);

        if (!manifest.scripts) {
          return next(new Error('Package '+package.slug+' does not contain scripts'));
        }

        //create the async queue
        var queue = new Queue({concurrency: CONCURRENCY});

        manifest.scripts.forEach(function(script) {
          queue.push(pack_file(package, script));
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
      callback(error, output);
    });

  });

  return this;
};

module.exports = PackageBuilder;
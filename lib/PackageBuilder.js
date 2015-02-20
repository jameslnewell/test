var fs = require('fs');
var untar = require('untar');
var Queue   = require('queue');
var Package = require('./Package');

var CONCURRENCY = 10;

/**
 * A package builder
 * @constructor
 */
function PackageBuilder(options) {
  options = options || {};
  this._registry          = options.registries[0] || [];
  this._installDirectory  = options.installDirectory || 'packages';
  this._buildDirectory    = options.buildDirectory || 'build';
}

/**
 * Install a a list of packages
 *  - note: does not lookup and install the dependencies of each package - expect you've done that already
 * @param   {Array.<string>}    packages
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype.install = function(packages, callback) {
  var self = this;

  function installAll() {

    //create the async queue
    var queue = new Queue({concurrency: CONCURRENCY});

    for (var i=0; i<packages.length; ++i) {

      //get the package
      var package = Package.fromString(packages[i]);

      queue.push((function(package) {
        return function(next) {

          //download the package
          self._registry.download(package, function(error, stream) {
            if (error) return next(error);

            //extract the stream
            var path = self._installDirectory+'/'+package.toString(); //turn name into something safe one level, turn version into something safe one level
            untar(path, stream).node(function(error, value) {
              console.log(value);
              next(error);
            });

          });

        };
      })(package));

    }

    queue.start(function(error) {
      callback(error);
    });

  }

  fs.exists(this._installDirectory, function(exists) {
    if (exists) {

      installAll();

    } else {

      fs.mkdir(this._installDirectory, function(error) {
        if (error) return callback(error);
        installAll();
      });

    }
  });

  return this;
};

PackageBuilder.prototype.build = function(dependencies) {
};


module.exports = PackageBuilder;
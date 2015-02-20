var fs      = require('fs');
var untar   = require('untar');
var Queue   = require('queue');
var Package = require('./Package');
var debug   = require('debug')('PackageBuilder');

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
 * Get the full path of a package path
 * @param   {Package} package
 * @returns {string}
 */
PackageBuilder.prototype.installPath = function(package) { //TODO: move the package object?
	var path =
		this._installDirectory+
		'/'+package.name+
		'/'+package.version
	;
	return path;
};


/**
 * Install a single package
 * @private
 * @param   {Package}           package
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype._install = function(package, callback) {
	var
		self = this,
		directory = self.installPath(package)
	;

	fs.exists(directory, function(exists) {

		//check if the package is already installed
		if (exists) {
			debug('Skipping installation of package %s. Package is already installed.', package.toString());
			return callback();
		} else {
			debug('Installing package %s.', package.toString());
		}

		//download the package
		self._registry.download(package, function(error, stream) {
			if (error) return callback(error);

			//extract the stream
			untar(directory, stream).node(function(error) {
				callback(error);
			});

		});

	});

};

/**
 * Install a a list of packages
 *  - note: does not lookup and install the dependencies of each package - expect you've done that already
 * @param   {Array.<string>}    packages
 * @param   {function(Error)}   callback
 * @returns {PackageBuilder}
 */
PackageBuilder.prototype.install = function(packages, callback) {
  var self = this;

	/**
	 * Install a single dependency
	 */
	function install_one(package) {
		return function(next) {
			self._install(package, next);
		};
	}

	/**
	 * Iterate each dependency
	 */
  function install_all() {

    //create the async queue
    var queue = new Queue({concurrency: CONCURRENCY});

    for (var i=0; i<packages.length; ++i) {

      //get the package
      var package = Package.fromString(packages[i]);

			//install the package
	    queue.push(install_one(package));

    }

	  //run the async methods queue
    queue.start(function(error) {
      callback(error);
    });

  }

  fs.exists(self._installDirectory, function(exists) {

	  //check whether the install directory exists
    if (exists) {

      install_all();

    } else {
      fs.mkdir(self._installDirectory, function(error) {
        if (error) return callback(error);
        install_all();
      });

    }

  });

  return this;
};

PackageBuilder.prototype.build = function(dependencies) {
};


module.exports = PackageBuilder;
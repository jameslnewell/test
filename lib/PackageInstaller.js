var fs        = require('fs');
var mkdir     = require('./safe-mkdir').mkdir;
var untar     = require('untar');
var Queue     = require('queue');
var Package   = require('./Package');
var debug     = require('debug')('PackageInstaller');

var CONCURRENCY = 10;

/**
 * A package installer
 * @constructor
 */
function PackageInstaller(options) {
  options                 = options || {};
  this._registry          = options.registries[0] || [];
  this._installDirectory  = options.installDirectory;
}

/**
 * Install a single package
 * @private
 * @param   {Package}           package
 * @param   {function(Error)}   callback
 * @returns {PackageInstaller}
 */
PackageInstaller.prototype._install = function(package, callback) {
	var
		self = this,
		directory = self._installDirectory+'/'+package.path();
	;

	fs.exists(directory, function(exists) {

		//check if the package is already installed
		if (exists) {
			debug('Skipping installation of package %s. Package is already installed.', package.slug);
			return callback();
		} else {
			debug('Installing package %s.', package.slug);
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
 * @returns {PackageInstaller}
 */
PackageInstaller.prototype.install = function(packages, callback) {
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
      var package = Package.fromSlug(packages[i]);

			//install the package
	    queue.push(install_one(package));

    }

	  //run the async methods queue
    queue.start(function(error) {
      callback(error);
    });

  }

	mkdir(this._installDirectory, function(error) {
		if (error) return callback(error);
		install_all();
	});

  return this;
};

module.exports = PackageInstaller;
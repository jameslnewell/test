var Queue   = require('queue');
var Package = require('./Package');

var CONCURRENCY = 10;

//TODO: handle circular dependencies?

function assertInstanceOfPackage(package) {
  if (!(package instanceof Package)) {
    throw new Error('The `package` parameter must be an instance of `Package`.')
  }
}

/**
 * A package manager
 * @constructor
 * @param   {Registry} registry
 */
function PackageManager(registry) {
  this._registry = registry;

  this._cachedResolves  = {};
  this._cachedManifests = {};
}

/**
 * Resolve a package version
 * @param   {Package}                   package
 * @param   {function(Error, Object)}   callback
 * @returns {PackageManager}
 */
PackageManager.prototype.resolve = function(package, callback) {
  assertInstanceOfPackage(package);
  var self = this;

  //retrieve cached resolved package
  var key = package.slug;
  if (this._cachedResolves[key]) {
    return callback(undefined, this._cachedResolves[key]);
  }

  //todo: find the supported registry from an array of registries
  var registry = this._registry;

  //resolve the ref to a version
  registry.resolve(package, function(error, package) {
    if (!error) self._cachedResolves[key] = package; //cache the resolved package
    callback(error, package);
  });

  return this;
};

/**
 * Get a package manifest
 * @param   {Package}                   package
 * @param   {function(Error, Object)}   callback
 * @returns {PackageManager}
 */
PackageManager.prototype.manifest = function(package, callback) {
  assertInstanceOfPackage(package);
  var self = this;

  //retrieve cached package manifest
  var key = package.slug;
  if (this._cachedManifests[key]) {
    return callback(undefined, this._cachedManifests[key]);
  }

  //todo: find the supported registry from an array of registries
  var registry = this._registry;

  //get the manifest
  registry.manifest(package, function(error, manifest) {
    if (!error) self._cachedManifests[key] = manifest; //cache the package manifest
    callback(error, manifest);
  });

  return this;
};

/**
 * Get the dependencies for a package
 * @param   {Package}                 package
 * @param   {function(Error, Array}   callback
 * @returns {PackageManager}
 */
PackageManager.prototype.dependencies = function(package, callback) {
  assertInstanceOfPackage(package);

  var self = this, dependencies = {};

  //get the manifest
  this.manifest(package, function(error, manifest) {
    if (error) return callback(error);

    if (manifest.dependencies) {

      //create the async queue
      var queue = new Queue({concurrency: CONCURRENCY});

      var names = Object.keys(manifest.dependencies);
      for (var i=0; i<names.length; ++i) {

        //get the package
        var depPackage = new Package(names[i], manifest.dependencies[names[i]]);

        //schedule the async queue
        queue.push((function(dependencyPackage) {
          return function(next) {

            //resolve the package dependencies
            self.resolve(dependencyPackage, function(error, dependencyPackage) {
              if (error) return next(error);

              //add the dependency's dependencies
              self.dependencies(dependencyPackage, function(error, dependencyDependencies) {
                if (error) return next(error);
                dependencies[dependencyPackage.slug] = dependencyDependencies;
                next();
              });

            });

          };
        })(depPackage));

      }

      queue.start(function(error) {
        callback(error, dependencies);
      });

    } else {
      callback(undefined, dependencies);
    }

  });

  return this;
};

module.exports = PackageManager;
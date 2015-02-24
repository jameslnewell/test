var Path = require('path');

/**
 * A package
 * @constructor
 * @param   {string} name       The package name    - can be anything handled by a registry e.g. express or nib-components/accordion
 * @param   {string} [version]  The package version - can be anything handled by a registry e.g. a semver range (~1.0.0), exact version (1.0.0), a commit (ABCDE) or a branch (master)
 */
function Package(name, version) {
  this.name     = name;
  this.version  = version || '*';
  this.slug     = this.name+'@'+this.version;
}

Package.fromSlug = function(string) {
  var parts = string.split('@');
  return new Package(parts[0], parts[1]);
};

/**
 * Get the path to a package file (relative to the install/build directories)
 * @param   {string} [file]
 * @returns {string}
 */
Package.prototype.path = function(file) {
  var path = Path.join(this.name, this.version);
  if (file) path = Path.join(path, file);
  return path;
};

Package.prototype.toString = function() {
  return this.slug;
};

module.exports = Package;
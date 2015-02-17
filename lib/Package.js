
/**
 * A package
 * @constructor
 * @param   {string} name     The package name    - can be anything handled by a registry e.g. express or nib-components/accordion
 * @param   {string} version  The package version - can be anything handled by a registry e.g. a semver range (~1.0.0), exact version (1.0.0), a commit (ABCDE) or a branch (master)
 */
function Package(name, version) {
  this.name     = name;
  this.version  = version;
  this.toString = function() {
    return this.name+'@'+this.version;
  };
}

module.exports = Package;
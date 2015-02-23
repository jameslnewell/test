var Package = require('./Package');

function flatten(tree) {
  var list = [];

  //flatten
  var keys = Object.keys(tree);
  for (var i=0; i<keys.length; ++i) {
    var key = keys[i];
    if (list.indexOf(key) === -1) list.push(key);
    list = list.concat(flatten(tree[key]));
  }

  //throw on duplicate libraries of different versions?

  return list;
};

function unique(list) {
  return list.filter(function(item, i) {
    return list.indexOf(item) === i;
  });
}

/**
 * Check for conflicting dependencies
 * @param   {Array} dependencies A flat array of dependencies
 */
function clashes(dependencies) {
  var used = {};

  for (var i=0; i<dependencies.length; ++i) {

    //get the dependency data from the package string
    var dependency = Package.fromSlug(dependencies[i]);

    //check the package isn't already used
    if (Object.keys(used).indexOf(dependency.name) !== -1) {
      throw new Error('Cannot depend on two versions of the same package: '+used[dependency.name]+' and '+dependency.slug);
    }

    //remember the package
    used[dependency.name] = dependency.slug;
  }

  return dependencies;
}

module.exports = {
  flatten:  flatten,
  unique:   unique,
  clashes:  clashes
};
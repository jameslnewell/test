var Package         = require('../lib/Package');
var PackageManager  = require('../lib/PackageManager');
var Github          = require('../lib/Github');

var package = new Package('nib-components/accordion', 'master');
var manager = new PackageManager(new Github('nib-build-agent', 'P@ssw0rd21'));

manager.resolve(package, function(error, package) {
  if (error) return console.log(error);

  manager.dependencies(package, function(error, dependencies) {
    if (error) return console.log(error);

    //filter out duplicate dependencies
    //dependencies = dependencies.reduce(function(p, c) {
    //  if (p.indexOf(c) < 0) p.push(c);
    //  return p;
    //}, []);

    console.log('dependencies', error, dependencies);
  });
});

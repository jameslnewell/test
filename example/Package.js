var Package = require('../lib/Package');

var package = new Package('digitaledgeit/js-view', '*');

console.log(package.path());
console.log(package.path('/component.json'));
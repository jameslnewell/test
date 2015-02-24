var PackageBuilder  = require('../lib/PackageBuilder');
var Github          = require('../lib/Github');

var dependencies = [
  'nib-components/utils@0.0.1',
  'component/emitter@1.1.3',
  'component/emitter@1.1.1',
  'digitaledgeit/js-transition-auto@0.1.10',
  'anthonyshort/after-transition@0.0.4',
  'anthonyshort/has-transitions@0.3.0',
  'anthonyshort/css-emitter@0.1.1'
];

var builder = new PackageBuilder({
  registries:       [new Github('nib-build-agent', 'P@ssw0rd21')],
  installDirectory: './tmp/install',
  buildDirectory:   './tmp/build'
});

builder.build(dependencies, function(error, output) {
  console.log('Built: ', error);

  var fs = require('fs');
  fs.writeFile(builder._buildDirectory+'/build.js', output, function(error) {
    if (error) console.log(error);
  });

});

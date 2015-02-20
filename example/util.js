var util = require('../lib/util');

var dependencies = {
  'nib-components/utils@0.0.1': {},
  'component/emitter@1.1.3': {},
  'component/emitter@1.1.1': {},
  'digitaledgeit/js-transition-auto@0.1.10':{
    'anthonyshort/after-transition@0.0.4': {
      'anthonyshort/has-transitions@0.3.0': {},
      'anthonyshort/css-emitter@0.1.1': {
        'component/emitter@1.1.3': {}
      }
    }
  }
};

dependencies = util.flatten(dependencies);
dependencies = util.unique(dependencies);
dependencies = util.clashes(dependencies);

console.log(dependencies);

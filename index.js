'use strict';

module.exports = {
  name: 'ember-nf-graph',

  included(app) {
    this._super.included.apply(this, arguments);

    this.import('node_modules/d3/d3.js');
    this.import('node_modules/rx/dist/rx.all.js');
  }
};

import { computed } from '@ember/object';
import { on } from '@ember/object/evented';
import Component from '@ember/component';

import AreaUtils from 'ember-nf-graph/mixins/graph-area-utils';
import LineUtils from 'ember-nf-graph/mixins/graph-line-utils';
import layout from 'ember-nf-graph/templates/components/nf-area';
import DataGraphic from 'ember-nf-graph/mixins/graph-data-graphic';
import Selectable from 'ember-nf-graph/mixins/graph-selectable-graphic';
import RegisteredGraphic from 'ember-nf-graph/mixins/graph-registered-graphic';
import RequireScaleSource from 'ember-nf-graph/mixins/graph-requires-scale-source';
import GraphicWithTrackingDot from 'ember-nf-graph/mixins/graph-graphic-with-tracking-dot';

/**
  Adds an area graph to an `nf-graph` component.

  Optionally, if it's located within an `nf-area-stack` component, it will work with
  sibling `nf-area` components to create a stacked graph.
  @namespace components
  @class nf-area
  @extends Ember.Component
  @uses mixins.graph-area-utils
  @uses mixins.graph-selectable-graphic
  @uses mixins.graph-registered-graphic
  @uses mixins.graph-data-graphic
  @uses mixins.graph-graphic-with-tracking-dot
  @uses mixins.graph-requires-scale-source
*/
export default Component.extend(
  RegisteredGraphic,
  DataGraphic,
  Selectable,
  AreaUtils,
  GraphicWithTrackingDot,
  RequireScaleSource,
  LineUtils,
  {
    layout,
    tagName: 'g',

    classNameBindings: [':nf-area', 'selected', 'selectable'],

    /**
    The parent graph for a component.
    @property graph
    @type components.nf-graph
    @default null
    */
    graph: null,

    /**
    The type of d3 interpolator to use to create the area
    @property interpolator
    @type String
    @default 'linear'
  */
    interpolator: 'linear',

    /**
    The previous area in the stack, if this area is part of an `nf-area-stack`
    @property prevArea
    @type components.nf-area
    @default null
  */
    prevArea: null,

    /**
    The next area in the stack, if this area is part of an `nf-area-stack`
    @property nextArea
    @type components.nf-area
    @default null
  */
    nextArea: null,

    stack: null,

    init() {
      this._super(...arguments);
      let stack = this.get('stack');
      if (stack) {
        stack.registerArea(this);
        this.set('stack', stack);
      }
    },

    /**
    Override from `graph-data-graphic` mixin
    @method getActualTrackData
  */
    getActualTrackData(renderX, renderY, data) {
      return {
        x: this.get('xPropFn')(data),
        y: this.get('yPropFn')(data)
      };
    },

    _unregisterArea: on('willDestroyElement', function() {
      let stack = this.get('stack');
      if (stack) {
        stack.unregisterArea(this);
      }
    }),

    /**
    The computed set of next y values to use for the "bottom" of the graphed area.
    If the area is part of a stack, this will be the "top" of the next area in the stack,
    otherwise it will return an array of values at the "bottom" of the graph domain.
    @property nextYData
    @type Array
    @readonly
  */
    nextYData: computed('data.length', 'nextArea.data.[]', function() {
      let data = this.get('data');
      if (!Array.isArray(data)) {
        return [];
      }
      let nextData = this.get('nextArea.mappedData');
      return data.map(
        (d, i) =>
          (nextData && nextData[i] && nextData[i][1]) || Number.MIN_VALUE
      );
    }),

    /**
    The current rendered data "zipped" together with the nextYData.
    @property mappedData
    @type Array
    @readonly
  */
    mappedData: computed(
      'data.[]',
      'xPropFn',
      'yPropFn',
      'nextYData.[]',
      'stack.aggregate',
      function() {
        let { data, xPropFn, yPropFn, nextYData } = this.getProperties(
          'data',
          'xPropFn',
          'yPropFn',
          'nextYData'
        );
        let aggregate = this.get('stack.aggregate');
        if (Array.isArray(data)) {
          return data.map((d, i) => {
            let x = xPropFn(d);
            let y = yPropFn(d);
            let result = aggregate
              ? [x, y + nextYData[i], nextYData[i]]
              : [x, y, nextYData[i]];
            result.data = d;
            return result;
          });
        } else {
          return [];
        }
      }
    ),

    areaFn: computed('xScale', 'yScale', 'interpolator', function() {
      let { xScale, yScale, interpolator } = this.getProperties(
        'xScale',
        'yScale',
        'interpolator'
      );
      return this.createAreaFn(xScale, yScale, interpolator);
    }),

    lineFn: computed('xScale', 'yScale', 'interpolator', function() {
      let { xScale, yScale, interpolator } = this.getProperties(
        'xScale',
        'yScale',
        'interpolator'
      );
      return this.createLineFn(xScale, yScale, interpolator);
    }),

    d: computed('renderedData', 'areaFn', function() {
      let renderedData = this.get('renderedData');
      return this.get('areaFn')(renderedData);
    }),

    dLine: computed('renderedData', 'lineFn', function() {
      let renderedData = this.get('renderedData');
      return this.get('lineFn')(renderedData);
    }),

    click: function() {
      if (this.get('selectable')) {
        this.toggleProperty('selected');
      }
    }
  }
);

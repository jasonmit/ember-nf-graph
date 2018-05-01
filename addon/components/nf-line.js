import { computed } from '@ember/object';
import Component from '@ember/component';
import { on } from '@ember/object/evented';
import LineUtils from 'ember-nf-graph/mixins/graph-line-utils';
import layout from 'ember-nf-graph/templates/components/nf-line';
import DataGraphic from 'ember-nf-graph/mixins/graph-data-graphic';
import SelectableGraphic from 'ember-nf-graph/mixins/graph-selectable-graphic';
import RegisteredGraphic from 'ember-nf-graph/mixins/graph-registered-graphic';
import GraphicWithTrackingDot from 'ember-nf-graph/mixins/graph-graphic-with-tracking-dot';
import RequireScaleSource from 'ember-nf-graph/mixins/graph-requires-scale-source';

/**
  A line graphic for `nf-graph`. Displays a line for the data it's passed.
  @namespace components
  @class nf-line
  @extends Ember.Component
  @uses mixins.graph-line-utils
  @uses mixins.graph-selectable-graphic
  @uses mixins.graph-registered-graphic
  @uses mixins.graph-data-graphic
  @uses mixins.graph-graphic-with-tracking-dot
  @uses mixins.graph-requires-scale-source
*/
export default Component.extend(
  DataGraphic,
  SelectableGraphic,
  LineUtils,
  RegisteredGraphic,
  GraphicWithTrackingDot,
  RequireScaleSource,
  {
    layout,
    tagName: 'g',

    /**
    The parent graph for a component.
    @property graph
    @type components.nf-graph
    @default null
    */
    graph: null,

    /**
    The type of D3 interpolator to use to create the line.
    @property interpolator
    @type String
    @default 'linear'
  */
    interpolator: 'linear',

    classNameBindings: ['selected', 'selectable'],

    classNames: ['nf-line'],

    /**
    The d3 line function to create the line path.
    @method lineFn
    @param data {Array} the array of coordinate arrays to plot as an SVG path
    @private
    @return {String} an SVG path data string
  */
    lineFn: computed('xScale', 'yScale', 'interpolator', function() {
      let xScale = this.get('xScale');
      let yScale = this.get('yScale');
      let interpolator = this.get('interpolator');
      return this.createLineFn(xScale, yScale, interpolator);
    }),

    /**
    The SVG path data string to render the line
    @property d
    @type String
    @private
    @readonly
  */
    d: computed('renderedData.[]', 'lineFn', function() {
      let renderedData = this.get('renderedData');
      let lineFn = this.get('lineFn');
      return lineFn(renderedData);
    }),

    /**
    Event handler to toggle the `selected` property on click
    @method _toggleSelected
    @private
  */
    _toggleSelected: on('click', function() {
      if (this.get('selectable')) {
        this.toggleProperty('selected');
      }
    })
  }
);

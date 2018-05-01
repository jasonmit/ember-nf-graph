import { on } from '@ember/object/evented';
import { computed } from '@ember/object';
import Component from '@ember/component';
import layout from 'ember-nf-graph/templates/components/nf-range-marker';
import RequireScaleSource from 'ember-nf-graph/mixins/graph-requires-scale-source';

/**
  Draws a rectangular strip with a templated label on an `nf-graph`.
  Should always be used in conjunction with an `nf-range-markers` container component.
  @namespace components
  @class nf-range-marker
  @extends Ember.Component
  @uses mixins.graph-requires-scale-source
*/
export default Component.extend(RequireScaleSource, {
  layout,
  tagName: 'g',

  attributeBindings: ['transform'],

  classNames: ['nf-range-marker'],

  /**
    The parent graph for a component.
    @property graph
    @type components.nf-graph
    @default null
    */
  graph: null,

  /**
    The parent `nf-range-markers` component.
    @property container
    @type {components.nf-range-markers}
    @default null
  */
  container: null,

  /**
    The minimum domain value for the range to mark.
    @property xMin
    @default 0
  */
  xMin: 0,

  /**
    The maximum domain value for the range to mark.
    @property xMax
    @default 0
  */
  xMax: 0,

  /**
    The spacing above the range marker.
    @property marginTop
    @type Number
    @default 10
  */
  marginTop: 10,

  /**
    The spacing below the range marker.
    @property marginBottom
    @type Number
    @default 3
  */
  marginBottom: 3,

  /**
    The height of the range marker.
    @property height
    @type Number
    @default 10
  */
  height: 10,

  /**
    The computed x position of the range marker.
    @property x
    @type Number
    @readonly
  */
  x: computed('xMin', 'xScale', function() {
    let xScale = this.get('xScale');
    let xMin = this.get('xMin');
    return xScale(xMin);
  }),

  /**
    The computed width of the range marker.
    @property width
    @type Number
    @readonly
  */
  width: computed('xScale', 'xMin', 'xMax', function() {
    let xScale = this.get('xScale');
    let xMax = this.get('xMax');
    let xMin = this.get('xMin');
    return xScale(xMax) - xScale(xMin);
  }),

  /**
    The computed y position of the range marker.
    @property y
    @type Number
    @readonly
  */
  y: computed(
    'container.orient',
    'prevMarker.{bottom,y}',
    'graph.graphHeight',
    'totalHeight',
    function() {
      let orient = this.get('container.orient');
      let prevBottom = this.get('prevMarker.bottom');
      let prevY = this.get('prevMarker.y');
      let graphHeight = this.get('graph.graphHeight');
      let totalHeight = this.get('totalHeight');

      prevBottom = prevBottom || 0;

      if (orient === 'bottom') {
        return (prevY || graphHeight) - totalHeight;
      }

      if (orient === 'top') {
        return prevBottom;
      }
    }
  ),

  /**
    The computed total height of the range marker including its margins.
    @property totalHeight
    @type Number
    @readonly
  */
  totalHeight: computed('height', 'marginTop', 'marginBottom', function() {
    let height = this.get('height');
    let marginTop = this.get('marginTop');
    let marginBottom = this.get('marginBottom');
    return height + marginTop + marginBottom;
  }),

  /**
    The computed bottom of the range marker, not including the bottom margin.
    @property bottom
    @type Number
    @readonly
  */
  bottom: computed('y', 'totalHeight', function() {
    let y = this.get('y');
    let totalHeight = this.get('totalHeight');
    return y + totalHeight;
  }),

  /**
    The computed SVG transform of the range marker container
    @property transform
    @type String
    @readonly
  */
  transform: computed('y', function() {
    let y = this.get('y') || 0;
    return `translate(0 ${y})`;
  }),

  /**
    The computed SVG transform fo the range marker label container.
    @property labelTransform
    @type String
    @readonly
  */
  labelTransform: computed('x', function() {
    let x = this.get('x') || 0;
    return `translate(${x} 0)`;
  }),

  /**
    Initialization function that registers the range marker with its parent
    and populates the container property
    @method _setup
    @private
  */
  init() {
    this._super(...arguments);
    let container = this.get('container');
    container.registerMarker(this);
  },

  /**
    Unregisters the range marker from its parent when the range marker is destroyed.
    @method _unregister
    @private
  */
  _unregisterMarker: on('willDestroyElement', function() {
    this.get('container').unregisterMarker(this);
  })
});

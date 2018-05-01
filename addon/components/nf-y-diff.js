import { once } from '@ember/runloop';
import Component from '@ember/component';
import { on } from '@ember/object/evented';
import { computed, observer } from '@ember/object';
import { alias, gte, equal } from '@ember/object/computed';

import layout from 'ember-nf-graph/templates/components/nf-y-diff';
import { normalizeScale } from 'ember-nf-graph/utils/nf/scale-utils';
import RequireScaleSource from 'ember-nf-graph/mixins/graph-requires-scale-source';

/**
  Draws a box underneath (or over) the y axis to between the given `a` and `b`
  domain values. Component content is used to template a label in that box.

  ## Tips

  - Should be outside of `nf-graph-content`.
  - Should be "above" `nf-y-axis` in the markup.
  - As a convenience, `<text>` elements will automatically be positioned based on y-axis orientation
    due to default styling.

  @namespace components
  @class nf-y-diff
  @extends Ember.Component
  @uses mixins.graph-has-graph-parent
  @uses mixins.graph-requires-scale-source
*/
export default Component.extend(RequireScaleSource, {
  layout,
  tagName: 'g',

  attributeBindings: ['transform'],

  classNameBindings: [
    ':nf-y-diff',
    'isPositive:positive:negative',
    'isOrientRight:orient-right:orient-left'
  ],

  /**
    The parent graph for a component.
    @property graph
    @type components.nf-graph
    @default null
    */
  graph: null,

  /**
    The starting domain value of the difference measurement. The subrahend of the difference calculation.
    @property a
    @type Number
    @default null
  */
  a: null,

  /**
    The ending domain value of the difference measurement. The minuend of the difference calculation.
    @property b
    @type Number
    @default null
  */
  b: null,

  /**
    The amount of padding, in pixels, between the edge of the difference "box" and the content container
    @property contentPadding
    @type Number
    @default 5
  */
  contentPadding: 5,

  /**
    The duration of the transition, in milliseconds, as the difference slides vertically
    @property duration
    @type Number
    @default 400
  */
  duration: 400,

  /**
    The calculated vertical center of the difference box, in pixels.
    @property yCenter
    @type Number
    @readonly
  */
  yCenter: computed('yA', 'yB', function() {
    let yA = +this.get('yA') || 0;
    let yB = +this.get('yB') || 0;
    return (yA + yB) / 2;
  }),

  /**
    The y pixel value of b.
    @property yB
    @type Number
  */
  yB: computed('yScale', 'b', function() {
    return normalizeScale(this.get('yScale'), this.get('b'));
  }),

  /**
    The y pixel value of a.
    @property yA
    @type Number
  */
  yA: computed('yScale', 'a', function() {
    return normalizeScale(this.get('yScale'), this.get('a'));
  }),

  /**
    The SVG transformation of the component.
    @property transform
    @type String
    @private
    @readonly
  */
  transform: alias('graph.yAxis.transform'),

  /**
    The calculated difference between `a` and `b`.
    @property diff
    @type Number
    @readonly
  */
  diff: computed('a', 'b', function() {
    return +this.get('b') - this.get('a');
  }),

  /**
    Returns `true` if `diff` is a positive number
    @property isPositive
    @type Boolean
    @readonly
  */
  isPositive: gte('diff', 0),

  /**
    Returns `true` if the graph's y-axis component is configured to orient right.
    @property isOrientRight
    @type Boolean
    @readonly
  */
  isOrientRight: equal('graph.yAxis.orient', 'right'),

  /**
    The width of the difference box
    @property width
    @type Number
    @readonly
  */
  width: alias('graph.yAxis.width'),

  /**
    The x pixel coordinate of the content container.
    @property contentX
    @type Number
    @readonly
  */
  contentX: computed('isOrientRight', 'width', 'contentPadding', function() {
    let contentPadding = this.get('contentPadding');
    let width = this.get('width');
    return this.get('isOrientRight') ? width - contentPadding : contentPadding;
  }),

  rectPath: computed('yA', 'yB', 'width', function() {
    let x = 0;
    let w = +this.get('width') || 0;
    let x2 = x + w;
    let yA = +this.get('yA') || 0;
    let yB = +this.get('yB') || 0;
    return `M${x},${yA} L${x},${yB} L${x2},${yB} L${x2},${yA} L${x},${yA}`;
  }),

  /**
    The SVG transformation used to position the content container.
    @property contentTransform
    @type String
    @private
    @readonly
  */
  contentTransform: computed('contentX', 'yCenter', function() {
    let contentX = this.get('contentX');
    let yCenter = this.get('yCenter');
    return `translate(${contentX} ${yCenter})`;
  }),

  /**
    Sets up the d3 related elements when component is inserted
    into the DOM
    @method didInsertElement
  */
  didInsertElement: function() {
    let element = this.get('element');
    let g = d3.select(element);

    let rectPath = this.get('rectPath');
    let rect = g
      .insert('path', ':first-child')
      .attr('class', 'nf-y-diff-rect')
      .attr('d', rectPath);

    let contentTransform = this.get('contentTransform');
    let content = g.select('.nf-y-diff-content');
    content.attr('transform', contentTransform);

    this.set('rectElement', rect);
    this.set('contentElement', content);
  },

  /**
    Performs the transition (animation) of the elements.
    @method doTransition
  */
  doTransition: function() {
    let duration = this.get('duration');
    let rectElement = this.get('rectElement');
    let contentElement = this.get('contentElement');

    if (rectElement) {
      rectElement
        .transition()
        .duration(duration)
        .attr('d', this.get('rectPath'));
    }

    if (contentElement) {
      contentElement
        .transition()
        .duration(duration)
        .attr('transform', this.get('contentTransform'));
    }
  },

  /**
    Schedules a transition once at afterRender.
    @method transition
  */
  transition: observer('a', 'b', function() {
    once(this, this.doTransition);
  }),

  /**
    Updates to d3 managed DOM elments that do
    not require transitioning, because they're width-related.
    @method doAdjustWidth
  */
  doAdjustWidth: function() {
    let contentElement = this.get('contentElement');
    if (contentElement) {
      let contentTransform = this.get('contentTransform');
      contentElement.attr('transform', contentTransform);
    }
  },

  adjustGraphHeight: on(
    'didInsertElement',
    observer('graph.graphHeight', function() {
      let rectElement = this.get('rectElement');
      let contentElement = this.get('contentElement');

      if (rectElement) {
        rectElement.attr('d', this.get('rectPath'));
      }

      if (contentElement) {
        contentElement.attr('transform', this.get('contentTransform'));
      }
    })
  ),

  /**
    Schedules a call to `doAdjustWidth` on afterRender
    @method adjustWidth
  */
  adjustWidth: on(
    'didInsertElement',
    observer('isOrientRight', 'width', 'contentPadding', function() {
      once(this, this.doAdjustWidth);
    })
  )
});

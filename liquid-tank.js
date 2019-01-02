/**
 * @preserve
 * JS Implementation of LiquidTank (as of May 10, 2013)
 *
 * @author <a href="mailto:geert-jansen@hotmail.com">Jens Taylor</a>
 * @see http://github.com/homebrewing/brauhaus-diff
 */
(function() {
  var _height;
  var _originalValue;
  var _value;
  var _width;

  // @param {string | DOMElement} target
  // @param {object} optional configuration options
  // @return {object} A LiquidTank instance object
  function LiquidTank(element, options) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.options = options || {};

    if (this.options.min === undefined) this.options.min = 0;
    if (this.options.max === undefined) this.options.max = 1;

    _height = this.element.clientHeight;
    _width = this.element.clientWidth;

    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);
    this.render();

    var self = this;
    window.addEventListener("resize", function() {
      _height = self.element.clientHeight;
      _width = self.element.clientWidth;
      self.render();
      self.setValue(_originalValue);
    });

    return this;
  }

  LiquidTank.prototype.config = function() {
    return this;
  };

  LiquidTank.prototype.render = function() {
    var ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.height = _height;
    this.canvas.width = _width;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.34)';
    if (this.options.segments) {
      var gradient = ctx.createLinearGradient(10, _height - 20, 10, 10);
      for (i = 0; i < this.options.segments.length; i++) {
        var segment = this.options.segments[i];
        gradient.addColorStop(
          segment.startValue / (this.options.max - this.options.min),
          segment.color
        );
        gradient.addColorStop(
          segment.endValue / (this.options.max - this.options.min),
          segment.color
        );
      }
      ctx.fillStyle = gradient;
    }
    roundRect(
      this.canvas,
      0,
      0,
      _width,
      _height,
      { lowerLeft: 24, lowerRight: 24 },
      false,
      true
    );
    return this;
  };

  LiquidTank.prototype.setValue = function(value) {
    _originalValue = value;
    _value = (value / (this.options.max - this.options.min)) * (_height - 20);
    x = 10;
    y = 10 + (_height - 20 - _value);
    w = _width - 20;
    h = _height - 20 - (_height - 20 - _value);
    roundRect(this.canvas, x, y, w, h, { lowerLeft: 16, lowerRight: 16 }, true, false);
  };

  /**
   * Draws a rounded rectangle using the current state of the canvas.
   * If you omit the last three params, it will draw a rectangle
   * outline with a 5 pixel border radius
   * @param {Number} x The top left x coordinate
   * @param {Number} y The top left y coordinate
   * @param {Number} width The width of the rectangle
   * @param {Number} height The height of the rectangle
   * @param {Object} radius All corner radii. Defaults to 0,0,0,0;
   * @param {Boolean} fill Whether to fill the rectangle. Defaults to false.
   * @param {Boolean} stroke Whether to stroke the rectangle. Defaults to true.
   */
  function roundRect(canvas, x, y, width, height, radius, fill, stroke) {
    var cornerRadius = { upperLeft: 0, upperRight: 0, lowerLeft: 0, lowerRight: 0 };
    var ctx = canvas.getContext('2d');
    if (typeof stroke === 'undefined') stroke = true;
    if (typeof radius === 'object') {
      for (var side in radius) {
        cornerRadius[side] = radius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.upperLeft, y);
    ctx.lineTo(x + width - cornerRadius.upperRight, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius.upperRight);
    ctx.lineTo(x + width, y + height - cornerRadius.lowerRight);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - cornerRadius.lowerRight,
      y + height
    );
    ctx.lineTo(x + cornerRadius.lowerLeft, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius.lowerLeft);
    ctx.lineTo(x, y + cornerRadius.upperLeft);
    ctx.quadraticCurveTo(x, y, x + cornerRadius.upperLeft, y);
    ctx.closePath();
    if (stroke) {
      ctx.stroke();
    }
    if (fill) {
      ctx.fill();
    }
  }

  if (typeof module !== 'undefined') {
    module.exports = LiquidTank;
  } else {
    this.LiquidTank = LiquidTank;
  }
})();

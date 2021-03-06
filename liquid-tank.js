(function() {
  function LiquidTank(element, options) {
    this._destroyed = false;
    this.element =
      typeof element === "string" ? document.querySelector(element) : element;
    this.options = options || {};
    if (typeof this.options.fillStyle === "undefined")
      this.options.fillStyle = "solid";
    if (typeof this.options.dark === "undefined") this.options.dark = false;
    if (typeof this.options.min === "undefined") this.options.min = 0;
    if (typeof this.options.max === "undefined") this.options.max = 1;
    if (typeof this.options.fontSize === "undefined")
      this.options.fontSize = 20;
    this.options._lineHeight = this.options.fontSize + 20;
    if (typeof this.options.fontFamily === "undefined")
      this.options.fontFamily = "Helvetica";
    if (typeof this.options.valueFormatter === "undefined")
      this.options.valueFormatter = function(value) {
        return String(value);
      };
    this.canvas = document.createElement("canvas");
    this.element.appendChild(this.canvas);
    this.render();
    if (window.hasOwnProperty("ResizeObserver")) {
      this.onResize = this.onResize.bind(this);
      this._resizeObserver = new ResizeObserver(this.onResize);
      this._resizeObserver.observe(this.element);
    } else {
      this.onResize = _debounce(this.onResize.bind(this), 66);
      window.addEventListener("resize", this.onResize);
    }
    return this;
  }

  LiquidTank.prototype.clear = function() {
    this.destroy();
  };

  LiquidTank.prototype.config = function(options) {
    if (options) {
      if (typeof options.min !== "undefined") this.options.min = options.min;
      if (typeof options.max !== "undefined") this.options.max = options.max;
    }
    return this;
  };

  LiquidTank.prototype.destroy = function() {
    if (!this._destroyed) {
      this._destroyed = true;
      this.canvas
        .getContext("2d")
        .clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (window.hasOwnProperty("ResizeObserver")) {
        if (this._resizeObserver) {
          this._resizeObserver.unobserve(this.element);
          this._resizeObserver.disconnect();
          this._resizeObserver = null;
        }
      } else {
        window.removeEventListener("resize", this.onResize);
      }
      this.element.removeChild(this.canvas);
      this.canvas = null;
    }
  };

  LiquidTank.prototype.render = function() {
    this.canvas.height = _getActualHeight(this.element);
    this.canvas.width = _getActualWidth(this.element);
    _clearTank(this.canvas);
    _drawTank(this._getLatestValue(), this.canvas, this.options);
    return this;
  };

  LiquidTank.prototype.setValue = function(value) {
    var currentValue = this._getLatestValue();
    var initial = typeof this._originalValue === "undefined";
    this._originalValue = value;
    _animateFromToValue(
      currentValue,
      value,
      this.canvas,
      this.options,
      initial
    );
  };

  LiquidTank.prototype.onResize = function() {
    this.render();
    if (this._originalValue) {
      this.setValue(this._originalValue);
    }
  };

  LiquidTank.prototype._getLatestValue = function() {
    return typeof this._originalValue !== "undefined"
      ? this._originalValue
      : this.options.min;
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
  function _drawRoundedRect(canvas, x, y, width, height, radius, fill, stroke) {
    var cornerRadius = {
      upperLeft: 0,
      upperRight: 0,
      lowerLeft: 0,
      lowerRight: 0
    };
    var ctx = canvas.getContext("2d");
    var radiusScaleFactor = 1.75;
    if (typeof stroke === "undefined") stroke = true;
    if (typeof radius === "object") {
      for (var side in radius) {
        cornerRadius[side] =
          radius[side] > height ? Math.round(height) : radius[side];
        if (cornerRadius[side] < 0) cornerRadius[side] = 0;
      }
    }
    if (radius.lowerLeft > height) {
      x = x + Math.round((radius.lowerLeft - height) / radiusScaleFactor);
      width =
        width - Math.round((radius.lowerLeft - height) / radiusScaleFactor) * 2;
    }
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius.lowerLeft, y + height);
    ctx.arcTo(x + 0, y + height, x + 0, y + 0, cornerRadius.lowerLeft);
    ctx.arcTo(x + 0, y + 0, x + width, y + 0, cornerRadius.upperLeft);
    ctx.arcTo(x + width, y + 0, x + width, y + height, cornerRadius.upperRight);
    ctx.arcTo(x + width, y + height, 0, y + height, cornerRadius.lowerRight);
    ctx.closePath();
    if (stroke) {
      ctx.stroke();
    }
    if (fill) {
      ctx.fill();
    }
  }

  function _animateFromToValue(fromValue, toValue, canvas, options, initial) {
    var now = new Date().getTime();
    var requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame;
    function draw() {
      var time = new Date().getTime() - now;
      if (time > 300) time = 300;
      var val = _easeInOutQuart(time, fromValue, toValue - fromValue, 300);
      _clearTank(canvas);
      _drawTank(initial ? toValue : val, canvas, options);
      _drawTankFill(val, canvas, options);
      _drawTextValue(toValue, canvas, options);
      if (val !== toValue) {
        requestAnimationFrame(draw);
      }
    }
    draw();
  }

  function _clearTank(canvas) {
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  function _debounce(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this,
        args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      }, wait);
      if (immediate && !timeout) func.apply(context, args);
    };
  }

  function _drawTank(value, canvas, options) {
    var ctx = canvas.getContext("2d");
    var lineHeight = options._lineHeight;
    ctx.strokeStyle = _getBorderColor(options);
    if (options.fillStyle === "solid")
      ctx.fillStyle = _getSolidFillStyle(value, options);
    if (options.fillStyle === "segmented")
      ctx.fillStyle = _getSegmentedFillStyle(canvas, options);
    _drawRoundedRect(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height - lineHeight - 8,
      { lowerLeft: 24, lowerRight: 24 },
      false,
      true
    );
  }

  function _drawTankFill(value, canvas, options) {
    var params = _getDrawParams(value, canvas, options);
    _drawRoundedRect(
      canvas,
      params.x,
      params.y,
      params.w,
      params.h,
      { lowerLeft: 16, lowerRight: 16 },
      true,
      false
    );
  }

  function _drawTextValue(value, canvas, options) {
    var ctx = canvas.getContext("2d");
    var font = "normal 400 " + options.fontSize + "px " + options.fontFamily;
    var textValue = options.valueFormatter(value);
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.fillStyle = _getTextColor(options);
    ctx.fillText(textValue, canvas.width * 0.5, canvas.height - 16);
  }

  /**
   * @param {Number} t Current time
   * @param {Number} b Beginning value
   * @param {Number} c Change in value
   * @param {Number} d Duration
   */
  function _easeInOutQuart(t, b, c, d) {
    if ((t /= d / 2) < 1) return (c / 2) * t * t * t * t + b;
    return (-c / 2) * ((t -= 2) * t * t * t - 2) + b;
  }

  function _getActualHeight(element) {
    var style = window.getComputedStyle(element, null);
    var height = parseInt(style.getPropertyValue("height"));
    var minHeight = 80; // 8 + 16 + 8 + 40 + 8
    return height < minHeight ? minHeight : height;
  }

  function _getActualWidth(element) {
    var style = window.getComputedStyle(element, null);
    return parseInt(style.getPropertyValue("width"));
  }

  function _getBaseFillColor(options) {
    return options.dark ? "rgb(255,255,255)" : "rgba(0,0,0,0.67)";
  }

  function _getBorderColor(options) {
    return options.dark ? "rgb(255,255,255)" : "rgba(0,0,0,0.34)";
  }

  function _getDrawParams(value, canvas, options) {
    var canvasHeight = canvas.height;
    var canvasWidth = canvas.width;
    var height = canvasHeight - options._lineHeight - 8;
    var width = canvasWidth;
    var min = options.min;
    var max = options.max;
    var _value = _getValue(min, max, value) * (height - 20);
    var x = 10;
    var y = 10 + (height - 20 - _value);
    var w = width - 20;
    var h = height - 20 - (height - 20 - _value);
    return {
      x: x,
      y: y,
      w: w,
      h: h,
      value: _value
    };
  }

  function _getSolidFillStyle(value, options) {
    var color = _getBaseFillColor(options);
    var segments = options.segments;
    if (segments && segments.length) {
      color = segments
        .sort(function(s1, s2) {
          return s1.startValue > s2.startValue;
        })
        .reduce(function(color, segment) {
          if (value >= segment.startValue && value <= segment.endValue) {
            return segment.color;
          }
          return color;
        }, color);
    }
    return color;
  }

  function _getSegmentedFillStyle(canvas, options) {
    var ctx = canvas.getContext("2d");
    var height = canvas.height - options._lineHeight - 8;
    var gradient = ctx.createLinearGradient(10, height - 10, 10, 10);
    var min = options.min;
    var max = options.max;
    var range = max - min;
    var segments = options.segments;
    var _segments = [];
    if (segments && segments.length) {
      for (i = 0; i < segments.length; i++) {
        var prevEndValue = i === 0 ? min : segments[i - 1].endValue;
        var nextStartValue =
          i === segments.length - 1 ? max : segments[i + 1].startValue;
        var segment = segments[i];
        if (segment.startValue > prevEndValue) {
          _segments.push({
            color: _getBaseFillColor(options),
            startValue: prevEndValue,
            endValue: segment.startValue
          });
        }
        _segments.push(segment);
        if (segment.endValue < nextStartValue) {
          _segments.push({
            color: _getBaseFillColor(options),
            startValue: segment.endValue,
            endValue: nextStartValue
          });
        }
      }
    } else {
      _segments.push({
        color: _getBaseFillColor(options),
        startValue: min,
        endValue: max
      });
    }
    for (i = 0; i < _segments.length; i++) {
      var segment = _segments[i];
      var start = segment.startValue - min;
      var end = segment.endValue - min;
      gradient.addColorStop(start / range, segment.color);
      gradient.addColorStop(end / range, segment.color);
    }
    return gradient;
  }

  function _getTextColor(options) {
    return options.dark ? "rgb(255,255,255)" : "rgba(0,0,0,0.87)";
  }

  function _getValue(min, max, value) {
    if (value <= min) return 0;
    if (value >= max) return 1;
    return (value - min) / (max - min);
  }

  if (typeof module !== "undefined") {
    module.exports = LiquidTank;
  } else {
    this.LiquidTank = LiquidTank;
  }
})();

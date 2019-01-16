(function() {
  function LiquidTank(element, options) {
    this.element =
      typeof element === "string" ? document.querySelector(element) : element;
    this.options = options || {};
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
    this.onResize = this.onResize.bind(this);
    window.addEventListener("resize", this.onResize);
    return this;
  }

  LiquidTank.prototype.clear = function() {
    this.canvas
      .getContext("2d")
      .clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.element.removeChild(this.canvas);
    window.removeEventListener("resize", this.onResize);
  };

  LiquidTank.prototype.config = function(options) {
    if (options) {
      if (typeof options.min !== "undefined") this.options.min = options.min;
      if (typeof options.max !== "undefined") this.options.max = options.max;
    }
    return this;
  };

  LiquidTank.prototype.render = function() {
    this.canvas.height = _getActualHeight(this.element);
    this.canvas.width = _getActualWidth(this.element);
    _clearTank(this.canvas);
    _drawTank(this.canvas, this.options);
    return this;
  };

  LiquidTank.prototype.setValue = function(value) {
    var currentValue =
      typeof this._originalValue !== "undefined"
        ? this._originalValue
        : this.options.min;
    this._originalValue = value;
    _animateFromToValue(currentValue, value, this.canvas, this.options);
  };

  LiquidTank.prototype.onResize = function() {
    this.render();
    this.setValue(this._originalValue);
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
    if (typeof stroke === "undefined") stroke = true;
    if (typeof radius === "object") {
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

  function _animateFromToValue(fromValue, toValue, canvas, options) {
    var val = fromValue;
    var speed = 2;
    var requestAnimationFrame =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame;
    function draw() {
      if (val < toValue && toValue - val >= speed) {
        val += speed;
      } else if (val > toValue && val - toValue >= speed) {
        val -= speed;
      } else {
        val = toValue;
      }
      _clearTank(canvas);
      _drawTank(canvas, options);
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

  function _drawTank(canvas, options) {
    var ctx = canvas.getContext("2d");
    var lineHeight = options._lineHeight;
    ctx.strokeStyle = _getBorderColor(options);
    if (options.segments) {
      ctx.fillStyle = _getGradientFillStyle(canvas, options);
    }
    _drawRoundedRect(
      canvas,
      0,
      0,
      canvas.width,
      canvas.height - lineHeight,
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
    ctx.fillText(textValue, canvas.width * 0.5, canvas.height - 8);
  }

  function _getActualHeight(element) {
    var style = window.getComputedStyle(element, null);
    return parseInt(style.getPropertyValue("height"));
  }

  function _getActualWidth(element) {
    var style = window.getComputedStyle(element, null);
    return parseInt(style.getPropertyValue("width"));
  }

  function _getBorderColor(options) {
    return options.dark ? "rgb(255,255,255)" : "rgba(0,0,0,0.34)";
  }

  function _getDrawParams(value, canvas, options) {
    var canvasHeight = canvas.height;
    var canvasWidth = canvas.width;
    var height = canvasHeight - options._lineHeight;
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

  function _getGradientFillStyle(canvas, options) {
    var ctx = canvas.getContext("2d");
    var height = canvas.height - options._lineHeight;
    var gradient = ctx.createLinearGradient(10, height - 10, 10, 10);
    var min = options.min;
    var max = options.max;
    var range = max - min;
    for (i = 0; i < options.segments.length; i++) {
      var segment = options.segments[i];
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
    return (value - min) / (max - min);
  }

  if (typeof module !== "undefined") {
    module.exports = LiquidTank;
  } else {
    this.LiquidTank = LiquidTank;
  }
})();

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
    var clientHeight = _getActualHeight(this.element)
    var clientWidth = _getActualWidth(this.element);
    var min = this.options.min;
    var max = this.options.max;
    var range = max - min;
    var lineHeight = this.options._lineHeight;
    var ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.height = clientHeight;
    this.canvas.width = clientWidth;
    ctx.strokeStyle = _getBorderColor(this.options);
    if (this.options.segments) {
      var gradient = ctx.createLinearGradient(
        10,
        clientHeight - lineHeight - 10,
        10,
        10
      );
      for (i = 0; i < this.options.segments.length; i++) {
        var segment = this.options.segments[i];
        var start = segment.startValue - min;
        var end = segment.endValue - min;
        gradient.addColorStop(start / range, segment.color);
        gradient.addColorStop(end / range, segment.color);
      }
      ctx.fillStyle = gradient;
    }
    _drawRoundedRect(
      this.canvas,
      0,
      0,
      clientWidth,
      clientHeight - lineHeight,
      { lowerLeft: 24, lowerRight: 24 },
      false,
      true
    );
    return this;
  };

  LiquidTank.prototype.setValue = function(value) {
    var clientHeight = _getActualHeight(this.element);
    var clientWidth = _getActualWidth(this.element);
    var height = clientHeight - this.options._lineHeight;
    var min = this.options.min;
    var max = this.options.max;
    this._originalValue = value;
    this._value = _getValue(min, max, value) * (height - 20);
    var x = 10;
    var y = 10 + (height - 20 - this._value);
    var w = clientWidth - 20;
    var h = height - 20 - (height - 20 - this._value);
    _drawRoundedRect(
      this.canvas,
      x,
      y,
      w,
      h,
      { lowerLeft: 16, lowerRight: 16 },
      true,
      false
    );
    _drawTextValue(value, this.canvas, this.options);
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

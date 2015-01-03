function materialTouch(rippleIdentifier, custom_options){

  this.options_default = {
    classes: {
      rippleContainer: 'md-ripple-wrapper',
      ripple: 'md-ripple-effect'
    },
    transition: {
      easing: 'easeOutExpo',
      delay: 0,
      duration: 600
    },
    opacity: 0.5,
    size: 1
  };

  this.options = {};

  this.data = {};

  this._construct = function(rippleIdentifier, custom_options){
    var 
      self = this,
      options_default = self.options_default,
      options = (custom_options ? self._merge(options_default, custom_options) : options_default),
      items = document.body.querySelectorAll(rippleIdentifier);

    for (var i=0; i < items.length; i++) {
      var item = items[i];

      if (item.getAttribute('disabled') === null) {
        item.addEventListener('mousedown', function(e){
          self._click(this, e);
        });
      }
    }
    
    window.addEventListener('mouseup', function(){
      [].forEach.call(items, function(item){
        self._clickRelease(item);
      });
    });

    self.options = options;
  };

  /**
   * Mouse click function
   */
  this._click = function(item, e){
    var
      self = this,
      options = self.options,
      clickX = e.offsetX,
      clickY = e.offsetY,
      rippleWrapper = item.querySelector('.'+options.classes.rippleContainer),
      ripple,
      size = (item.offsetWidth > item.offsetHeight ? item.offsetWidth : item.offsetHeight)*options.size;

      if (!rippleWrapper){
        rippleWrapper = document.createElement('div');
        rippleWrapper.setAttribute('class', options.classes.rippleContainer);
        item.appendChild(rippleWrapper);
      }

      ripple = document.createElement('div');
      ripple.setAttribute('class', options.classes.ripple);

      ripple.style.opacity = options.opacity;

      ripple.style.top = clickY+'px';
      ripple.style.left = clickX+'px';
      ripple.style.width = 0;
      ripple.style.height = 0;

      rippleWrapper.appendChild(ripple);

      self.animate(ripple, {
        top: (clickY-(size/2))+'px', 
        left: (clickX-(size/2))+'px',
        width: size+'px', 
        height: size+'px'
      });
  };

  /**
   * Mouse click release function
   */
  this._clickRelease = function(item){
    var
      self = this,
      options = self.options,
      rippleWrapper = item.querySelector('.'+self.options.classes.rippleContainer),
      ripples;

    if (rippleWrapper && rippleWrapper.children)
    {
      ripples = rippleWrapper.children;
      [].forEach.call(ripples, function (ripple){

        // Animate
        self.animate(ripple, {opacity: 0});

        // Remove ripple when animation should be done
        setTimeout(function(){ 
          if (ripple.parentElement) ripple.parentElement.removeChild(ripple); 
        }, options.transition.duration);
      });
    }
  };

  /**
   * Animate object from current prop value to the one specified in properties
   */
  this.animate = function(obj, properties, duration, easing){
    var 
      self = this,
      options = self.options,
      data = self.data,
      properties_object = {},
      tweenFunction,
      timeStart = new Date().getTime();

    if (!duration && duration !== 0) duration = options.transition.duration;
    if (!easing) easing = options.transition.easing;

    tweenFunction = self._tween(easing);

    // Put current values into an object
    for (var prop in properties) {
      properties_object[prop] = obj.style[prop];
    }

    // Set transition to true
    self.data.transition = true;

    var animate = setInterval(function(){
      var timePassed = new Date().getTime() - timeStart;

      if (timePassed >= duration) timePassed = duration;

      // Run property update per property
      for (var prop in properties) {
        if (properties.hasOwnProperty(prop)) {
          var 
            defaultValue = properties_object[prop],
            propValue = properties[prop],
            newValue = null,
            convertInt = false,
            defaultSuffix = null,
            negative = 0;

          if (typeof defaultValue == 'string') defaultSuffix = defaultValue.replace(/^\-?[0-9\.]+(.*)$/, '$1');
          defaultValue = parseFloat(defaultValue);
          propValue = parseFloat(propValue);

          // Make the smallest value into 0 and remove the difference from both values, save it in "negative"
          if (propValue < 0 || defaultValue < 0) {
              negative = (propValue < defaultValue ? propValue : defaultValue);

              defaultValue = defaultValue-negative;
              propValue = propValue-negative;
          } else {
              negative = (propValue < defaultValue ? propValue : defaultValue);

              defaultValue = defaultValue-negative;
              propValue = propValue-negative;
          }

          if (defaultValue > propValue) {
            newValue = defaultValue-tweenFunction(timePassed, propValue, defaultValue, duration);

            if (newValue < propValue) newValue = propValue;
          } else if (defaultValue != propValue) {
            newValue = tweenFunction(timePassed, defaultValue, propValue, duration);

            if (newValue > propValue) newValue = propValue;
          } else {
            newValue = propValue;
          }

          // Remember "negative"? Add it back
          if (negative !== 0) newValue = newValue+negative;

          newValue = newValue+'';
          newValue = newValue.replace(/([0-9]+(\.[0-9]{0,3})?).*/, "$1");
          newValue = parseFloat(newValue);

          if (defaultSuffix) {
            newValue = newValue+defaultSuffix;
          }

          obj.style[prop] = newValue;
        }
      }

      if (timePassed >= duration) {
        clearInterval(animate);

        // Make sure all properties are set to the correct final value
        for (var prop in properties) {
          if(properties.hasOwnProperty(prop)) {
            var propValue = properties[prop],
                propSuffix = null;

            if (typeof propValue == 'string') propSuffix = propValue.replace(/^\-?[0-9\.]+(.*)$/, '$1');

            propValue = parseFloat(propValue);

            obj.style[prop] = (propSuffix ? propValue+propSuffix : propValue);

            // Set transition to false
            self.data.transition = false;
          }
        }
      }
    },24);
  };

  /**
   * Merge multiple objects into one
   */
  this._merge = function(){
    var 
      self = this,
      arraynew = {};

    for (var ai in arguments) {
      var array = arguments[ai];
      for (var index in array) {
        var value = null;
        if (array.hasOwnProperty(index)) {
          if (typeof array[index] == 'object' && arraynew[index] && typeof arraynew[index] == 'object') value = self._merge(arraynew[index], array[index]);
          else value = array[index];

          arraynew[index] = value;
        }
      }
    }

    return arraynew;
  }

  this._tween = function(type){
    var tweens = {
      /* Credit to Robert Penner @ http://gizma.com/easing */
      // simple linear tweening - no easing, no acceleration
      linear: function (t, b, c, d) {
        return c*t/d + b;
      },
      // quadratic easing in - accelerating from zero velocity
      easeInQuad: function (t, b, c, d) {
        t /= d;
        return c*t*t + b;
      },
      // quadratic easing out - decelerating to zero velocity
      easeOutQuad: function (t, b, c, d) {
        t /= d;
        return -c * t*(t-2) + b;
      },
      // quadratic easing in/out - acceleration until halfway, then deceleration
      easeInOutQuad: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t + b;
        t--;
        return -c/2 * (t*(t-2) - 1) + b;
      },
      // cubic easing in - accelerating from zero velocity
      easeInCubic: function (t, b, c, d) {
        t /= d;
        return c*t*t*t + b;
      },
      // cubic easing out - decelerating to zero velocity
      easeOutCubic: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t + 1) + b;
      },
      // cubic easing in/out - acceleration until halfway, then deceleration
      easeInOutCubic: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t + 2) + b;
      },
      // quartic easing in - accelerating from zero velocity
      easeInQuart: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t + b;
      },
      // quartic easing out - decelerating to zero velocity
      easeOutQuart: function (t, b, c, d) {
        t /= d;
        t--;
        return -c * (t*t*t*t - 1) + b;
      },
      // quartic easing in/out - acceleration until halfway, then deceleration
      easeInOutQuart: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t*t + b;
        t -= 2;
        return -c/2 * (t*t*t*t - 2) + b;
      },
      // quintic easing in - accelerating from zero velocity
      easeInQuint: function (t, b, c, d) {
        t /= d;
        return c*t*t*t*t*t + b;
      },
      // quintic easing out - decelerating to zero velocity
      easeOutQuint: function (t, b, c, d) {
        t /= d;
        t--;
        return c*(t*t*t*t*t + 1) + b;
      },
      // quintic easing in/out - acceleration until halfway, then deceleration
      easeInOutQuint: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2*t*t*t*t*t + b;
        t -= 2;
        return c/2*(t*t*t*t*t + 2) + b;
      },
      // sinusoidal easing in - accelerating from zero velocity
      easeInSine: function (t, b, c, d) {
        return -c * Math.cos(t/d * (PI/2)) + c + b;
      },
      // sinusoidal easing out - decelerating to zero velocity
      easeOutSine: function (t, b, c, d) {
        return c * Math.sin(t/d * (PI/2)) + b;
      },
      // sinusoidal easing in/out - accelerating until halfway, then decelerating
      easeInOutSine: function (t, b, c, d) {
        return -c/2 * (Math.cos(PI*t/d) - 1) + b;
      },
      // exponential easing in - accelerating from zero velocity
      easeInExpo: function (t, b, c, d) {
        return c * Math.pow( 2, 10 * (t/d - 1) ) + b;
      },
      // exponential easing out - decelerating to zero velocity
      easeOutExpo: function (t, b, c, d) {
        return c * ( -Math.pow( 2, -10 * t/d ) + 1 ) + b;
      },
      // exponential easing in/out - accelerating until halfway, then decelerating
      easeInOutExpo: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return c/2 * Math.pow( 2, 10 * (t - 1) ) + b;
        t--;
        return c/2 * ( -Math.pow( 2, -10 * t) + 2 ) + b;
      },
      // circular easing in - accelerating from zero velocity
      easeInCirc: function (t, b, c, d) {
        t /= d;
        return -c * (Math.sqrt(1 - t*t) - 1) + b;
      },
      // circular easing out - decelerating to zero velocity
      easeOutCirc: function (t, b, c, d) {
        t /= d;
        t--;
        return c * Math.sqrt(1 - t*t) + b;
      },
      // circular easing in/out - acceleration until halfway, then deceleration
      easeInOutCirc: function (t, b, c, d) {
        t /= d/2;
        if (t < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        t -= 2;
        return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
      }
    };

    return tweens[type];
  };

  this._construct(rippleIdentifier, custom_options);
}
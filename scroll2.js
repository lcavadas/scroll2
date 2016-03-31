/* globals jQuery:true */
/*!
 * jQuery Plugin for scrollbars
 * usage of the scrollTo function requires easing - https://github.com/lcavadas/easing
 *
 * @author Luis Serralheiro (https://github.com/lcavadas/scroll2)
 */
(function ($) {
  $.fn.scroll2 = function (options) {
    var _$this = $(this);
    var _$wrapper;
    var _$parent;
    var _$content;
    var _$verticalRail;
    var _$verticalBar;
    var _$horizontalRail;
    var _$horizontalBar;
    var _lastActive = {};
    var pageX = {};
    var pageY = {};
    var _isDragging = {};
    var _observer;

    var _scrollLeft = 0;
    var _scrollTop = 0;
    var _maxYScroll;
    var _maxXScroll;
    var _scrollXRate;
    var _scrollYRate;
    
    var _deltaModeRate = {};

    var settings = $.extend(true, {
      size: 7,
      railColor: '#aaa',
      barColor: '#000',
      timeout: 1000,
      container: {
        width: '',
        height: ''
      },
      appendTo: undefined,
      vertical: {
        active: true,
        margin: 2,
        top: 0,
        bottom: 0,
        trigger: {
          callback: undefined,
          offset: 0
        }
      },
      horizontal: {
        active: true,
        margin: 2,
        left: 0,
        right: 0,
        trigger: {
          callback: undefined,
          offset: 0
        }
      }
    }, options);

    var _throttledUpdate = function () {
      _lastActive.throttle = new Date().getTime();
      window.setTimeout(function () {
        if (new Date().getTime() - _lastActive.throttle >= 500) {
          _update();
        }
      }, 500);
    };

    var _update = function () {
      if (typeof settings.container.width === 'function') {
        _$wrapper.width(settings.container.width());
      } else if (settings.container.width) {
        _$wrapper.width(settings.container.width);
      }
      if (typeof settings.container.height === 'function') {
        _$wrapper.height(settings.container.height());
      } else if (settings.container.height) {
        _$wrapper.height(settings.container.height);
      }

      _maxYScroll = _$content[0].scrollHeight - _$wrapper.height();
      _maxXScroll = _$content[0].scrollWidth - _$wrapper.width();
      var heightRatio = _$wrapper.height() / _$this.height();
      var widthRatio = _$wrapper.width() / _$this.width();

      _$verticalBar.height(Math.floor(100 * heightRatio) + '%');
      _$horizontalBar.width(Math.floor(100 * widthRatio) + '%');

      window.setTimeout(function () { //Safari will report the interim size until the css animation finishes.
        _$verticalBar.height(Math.max(_$verticalBar.height() - settings.vertical.top - settings.vertical.bottom, settings.size * 2));
        _$horizontalBar.width(Math.max(_$horizontalBar.width() - settings.horizontal.left - settings.horizontal.right, settings.size * 2));
      }, 200);

      if (_$this.height() <= _$wrapper.height() || !settings.vertical.active) {
        _$verticalBar.hide();
        _$verticalRail.hide();
      } else {
        _$verticalBar.show();
        _$verticalRail.show();
      }

      if (_$this.width() <= _$wrapper.width() || !settings.horizontal.active) {
        _$horizontalBar.hide();
        _$horizontalRail.hide();
      } else {
        _$horizontalBar.show();
        _$horizontalRail.show();
      }
    };

    var _destroy = function () {
      if (window.MutationObserver) {
        _observer.disconnect();
      } else {
        _$this.unbind('DOMSubtreeModified', _throttledUpdate);
      }
      $(window).unbind('resize', _throttledUpdate);
      $(document).unbind('mouseup', _deactivateDrag);
      if (settings.appendTo) {
        $(settings.appendTo).unbind('mousemove', _barDrag);
      }
      _$this.remove();
      _$parent.append(_$this);
      _$wrapper.remove();
    };

    var _activate = function (el, e, type, deactivation) {
      //Did the mouse really move?
      if (e.type === 'mousemove' && e.pageX === pageX[type] && e.pageY === pageY[type]) {
        return;
      }
      pageX[type] = e.pageX;
      pageY[type] = e.pageY;
      el.addClass('active');
      _lastActive[type] = new Date().getTime();
      window.setTimeout(function () {
        if (new Date().getTime() - _lastActive[type] >= settings.timeout) {
          el.removeClass('active');
          if (typeof deactivation === 'function') {
            deactivation();
          }
        }
      }, settings.timeout);
    };

    var _activateRail = function (e, orientation) {
      if (orientation === 'horizontal') {
        _$horizontalBar.height(settings.size + 3);
        _$horizontalBar.css('bottom', settings.horizontal.margin + 2 + 'px');
        _activate(_$horizontalRail, e, orientation + 'rail', function () {
          _$horizontalBar.css('bottom', settings.horizontal.margin + 'px');
          _$horizontalBar.height(settings.size);
        });
      } else {
        _$verticalBar.width(settings.size + 3);
        _$verticalBar.css('right', settings.vertical.margin + 2 + 'px');
        _activate(_$verticalRail, e, orientation + 'rail', function () {
          _$verticalBar.css('right', settings.vertical.margin + 'px');
          _$verticalBar.width(settings.size);
        });
      }
    };

    var _activateBar = function (e) {
      _activate(_$verticalBar, e, 'verticalbar');
      _activate(_$horizontalBar, e, 'horizontalbar');
    };

    var _activateBoth = function (e, orientation) {
      _activateBar(e);
      _activateRail(e, orientation);
    };

    var _applyScroll = function (e) {
      if (_scrollTop < 0) {
        _scrollTop = 0;
      } else if (_scrollTop > _maxYScroll) {
        _scrollTop = _maxYScroll;
      }

      if (_scrollLeft < 0) {
        _scrollLeft = 0;
      } else if (_scrollLeft > _maxXScroll) {
        _scrollLeft = _maxXScroll;
      } else {
        //e.preventDefault();
      }

      if (_$content.scrollTop() !== Math.floor(_scrollTop) || _$content.scrollLeft() !== Math.floor(_scrollLeft)) {
        _$verticalBar.css('top', (_$wrapper.height() * _scrollTop / _$this.height()) + 'px');
        _$horizontalBar.css('left', (_$wrapper.width() * _scrollLeft / _$this.width()) + 'px');
        if (_$horizontalBar.is(':visible')) {
          _$content.scrollLeft(_scrollLeft);
          if (typeof settings.horizontal.trigger.callback === 'function') {
            if (_maxXScroll - _scrollLeft <= settings.horizontal.trigger.offset) {
              settings.horizontal.trigger.callback();
            }
          }
        }
        if (_$verticalBar.is(':visible')) {
          _$content.scrollTop(_scrollTop);
          if (typeof settings.vertical.trigger.callback === 'function') {
            if (_maxYScroll - _scrollTop <= settings.vertical.trigger.offset) {
              settings.vertical.trigger.callback();
            }
          }
        }
        e.preventDefault();
        e.stopPropagation();
      }
    };

    var _scroll = function (e) {
      if (e.type === 'touchstart') {
        pageX.touch = e.originalEvent.touches[0].pageX;
        pageY.touch = e.originalEvent.touches[0].pageY;
        return;
      } else if (e.type === 'touchmove') {
        if (pageX.touch && pageY.touch) {
          _scrollLeft -= e.originalEvent.touches[0].pageX - pageX.touch;
          _scrollTop -= e.originalEvent.touches[0].pageY - pageY.touch;
        }
        pageX.touch = e.originalEvent.touches[0].pageX;
        pageY.touch = e.originalEvent.touches[0].pageY;
      } else {
        //IE will generate events were the deltas are undefined instead of 0
        _scrollLeft += (e.originalEvent.deltaX || 0) * _modeMultiplier[e.originalEvent.deltaMode || WheelEvent.DOM_DELTA_PIXEL];
        _scrollTop += (e.originalEvent.deltaY || 0) * _modeMultiplier[e.originalEvent.deltaMode || WheelEvent.DOM_DELTA_PIXEL];
      }
      _applyScroll(e);
    };

    var _activateDrag = function (e, orientation) {
      $(document.body).addClass('scroll2-noselect');
      _isDragging[orientation] = true;
    };

    var _deactivateDrag = function () {
      $(document.body).removeClass('scroll2-noselect');
      _isDragging = {};
    };

    var _railClick = function (e, orientation) {
      if (orientation === 'horizontal') {
        if ((e.pageX - _$horizontalBar.offset().left) > 0) {
          _scrollLeft += _$wrapper.width();
        } else {
          _scrollLeft -= _$wrapper.width();
        }
      } else {
        if ((e.pageY - _$verticalBar.offset().top) > 0) {
          _scrollTop += _$wrapper.height();
        } else {
          _scrollTop -= _$wrapper.height();
        }
      }
      _applyScroll(e);
    };

    var _barDrag = function (e) {
      if (_isDragging.vertical && pageY.drag) {
        _scrollTop += (_$this.height() * (e.pageY - pageY.drag)) / _$wrapper.height();
      } else if (_isDragging.horizontal && pageX.drag) {
        _scrollLeft += (_$this.width() * (e.pageX - pageX.drag)) / _$wrapper.width();
      }

      if (_isDragging.vertical || _isDragging.horizontal) {
        _applyScroll(e);
        pageX.drag = e.pageX;
        pageY.drag = e.pageY;
      } else {
        pageX.drag = undefined;
        pageY.drag = undefined;
      }
    };

    var _animateScroll = function (time, delay, startTop, startLeft, targetTop, targetLeft, duration, ease) {
      time += delay;
      _scrollTop = Math.Easing[ease](time, startTop, targetTop, duration);
      _scrollLeft = Math.Easing[ease](time, startLeft, targetLeft, duration);

      if (time < duration) {
        window.setTimeout(function () {
          _animateScroll(time, delay, startTop, startLeft, targetTop, targetLeft, duration, ease);
        }, delay);
      } else {
        _scrollTop = targetTop;
        _scrollLeft = targetLeft;
      }

      _applyScroll({
        preventDefault: function () {
        }
      });
    };

    var _scrollTo = function (selector, duration, easeType) {
      var $el = $(selector);
      if (_scrollYRate !== 0 || _scrollXRate !== 0) {
        var originTop = _scrollTop;
        var originLeft = _scrollLeft;
        _animateScroll(0, 5, originTop, originLeft, $el.position().top, $el.position().left, duration || 600, easeType || 'easeInOutCirc');
      }
    };

    var _init = function () {
      _$parent = _$this.parent();
      _$wrapper = $('<div class="scroll2"/>');
      _$content = $('<div class="scroll2-content"/>');
      _$wrapper.bind('mousewheel touchmove touchstart wheel mousemove', function (e) {
        _activateBar(e);
        if (e.type !== 'mousemove') {
          _scroll(e);
        }
      });

      _$verticalRail = $('<div class="scroll2-rail" style="position: absolute; z-index: 998"/>');
      _$verticalRail.width(settings.size + 7);
      _$verticalRail.css('background-color', settings.railColor);
      _$verticalRail.css('top', '0');
      _$verticalRail.css('right', settings.vertical.margin + 'px');
      _$verticalRail.css('bottom', '0');
      _$verticalRail.css('margin-top', settings.vertical.top + 'px');
      _$verticalRail.css('margin-bottom', settings.vertical.bottom + 'px');

      _$verticalBar = $('<div class="scroll2-bar" style="position: absolute; z-index: 999;"/>');
      _$verticalBar.width(settings.size);
      _$verticalBar.css('border-radius', settings.size + 'px');
      _$verticalBar.css('background-color', settings.barColor);
      _$verticalBar.css('top', '0');
      _$verticalBar.css('right', settings.vertical.margin + 'px');
      _$verticalBar.css('margin-top', settings.vertical.top + 'px');
      _$verticalBar.css('margin-bottom', settings.vertical.bottom + 'px');

      _$horizontalRail = $('<div class="scroll2-rail" style="position: absolute; z-index: 998"/>');
      _$horizontalRail.height(settings.size + 7);
      _$horizontalRail.css('background-color', settings.railColor);
      _$horizontalRail.css('left', '0');
      _$horizontalRail.css('bottom', settings.horizontal.margin + 'px');
      _$horizontalRail.css('right', '0');
      _$horizontalRail.css('margin-left', settings.horizontal.left + 'px');
      _$horizontalRail.css('margin-right', settings.horizontal.right + 'px');

      _$horizontalBar = $('<div class="scroll2-bar" style="position: absolute; z-index: 999;"/>');
      _$horizontalBar.height(settings.size);
      _$horizontalBar.css('border-radius', settings.size + 'px');
      _$horizontalBar.css('background-color', settings.barColor);
      _$horizontalBar.css('left', '0');
      _$horizontalBar.css('bottom', settings.horizontal.margin + 'px');
      _$horizontalBar.css('margin-left', settings.horizontal.left + 'px');
      _$horizontalBar.css('margin-right', settings.horizontal.right + 'px');

      _deltaModeRate[WheelEvent.DOM_DELTA_PIXEL] = 1;
      _deltaModeRate[WheelEvent.DOM_DELTA_LINE] = +_$this.css('font-size').substring(0, _$this.css('font-size').length - 2);
      _deltaModeRate[WheelEvent.DOM_DELTA_PAGE] = _$wrapper.height();

      $(document).bind('mouseup', _deactivateDrag);
      if (settings.appendTo) {
        $(settings.appendTo).bind('mousemove', _barDrag);
      } else {
        _$wrapper.bind('mousemove', _barDrag);
      }

      _$verticalBar.bind('mousemove', function (e) {
        _activateBoth(e, 'vertical');
      });
      _$verticalBar.bind('mousedown', function (e) {
        _activateDrag(e, 'vertical');
      });
      _$verticalBar.bind('dragstart', function (e) {
        e.preventDefault();
      });
      _$verticalRail.bind('mousemove', function (e) {
        _activateBoth(e, 'vertical');
      });
      _$verticalRail.bind('click', function (e) {
        _activateBoth(e, 'vertical');
      });
      _$verticalRail.bind('click', function (e) {
        _railClick(e, 'vertical');
      });

      _$horizontalBar.bind('mousemove', function (e) {
        _activateBoth(e, 'horizontal');
      });
      _$horizontalBar.bind('mousedown', function (e) {
        _activateDrag(e, 'horizontal');
      });
      _$horizontalBar.bind('dragstart', function (e) {
        e.preventDefault();
      });
      _$horizontalRail.bind('mousemove', function (e) {
        _activateBoth(e, 'horizontal');
      });
      _$horizontalRail.bind('click', function (e) {
        _activateBoth(e, 'horizontal');
      });
      _$horizontalRail.bind('click', function (e) {
        _railClick(e, 'horizontal');
      });

      _$this.remove();
      _$wrapper.append(_$content);
      _$content.append(_$this);
      _$parent.append(_$wrapper);
      if (settings.appendTo) {
        var $appendTarget = $(settings.appendTo);
        $appendTarget.append(_$verticalRail);
        $appendTarget.append(_$verticalBar);
        $appendTarget.append(_$horizontalRail);
        $appendTarget.append(_$horizontalBar);
      } else {
        _$wrapper.append(_$verticalRail);
        _$wrapper.append(_$verticalBar);
        _$wrapper.append(_$horizontalRail);
        _$wrapper.append(_$horizontalBar);
      }

      if (window.MutationObserver) {
        _observer = new MutationObserver(_throttledUpdate);
        _observer.observe(_$content[0], {
          subtree: true,
          attributes: true,
          childList: true,
          characterData: true
        });
      } else {
        _$this.bind('DOMSubtreeModified', _throttledUpdate);
      }
      $(window).bind('resize', _throttledUpdate);

      _update();
    };
    _init();

    return $.extend(this, {
      update: _update,
      scrollTo: _scrollTo,
      destroy: _destroy
    });
  };
}(jQuery));

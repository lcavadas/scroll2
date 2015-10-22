/* globals jQuery:true */
/*!
 * jQuery Plugin for scrollbars
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
    var scrollLeft = 0;
    var scrollTop = 0;
    var _lastActive = {};
    var pageX = {};
    var pageY = {};
    var _isDragging = {};

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
      }
      if (typeof settings.container.height === 'function') {
        _$wrapper.height(settings.container.height());
      }

      var heightRatio = _$wrapper.height() / _$this.height();
      var widthRatio = _$wrapper.width() / _$this.width();

      _$verticalBar.height(Math.floor(100 * heightRatio) + '%');
      _$horizontalBar.width(Math.floor(100 * widthRatio) + '%');

      window.setTimeout(function () { //Safari will report the interim size until the css animation finishes.
        _$verticalBar.height(_$verticalBar.height() || settings.size * 2);
        _$horizontalBar.width(_$horizontalBar.width() || settings.size * 2);
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
      _$this.unbind('DOMSubtreeModified', _throttledUpdate);
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
      if (scrollTop < 0) {
        scrollTop = 0;
      } else if (scrollTop > _$this.height() - _$wrapper.height()) {
        scrollTop = _$this.height() - _$wrapper.height();
      }

      if (scrollLeft < 0) {
        scrollLeft = 0;
      } else if (scrollLeft > _$this.width() - _$wrapper.width()) {
        scrollLeft = _$this.width() - _$wrapper.width();
      }

      if (_$content.scrollTop() !== scrollTop || _$content.scrollLeft() !== scrollLeft) {
        e.preventDefault();
        _$verticalBar.css('top', (_$wrapper.height() * scrollTop / _$this.height()) + 'px');
        _$horizontalBar.css('left', (_$wrapper.width() * scrollLeft / _$this.width()) + 'px');
        if (_$horizontalBar.is(':visible')) {
          _$content.scrollLeft(scrollLeft);
          if (typeof settings.horizontal.trigger.callback === 'function') {
            var maxScroll = _$content[0].scrollWidth - _$wrapper.width();
            if (maxScroll - scrollLeft <= settings.horizontal.trigger.offset) {
              settings.horizontal.trigger.callback();
            }
          }
        }
        if (_$verticalBar.is(':visible')) {
          _$content.scrollTop(scrollTop);
          if (typeof settings.vertical.trigger.callback === 'function') {
            var maxScroll = _$content[0].scrollHeight - _$wrapper.height();
            if (maxScroll - scrollTop <= settings.vertical.trigger.offset) {
              settings.vertical.trigger.callback();
            }
          }
        }
      }
    };

    var _scroll = function (e) {
      if (e.type === 'touchmove') {
        if (pageX.touch && pageY.touch) {
          scrollLeft -= e.originalEvent.touches[0].pageX - pageX.touch;
          scrollTop -= e.originalEvent.touches[0].pageY - pageY.touch;
        }
        pageX.touch = e.originalEvent.touches[0].pageX;
        pageY.touch = e.originalEvent.touches[0].pageY;
      } else {
        //IE will generate events were the deltas are undefined instead of 0
        scrollLeft += e.originalEvent.deltaX || 0;
        scrollTop += e.originalEvent.deltaY || 0;
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
          scrollLeft += _$wrapper.width();
        } else {
          scrollLeft -= _$wrapper.width();
        }
      } else {
        if ((e.pageY - _$verticalBar.offset().top) > 0) {
          scrollTop += _$wrapper.height();
        } else {
          scrollTop -= _$wrapper.height();
        }
      }
      _applyScroll(e);
    };

    var _barDrag = function (e) {
      if (_isDragging.vertical && pageY.drag) {
        scrollTop += (_$this.height() * (e.pageY - pageY.drag)) / _$wrapper.height();
      } else if (_isDragging.horizontal && pageX.drag) {
        scrollLeft += (_$this.width() * (e.pageX - pageX.drag)) / _$wrapper.width();
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

    var _init = function () {
      _$parent = _$this.parent();
      _$wrapper = $('<div class="scroll2"/>');
      _$content = $('<div class="scroll2-content"/>');
      _$wrapper.bind('mousewheel touchmove wheel mousemove', _activateBar);
      _$wrapper.bind('mousewheel touchmove wheel', _scroll);

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

      _$this.bind('DOMSubtreeModified', _throttledUpdate);
      $(window).bind('resize', _throttledUpdate);
      _update();
    };
    _init();

    return $.extend(this, {
      update: _update,
      destroy: _destroy
    });
  };
}(jQuery));

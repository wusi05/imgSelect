/*
 * imgAreaSelect jQuery plugin
 * version 0.9.10
 *
 * Copyright (c) 2008-2013 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://odyniec.net/projects/imgareaselect/
 *
 */

(function ($) {

    var abs = Math.abs,
        max = Math.max,
        min = Math.min,
        round = Math.round;

    function div() {
        // 创建div
        return $('<div/>');
    }

    $.imgAreaSelect = function (img, options) {
        // 初始化变量
        var

            $img = $(img),

            imgLoaded,

            $box = div(),
            $area = div(),
            // div数组
            $border = div().add(div()).add(div()).add(div()),
            $outer = div().add(div()).add(div()).add(div()),
            $handles = $([]),

            $areaOpera,

            // 去除border后的图片左顶点位置
            left, top,

            imgOfs = {left: 0, top: 0},

            imgWidth, imgHeight,

            $parent,

            parOfs = {left: 0, top: 0},

            zIndex = 0,

            position = 'absolute',

            startX, startY,

            // 比例尺
            scaleX, scaleY,

            resize,

            minWidth, minHeight, maxWidth, maxHeight,

            // 等比例调整
            aspectRatio,

            shown,

            // 区域初始位置x1, y1，  结束位置 x2, y2
            x1, y1, x2, y2,

            selection = {x1: 0, y1: 0, x2: 0, y2: 0, width: 0, height: 0},

            docElem = document.documentElement,

            ua = navigator.userAgent,

            $p, d, i, o, w, h, adjusted;

        // 绝对位置
        function viewX(x) {
            return x + imgOfs.left - parOfs.left;
        }

        function viewY(y) {
            return y + imgOfs.top - parOfs.top;
        }

        // 相对位置
        function selX(x) {
            return x - imgOfs.left + parOfs.left;
        }

        function selY(y) {
            return y - imgOfs.top + parOfs.top;
        }

        function evX(event) {
            return event.pageX - parOfs.left;
        }

        function evY(event) {
            return event.pageY - parOfs.top;
        }

        // 获取选中区域
        function getSelection(noScale) {
            var sx = noScale || scaleX, sy = noScale || scaleY;

            return {
                x1: round(selection.x1 * sx),
                y1: round(selection.y1 * sy),
                x2: round(selection.x2 * sx),
                y2: round(selection.y2 * sy),
                width: round(selection.x2 * sx) - round(selection.x1 * sx),
                height: round(selection.y2 * sy) - round(selection.y1 * sy)
            };
        }

        // 设置选中区域
        function setSelection(x1, y1, x2, y2, noScale) {
            var sx = noScale || scaleX, sy = noScale || scaleY;

            selection = {
                x1: round(x1 / sx || 0),
                y1: round(y1 / sy || 0),
                x2: round(x2 / sx || 0),
                y2: round(y2 / sy || 0)
            };

            selection.width = selection.x2 - selection.x1;
            selection.height = selection.y2 - selection.y1;
        }

        // 调整，imgOfs，imgWidth，imgHeight，left， top等参数
        function adjust() {
            if (!imgLoaded || !$img.width())
                return;
            // 图片偏移量（左顶点的坐标）
            imgOfs = {left: round($img.offset().left), top: round($img.offset().top)};

            // 获取图片的宽度和高度
            imgWidth = $img.innerWidth();
            imgHeight = $img.innerHeight();

            // 调整加上border的1/2
            // innerHeight() - 返回元素的高度（包含 padding）
            // outerHeight() - 返回元素的宽度（包含 padding 和 border）
            imgOfs.top += ($img.outerHeight() - imgHeight) >> 1;
            imgOfs.left += ($img.outerWidth() - imgWidth) >> 1;

            // 通过options参数，获取minWidth，minHeight，maxWidth，maxHeight
            minWidth = round(options.minWidth / scaleX) || 0;
            minHeight = round(options.minHeight / scaleY) || 0;
            maxWidth = round(min(options.maxWidth / scaleX || 1 << 24, imgWidth));
            maxHeight = round(min(options.maxHeight / scaleY || 1 << 24, imgHeight));

            // 解决兼容性问题
            if ($().jquery == '1.3.2' && position == 'fixed' &&
                !docElem['getBoundingClientRect']) {
                // scrollTop:被卷去的高, scrollLeft:被卷去的左
                imgOfs.top += max(document.body.scrollTop, docElem.scrollTop);
                imgOfs.left += max(document.body.scrollLeft, docElem.scrollLeft);
            }

            // 计算区域偏移量，根据父元素的position属性
            parOfs = /absolute|relative/.test($parent.css('position')) ?
                {
                    left: round($parent.offset().left) - $parent.scrollLeft(),
                    top: round($parent.offset().top) - $parent.scrollTop()
                } :
                position == 'fixed' ?
                    {left: $(document).scrollLeft(), top: $(document).scrollTop()} :
                    {left: 0, top: 0};

            left = viewX(0);
            top = viewY(0);

            // 如果选择区域大于图片，重新调整
            if (selection.x2 > imgWidth || selection.y2 > imgHeight)
                doResize();
        }

        // 选择区域时更新样式
        function update(resetKeyPress) {
            if (!shown) return;

            // 初始化box区域
            $box.css({left: viewX(selection.x1), top: viewY(selection.y1)})
                .add($area).width(w = selection.width).height(h = selection.height);
            // 区域添加边框，和缩放处理器
            $area.add($border).add($handles).css({left: 0, top: 0});

            $border
                .width(max(w - $border.outerWidth() + $border.innerWidth(), 0))
                .height(max(h - $border.outerHeight() + $border.innerHeight(), 0));

            // 计算$outer css
            $($outer[0]).css({
                left: left, top: top,
                width: selection.x1, height: imgHeight
            });
            $($outer[1]).css({
                left: left + selection.x1, top: top,
                width: w, height: selection.y1
            });
            $($outer[2]).css({
                left: left + selection.x2, top: top,
                width: imgWidth - selection.x2, height: imgHeight
            });
            $($outer[3]).css({
                left: left + selection.x1, top: top + selection.y2,
                width: w, height: imgHeight - selection.y2
            });

            w -= $handles.outerWidth();
            h -= $handles.outerHeight();

            switch ($handles.length) {
                // 出来顶点
                case 8:
                    $($handles[4]).css({left: w >> 1});
                    $($handles[5]).css({left: w, top: h >> 1});
                    $($handles[6]).css({left: w >> 1, top: h});
                    $($handles[7]).css({top: h >> 1});
                case 4:
                    $handles.slice(1, 3).css({left: w});
                    $handles.slice(2, 4).css({top: h});
            }

            if (resetKeyPress !== false) {
                if ($.imgAreaSelect.onKeyPress != docKeyPress)
                    $(document).unbind($.imgAreaSelect.keyPress,
                        $.imgAreaSelect.onKeyPress);

                if (options.keys)
                    $(document)[$.imgAreaSelect.keyPress](
                        $.imgAreaSelect.onKeyPress = docKeyPress);
            }

            if (msie && $border.outerWidth() - $border.innerWidth() == 2) {
                $border.css('margin', 0);
                setTimeout(function () {
                    $border.css('margin', 'auto');
                }, 0);
            }
        }

        function doUpdate(resetKeyPress) {
            adjust();
            update(resetKeyPress);
            x1 = viewX(selection.x1);
            y1 = viewY(selection.y1);
            x2 = viewX(selection.x2);
            y2 = viewY(selection.y2);
        }

        // 隐藏调用的方法
        function hide($elem, fn) {
            // 淡入淡出的效果
            options.fadeSpeed ? $elem.fadeOut(options.fadeSpeed, fn) : $elem.hide();
        }

        // 区域内鼠标移动处理器
        function areaMouseMove(event) {
            // 获取鼠标相对于box左上顶点的位置
            var x = selX(evX(event)) - selection.x1,
                y = selY(evY(event)) - selection.y1;

            if (!adjusted) {
                adjust();
                adjusted = true;
                $box.one('mouseout', function () {
                    adjusted = false;
                });
            }

            resize = '';

            if (options.resizable) {
                if (y <= options.resizeMargin)
                    resize = 'n';
                else if (y >= selection.height - options.resizeMargin)
                    resize = 's';
                if (x <= options.resizeMargin)
                    resize += 'w';
                else if (x >= selection.width - options.resizeMargin)
                    resize += 'e';
            }

            $box.css('cursor', resize ? resize + '-resize' :
                options.movable ? 'move' : '');
            if ($areaOpera)
                $areaOpera.toggle();
        }

        function docMouseUp(event) {
            $('body').css('cursor', '');
            if (options.autoHide || selection.width * selection.height == 0)
                hide($box.add($outer), function () {
                    $(this).hide();
                });

            $(document).unbind('mousemove', selectingMouseMove);
            $box.mousemove(areaMouseMove);

            options.onSelectEnd(img, getSelection());
        }

        function areaMouseDown(event) {
            if (event.which != 1) return false;

            adjust();

            if (resize) {
                $('body').css('cursor', resize + '-resize');

                x1 = viewX(selection[/w/.test(resize) ? 'x2' : 'x1']);
                y1 = viewY(selection[/n/.test(resize) ? 'y2' : 'y1']);

                $(document).mousemove(selectingMouseMove)
                    .one('mouseup', docMouseUp);
                $box.unbind('mousemove', areaMouseMove);
            }
            else if (options.movable) {
                startX = left + selection.x1 - evX(event);
                startY = top + selection.y1 - evY(event);

                $box.unbind('mousemove', areaMouseMove);

                $(document).mousemove(movingMouseMove)
                    .one('mouseup', function () {
                        options.onSelectEnd(img, getSelection());

                        $(document).unbind('mousemove', movingMouseMove);
                        $box.mousemove(areaMouseMove);
                    });
            }
            else
                $img.mousedown(event);

            return false;
        }

        function fixAspectRatio(xFirst) {
            if (aspectRatio)
                if (xFirst) {
                    x2 = max(left, min(left + imgWidth,
                        x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1)));

                    y2 = round(max(top, min(top + imgHeight,
                        y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1))));
                    x2 = round(x2);
                }
                else {
                    y2 = max(top, min(top + imgHeight,
                        y1 + abs(x2 - x1) / aspectRatio * (y2 > y1 || -1)));
                    x2 = round(max(left, min(left + imgWidth,
                        x1 + abs(y2 - y1) * aspectRatio * (x2 > x1 || -1))));
                    y2 = round(y2);
                }
        }

        // 重新调整大小（x1，y1，x2，y2）
        function doResize() {
            x1 = min(x1, left + imgWidth);
            y1 = min(y1, top + imgHeight);

            // 处理小于最小选择区域的情况
            if (abs(x2 - x1) < minWidth) {
                x2 = x1 - minWidth * (x2 < x1 || -1);

                if (x2 < left)
                    x1 = left + minWidth;
                else if (x2 > left + imgWidth)
                    x1 = left + imgWidth - minWidth;
            }

            if (abs(y2 - y1) < minHeight) {
                y2 = y1 - minHeight * (y2 < y1 || -1);

                if (y2 < top)
                    y1 = top + minHeight;
                else if (y2 > top + imgHeight)
                    y1 = top + imgHeight - minHeight;
            }

            x2 = max(left, min(x2, left + imgWidth));
            y2 = max(top, min(y2, top + imgHeight));

            fixAspectRatio(abs(x2 - x1) < abs(y2 - y1) * aspectRatio);

            // 处理大于最大距离的情况
            if (abs(x2 - x1) > maxWidth) {
                x2 = x1 - maxWidth * (x2 < x1 || -1);
                fixAspectRatio();
            }

            if (abs(y2 - y1) > maxHeight) {
                y2 = y1 - maxHeight * (y2 < y1 || -1);
                fixAspectRatio(true);
            }

            selection = {
                x1: selX(min(x1, x2)), x2: selX(max(x1, x2)),
                y1: selY(min(y1, y2)), y2: selY(max(y1, y2)),
                width: abs(x2 - x1), height: abs(y2 - y1)
            };

            update();
            // 调用change方法
            options.onSelectChange(img, getSelection());
        }

        // 鼠标移动事件
        function selectingMouseMove(event) {
            // 根据是都等比例一定移动
            x2 = /w|e|^$/.test(resize) || aspectRatio ? evX(event) : viewX(selection.x2);
            y2 = /n|s|^$/.test(resize) || aspectRatio ? evY(event) : viewY(selection.y2);

            doResize();

            return false;

        }

        function doMove(newX1, newY1) {
            x2 = (x1 = newX1) + selection.width;
            y2 = (y1 = newY1) + selection.height;

            $.extend(selection, {
                x1: selX(x1), y1: selY(y1), x2: selX(x2),
                y2: selY(y2)
            });

            update();

            options.onSelectChange(img, getSelection());
        }

        function movingMouseMove(event) {
            x1 = max(left, min(startX + evX(event), left + imgWidth - selection.width));
            y1 = max(top, min(startY + evY(event), top + imgHeight - selection.height));

            doMove(x1, y1);

            event.preventDefault();

            return false;
        }

        function startSelection() {
            // unbind() 方法移除被选元素的事件处理程序。
            // jquery事件 http://www.w3school.com.cn/jquery/jquery_ref_events.asp
            $(document).unbind('mousemove', startSelection);
            adjust();

            x2 = x1;
            y2 = y1;

            doResize();

            resize = '';

            // is(':visible') 是指是否可见的意思
            if (!$outer.is(':visible'))
                $box.add($outer).hide().fadeIn(options.fadeSpeed || 0);

            shown = true;

            $(document).unbind('mouseup', cancelSelection)
                .mousemove(selectingMouseMove).one('mouseup', docMouseUp);
            $box.unbind('mousemove', areaMouseMove);
            // 开始选择区域回调函数
            options.onSelectStart(img, getSelection());
        }

        function cancelSelection() {
            $(document).unbind('mousemove', startSelection)
                .unbind('mouseup', cancelSelection);
            hide($box.add($outer));

            setSelection(selX(x1), selY(y1), selX(x1), selY(y1));

            if (!(this instanceof $.imgAreaSelect)) {
                options.onSelectChange(img, getSelection());
                options.onSelectEnd(img, getSelection());
            }
        }

        // 处理图片鼠标点击事件，用户把鼠标移动一个像素，就会发生一次 mousemove 事件，就会调用一个函数
        function imgMouseDown(event) {
            // 动画元素或者不是鼠标左键点击的，鼠标左键1，中键2，右键3
            if (event.which != 1 || $outer.is(':animated')) return false;

            adjust();
            // 初始化起点位置 x1 y1
            startX = x1 = evX(event);
            startY = y1 = evY(event);

            // 鼠标移动：开始选择，鼠标抬起：取消选择
            $(document).mousemove(startSelection).mouseup(cancelSelection);

            return false;
        }

        function windowResize() {
            doUpdate(false);
        }

        // 图片加载后调用方法
        function imgLoad() {
            imgLoaded = true;

            // 设置操作 $.extend( target [, object1 ] [, objectN ] )，jQuery.extend() 函数用于将一个或多个对象的内容合并到目标对象。
            setOptions(options = $.extend({
                classPrefix: 'imgareaselect',
                movable: true,
                parent: 'body',
                resizable: true,
                resizeMargin: 10,
                onInit: function () {
                },
                onSelectStart: function () {
                },
                onSelectChange: function () {
                },
                onSelectEnd: function () {
                }
            }, options));

            // visibility 属性规定元素是否可见。
            $box.add($outer).css({visibility: ''});

            if (options.show) {
                shown = true;
                adjust();
                update();
                // $(selector).fadeIn(speed,callback),隐藏$box(选择框)
                $box.add($outer).hide().fadeIn(options.fadeSpeed || 0);
            }

            // 回调函数 onInit()
            setTimeout(function () {
                options.onInit(img, getSelection());
            }, 0);
        }

        var docKeyPress = function (event) {
            var k = options.keys, d, t, key = event.keyCode;

            d = !isNaN(k.alt) && (event.altKey || event.originalEvent.altKey) ? k.alt :
                !isNaN(k.ctrl) && event.ctrlKey ? k.ctrl :
                    !isNaN(k.shift) && event.shiftKey ? k.shift :
                        !isNaN(k.arrows) ? k.arrows : 10;

            if (k.arrows == 'resize' || (k.shift == 'resize' && event.shiftKey) ||
                (k.ctrl == 'resize' && event.ctrlKey) ||
                (k.alt == 'resize' && (event.altKey || event.originalEvent.altKey))) {
                switch (key) {
                    case 37:
                        d = -d;
                    case 39:
                        t = max(x1, x2);
                        x1 = min(x1, x2);
                        x2 = max(t + d, x1);
                        fixAspectRatio();
                        break;
                    case 38:
                        d = -d;
                    case 40:
                        t = max(y1, y2);
                        y1 = min(y1, y2);
                        y2 = max(t + d, y1);
                        fixAspectRatio(true);
                        break;
                    default:
                        return;
                }

                doResize();
            }
            else {
                x1 = min(x1, x2);
                y1 = min(y1, y2);

                switch (key) {
                    case 37:
                        doMove(max(x1 - d, left), y1);
                        break;
                    case 38:
                        doMove(x1, max(y1 - d, top));
                        break;
                    case 39:
                        doMove(x1 + min(d, imgWidth - selX(x2)), y1);
                        break;
                    case 40:
                        doMove(x1, y1 + min(d, imgHeight - selY(y2)));
                        break;
                    default:
                        return;
                }
            }

            return false;
        };

        function styleOptions($elem, props) {
            for (var option in props)
                if (options[option] !== undefined)
                    $elem.css(props[option], options[option]);
        }

        function setOptions(newOptions) {
            if (newOptions.parent)
                ($parent = $(newOptions.parent)).append($box.add($outer));

            $.extend(options, newOptions);

            adjust();

            if (newOptions.handles != null) {
                $handles.remove();
                $handles = $([]);

                i = newOptions.handles ? newOptions.handles == 'corners' ? 4 : 8 : 0;

                while (i--)
                    $handles = $handles.add(div());

                $handles.addClass(options.classPrefix + '-handle').css({
                    position: 'absolute',
                    fontSize: 0,
                    zIndex: zIndex + 1 || 1
                });

                if (!parseInt($handles.css('width')) >= 0)
                    $handles.width(5).height(5);

                if (o = options.borderWidth)
                    $handles.css({borderWidth: o, borderStyle: 'solid'});

                styleOptions($handles, {
                    borderColor1: 'border-color',
                    borderColor2: 'background-color',
                    borderOpacity: 'opacity'
                });
            }

            scaleX = options.imageWidth / imgWidth || 1;
            scaleY = options.imageHeight / imgHeight || 1;

            if (newOptions.x1 != null) {
                setSelection(newOptions.x1, newOptions.y1, newOptions.x2,
                    newOptions.y2);
                newOptions.show = !newOptions.hide;
            }

            if (newOptions.keys)
                options.keys = $.extend({shift: 1, ctrl: 'resize'},
                    newOptions.keys);
            // 设置蒙版和选中区样式
            $outer.addClass(options.classPrefix + '-outer');
            $area.addClass(options.classPrefix + '-selection');
            // 添加边框样式
            for (i = 0; i++ < 4;)
                $($border[i - 1]).addClass(options.classPrefix + '-border' + i);

            styleOptions($area, {
                selectionColor: 'background-color',
                selectionOpacity: 'opacity'
            });
            styleOptions($border, {
                borderOpacity: 'opacity',
                borderWidth: 'border-width'
            });
            styleOptions($outer, {
                outerColor: 'background-color',
                outerOpacity: 'opacity'
            });
            if (o = options.borderColor1)
                $($border[0]).css({borderStyle: 'solid', borderColor: o});
            if (o = options.borderColor2)
                $($border[1]).css({borderStyle: 'dashed', borderColor: o});

            $box.append($area.add($border).add($areaOpera)).append($handles);

            if (msie) {
                if (o = ($outer.css('filter') || '').match(/opacity=(\d+)/))
                    $outer.css('opacity', o[1] / 100);
                if (o = ($border.css('filter') || '').match(/opacity=(\d+)/))
                    $border.css('opacity', o[1] / 100);
            }

            if (newOptions.hide)
                hide($box.add($outer));
            else if (newOptions.show && imgLoaded) {
                shown = true;
                $box.add($outer).fadeIn(options.fadeSpeed || 0);
                doUpdate();
            }

            aspectRatio = (d = (options.aspectRatio || '').split(/:/))[0] / d[1];

            $img.add($outer).unbind('mousedown', imgMouseDown);

            if (options.disable || options.enable === false) {
                $box.unbind('mousemove', areaMouseMove).unbind('mousedown', areaMouseDown);
                $(window).unbind('resize', windowResize);
            }
            else {
                if (options.enable || options.disable === false) {
                    if (options.resizable || options.movable)
                        $box.mousemove(areaMouseMove).mousedown(areaMouseDown);

                    $(window).resize(windowResize);
                }

                if (!options.persistent)
                    $img.add($outer).mousedown(imgMouseDown);
            }

            options.enable = options.disable = undefined;
        }

        this.remove = function () {
            setOptions({disable: true});
            $box.add($outer).remove();
        };

        this.getOptions = function () {
            return options;
        };

        // 这几个方法是为了options.instance=true时外部调用
        this.setOptions = setOptions;

        this.getSelection = getSelection;

        this.setSelection = setSelection;

        this.cancelSelection = cancelSelection;

        this.update = doUpdate;

        // 赋值操作
        var msie = (/msie ([\w.]+)/i.exec(ua) || [])[1],
            opera = /opera/i.test(ua),
            safari = /webkit/i.test(ua) && !/chrome/i.test(ua);

        $p = $img;

        // 图片存在的时候，计算z-index
        while ($p.length) {
            zIndex = max(zIndex,
                !isNaN($p.css('z-index')) ? $p.css('z-index') : zIndex);
            if ($p.css('position') == 'fixed')
                position = 'fixed';

            $p = $p.parent(':not(body)');
        }
        // 设置zIndex
        zIndex = options.zIndex || zIndex;

        if (msie)
            $img.attr('unselectable', 'on');

        $.imgAreaSelect.keyPress = msie || safari ? 'keydown' : 'keypress';

        if (opera)

            $areaOpera = div().css({
                width: '100%', height: '100%',
                position: 'absolute', zIndex: zIndex + 2 || 2
            });

        $box.add($outer).css({
            visibility: 'hidden', position: position,
            overflow: 'hidden', zIndex: zIndex || '0'
        });
        $box.css({zIndex: zIndex + 2 || 2});
        $area.add($border).css({position: 'absolute', fontSize: 0});

        img.complete || img.readyState == 'complete' || !$img.is('img') ?
            imgLoad() : $img.one('load', imgLoad);

        if (!imgLoaded && msie && msie >= 7)
            img.src = img.src;
    };

    $.fn.imgAreaSelect = function (options) {
        options = options || {};
        // 遍历执行
        this.each(function () {
            // 如果数据存在的话，获取data
            if ($(this).data('imgAreaSelect')) {
                // 如果设置移除，移除数据
                if (options.remove) {
                    $(this).data('imgAreaSelect').remove();
                    $(this).removeData('imgAreaSelect');
                }
                else
                // 或者设置操作
                    $(this).data('imgAreaSelect').setOptions(options);
            }
            // 数据不存在且不移除的话
            else if (!options.remove) {
                if (options.enable === undefined && options.disable === undefined)
                    options.enable = true;
                // 设置 data
                $(this).data('imgAreaSelect', new $.imgAreaSelect(this, options));
            }
        });

        // 如果 instance为true,那么返回imgAreaSelect数据
        if (options.instance)
            return $(this).data('imgAreaSelect');

        return this;
    };

})(jQuery);

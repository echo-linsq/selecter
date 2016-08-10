;
(function($) {
    //检测参数是否合法
    function isValid(options) {
        return (typeof options === 'undefined' || options === null || options === '' || typeof options !== 'object') ? false : true;
    }
    //设置配置
    function setConfig(element, config) {
        element.data(config);
    }
    //获取配置
    function getConfig(element, type) {
        return element.data()[type];
    }
    //创建下拉列表
    function createSelectList(element, items) {
        if(items.length==0){
            return;
        }
        element.attr('isInitData', true);
        var html = '';
        $.each(items, function() {
            html += '<li class="js-list-item" value="' + this.value + '">' + this.text + '</li>';
        });
        var dom = $(html);
        dom.appendTo(element.find('.js-dropdown-list'));
        element.find('.js-list-item').each(function(i, item) {
            $(item).data(items[i]);
        });
    }
    //绑定事件
    function initEvents(element) {
        var $selectItem = element.find('.js-selected');
        var $selectIcon = element.find('.js-selecticon');
        var $selectList = element.find('.js-dropdown-list');
        $selectIcon.addClass('z-iconup');
        element.on('mousedown', '.js-selecticon,.js-selected,.js-list-item', function(e) {
            e.stopPropagation();
            if (element.attr('disabled')) {
                return;
            }
            var $this = $(this);
            if ($this.hasClass('js-selecticon') || $this.hasClass('js-selected')) {
                if (!element.attr('isInitData')) {
                    var dataList = getConfig(element, 'items');
                    createSelectList(element, dataList);
                }
                if ($selectList.is(':hidden')) {
                    if($selectList.children().length==0){
                        return;
                    }
                    $selectItem.addClass('z-selected-showlist');
                    $selectIcon.removeClass('z-iconup').addClass('z-icondown');
                    var item = $selectList.find('[value="' + element.getValue().value + '"]');
                    item.addClass('z-select-listitem');
                    $selectList.slideDown(100, function() {
                        item[0].scrollIntoView();
                    });
                } else {
                    $selectItem.removeClass('z-selected-showlist');
                    $selectIcon.removeClass('z-icondown').addClass('z-iconup');
                    $selectList.slideUp(100);
                }
            } else if ($this.hasClass('js-list-item')) {
                var itemData = $this.data();
                $this.siblings().removeClass('z-select-listitem');
                $this.addClass('z-select-listitem');
                $selectItem.removeClass('z-selected-showlist');
                $selectIcon.removeClass('z-icondown').addClass('z-iconup');
                element.setValue(itemData);
                $selectList.hide();
                var callback = getConfig(element, 'callback');
                if (typeof(callback) == 'function') {
                    callback.call(element, itemData);
                };
            }
        });
        $(document).on('mousedown.select',function(){
            if($selectList.is(':visible')){
                $selectItem.removeClass('z-selected-showlist');
                $selectIcon.removeClass('z-icondown').addClass('z-iconup');
                $selectList.slideUp(100);
            }
        });
    }
    $.fn.extend({
        initSelect: function(options) {
            var select = $(this);
            //默认参数配置
            //列表项的格式items:[{ value: 'items1', text: '选择1' }, { value: 'items2', text: '选择2' }]
            var defaultValue = {
                name: 'select',
                items: [],
                selectvalue: '',
                callback: function() {}
            };
            if (!isValid(options)) {
                return this;
            };
            var args = $.extend(true, defaultValue, options);
            setConfig(select, args);
            var selectHtml = '<div class="m-select-unit js-select-unit">\
                                <div class="u-selecticon js-selecticon"></div>\
                                <p class="u-selected js-selected"></p>\
                                <ul class="u-dropdown-list js-dropdown-list">\
                                </ul>\
                            </div>';
            $(this).append(selectHtml);
            select.setValue = function(item) {
                if(jQuery.isEmptyObject(item)){
                    select.find('.js-selected').html('').removeAttr('value');
                    select.find('.js-selected').data('');
                }else{
                    select.find('.js-selected').html(item.text).attr('value', item.value);
                    select.find('.js-selected').data(item);
                }
                return select;
            };
            select.getValue = function() {
                return select.find('.js-selected').data();
            };
            select.disable = function() {
                select.find('.js-selected').addClass('z-selected-disable');
                select.attr('disabled', true);
                return select;
            };
            select.enable = function() {
                select.find('.js-selected').removeClass('z-selected-disable');
                select.removeAttr('disabled');
                return select;
            };
            select.setCallBack = function(callback) {
                if (typeof callback === 'function') {
                    setConfig(select, { callback: callback });
                }
                return select;
            };
            select.reset = function(resetItems) {
                select.removeAttr('isInitData');
                select.find('.js-dropdown-list').empty();
                setConfig(select, { items: resetItems });
                var itemData = resetItems[0] || {};
                select.setValue(itemData);
                return select;
            };
            select.destory = function() {
                $(document).off('mousedown.select');
                select.off('mousedown');
            };
            initEvents(select);
            var itemData = args.selectvalue || args.items[0] || {};
            select.setValue(itemData);
            return select;
        }
    });
})(jQuery);

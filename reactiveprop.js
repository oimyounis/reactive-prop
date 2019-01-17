var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var ReactiveProp = /** @class */ (function () {
    function ReactiveProp(element, definitionName, prop, reactiveName, initValue) {
        if (initValue === void 0) { initValue = ''; }
        this._element = null;
        this._definitionName = '';
        this._prop = '';
        this._reactiveName = '';
        this._value = '';
        this._element = element;
        this._definitionName = definitionName;
        this._prop = prop;
        this._reactiveName = reactiveName;
        this.setValue(initValue);
    }
    ReactiveProp.prototype.getValue = function () {
        var _value = this._element.attrib(this._prop);
        if (_value === null) {
            _value = '';
        }
        this._value = _value;
        return this._value;
    };
    ReactiveProp.prototype.setValue = function (value) {
        this._value = value;
    };
    return ReactiveProp;
}());
var ReactiveElement = /** @class */ (function () {
    function ReactiveElement(selector) {
        this._element = null;
        this._propList = {};
        var el = document.querySelector(selector);
        if (el === null) {
            throw "Element with selector \"" + selector + "\" does not exist";
        }
        this._element = el;
        this._buildProps();
    }
    ReactiveElement.prototype._buildProps = function () {
        var propMapCopy = __assign({}, this._element.attributes);
        propMapCopy.length = Object.keys(propMapCopy).length;
        for (var _i = 0, propMapCopy_1 = propMapCopy; _i < propMapCopy_1.length; _i++) {
            var prop = propMapCopy_1[_i];
            var name_1 = prop.name;
            var reactiveName = prop.value;
            if (name_1.indexOf('r-') == 0) {
                var propName = name_1.substr(2);
                var initValue = this._element.getAttribute(propName);
                if (initValue === null) {
                    initValue = '';
                }
                this._propList[reactiveName] = new ReactiveProp(this, name_1, propName, reactiveName, initValue);
                this._defineReactiveProp(reactiveName);
                this._element.attributes.removeNamedItem(name_1);
            }
        }
    };
    ReactiveElement.prototype._defineReactiveProp = function (reactiveName) {
        var _this = this;
        Object.defineProperty(this, reactiveName, {
            get: function () {
                var _rprop = _this._propList[reactiveName];
                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }
                return _this._propList[reactiveName].getValue();
            },
            set: function (value) {
                var _rprop = _this._propList[reactiveName];
                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }
                _this._propList[reactiveName].setValue(value);
            },
            enumerable: true,
            configurable: true
        });
    };
    ReactiveElement.prototype.attrib = function (name) {
        var _v = this._element.getAttribute(name);
        if (_v === null) {
            if (this._element[name] !== undefined) {
                _v = this._element[name];
            }
        }
        return _v;
    };
    return ReactiveElement;
}());

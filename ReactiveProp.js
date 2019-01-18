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
        this._bound = [];
        this._origin = null;
        this._element = element;
        this._definitionName = definitionName;
        this._prop = prop;
        this._reactiveName = reactiveName;
        this.setValue(initValue);
        if (ReactiveProp._DEFINED[reactiveName] === undefined) {
            ReactiveProp._DEFINED[reactiveName] = this;
        }
        else {
            this._origin = ReactiveProp._DEFINED[reactiveName];
        }
        // else {
        //     this._bound.push(ReactiveProp._DEFINED[reactiveName]._element);
        // }
        ReactiveProp._DEFINED[reactiveName].bind(this);
    }
    ReactiveProp.update = function () {
        for (var key in ReactiveProp._DEFINED) {
            var prop = ReactiveProp._DEFINED[key];
            prop._updateBound();
        }
    };
    ReactiveProp.prototype.getValue = function () {
        // let _value = this._element.attrib(this._prop);
        // if (_value === null) {
        //     _value = '';
        // }
        // this._value = _value;
        return this._value;
    };
    ReactiveProp.prototype.setValue = function (value) {
        if (this._definitionName === 'r-reactive')
            return;
        this._value = value;
        this._origin && this._origin.setValue(this._value);
        if (this._element._element[this._prop] === undefined) {
            // if (this._element._element.getAttribute(this._prop) !== null) {
            this._element._element.setAttribute(this._prop, value);
            // }
        }
        else {
            this._element._element[this._prop] = value;
        }
    };
    ReactiveProp.prototype._updateValue = function () {
        this.setValue(this._element.attrib(this._prop));
    };
    ReactiveProp.prototype.bind = function (prop) {
        this._bound.push(prop);
    };
    ReactiveProp.prototype._updateBound = function () {
        // this.updateValue();
        for (var _i = 0, _a = this._bound; _i < _a.length; _i++) {
            var prop = _a[_i];
            // element.setAttrib(this);
            prop.setValue(this._element.attrib(this._prop));
        }
        // for (const element of this._bound) {
        // this._element.setAttrib(this);
    };
    ReactiveProp._DEFINED = {};
    return ReactiveProp;
}());
var ReactiveElement = /** @class */ (function () {
    function ReactiveElement(selector) {
        this._element = null;
        this._propList = {};
        if (typeof selector === 'string') {
            var el = document.querySelector(selector);
            if (el === null) {
                throw "Element with selector \"" + selector + "\" does not exist";
            }
        }
        else {
            el = selector;
        }
        this._element = el;
        this._mapProps();
        this._initEvents();
    }
    ReactiveElement.prototype._mapProps = function () {
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
                var propObj = new ReactiveProp(this, name_1, propName, reactiveName, initValue);
                if (this._propList[reactiveName] === undefined) {
                    this._propList[reactiveName] = [];
                }
                this._propList[reactiveName].push(propObj);
                this._defineReactiveProp(reactiveName);
                this._element.attributes.removeNamedItem(name_1);
            }
        }
    };
    ReactiveElement.prototype._defineReactiveProp = function (reactiveName) {
        Object.defineProperty(this, reactiveName, {
            get: function () {
                var _rprop = ReactiveProp._DEFINED[reactiveName];
                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }
                return _rprop.getValue();
            },
            set: function (value) {
                var _rprop = ReactiveProp._DEFINED[reactiveName];
                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }
                _rprop.setValue(value);
                _rprop._updateBound();
            },
            enumerable: true,
            configurable: true
        });
    };
    ReactiveElement.prototype.attrib = function (name) {
        var _v = this._element[name];
        if (_v === undefined) {
            _v = this._element.getAttribute(name);
        }
        return _v;
    };
    ReactiveElement.prototype.setAttrib = function (prop) {
        var value = prop.getValue();
        for (var _i = 0, _a = this._propList[prop._reactiveName]; _i < _a.length; _i++) {
            var _prop = _a[_i];
            _prop.setValue(value);
        }
    };
    ReactiveElement.prototype._initEvents = function () {
        var _this = this;
        this._element.addEventListener('change', function (e) {
            // for (const key in this._propList) {
            //     const props = this._propList[key];
            //
            //     for (const prop of props) {
            //         prop._update();
            //     }
            // }
            for (var key in _this._propList) {
                var props = _this._propList[key];
                for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
                    var prop = props_1[_i];
                    prop._updateValue();
                }
            }
            ReactiveProp.update();
        });
        this._element.addEventListener('input', function (e) {
            for (var key in _this._propList) {
                var props = _this._propList[key];
                for (var _i = 0, props_2 = props; _i < props_2.length; _i++) {
                    var prop = props_2[_i];
                    prop._updateValue();
                }
            }
            // for (const key in this._propList) {
            //     const props = this._propList[key];
            // for (const prop of props) {
            ReactiveProp.update();
            // }
            // }
        });
    };
    return ReactiveElement;
}());
var reactiveElements = document.querySelectorAll('[ r-reactive]');
if (reactiveElements) {
    for (var _i = 0, reactiveElements_1 = reactiveElements; _i < reactiveElements_1.length; _i++) {
        var el = reactiveElements_1[_i];
        new ReactiveElement(el);
    }
}

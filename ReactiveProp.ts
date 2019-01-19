class ReactiveProp {
    static _DEFINED = {};
    static update() {
        for (const key in ReactiveProp._DEFINED) {
            const prop: ReactiveProp = ReactiveProp._DEFINED[key];

            prop._updateBound();
        }
    }

    static _DIRECTIVES = ['html', 'text', 'visible'];

    private _element = null;
    private _definitionName = '';
    private _prop = '';
    private _reactiveName = '';
    private _value = '';
    private _bound = [];

    private _origin = null;

    constructor(element, definitionName: string, prop: string, reactiveName: string, initValue = '') {
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

        ReactiveProp._DEFINED[reactiveName].bind(this);
    }

    getValue() {
        return this._value;
    }

    setValue(value) {
        if (this._definitionName === 'r-reactive')
            return;

        if (value === null)
            return;

        this._value = value;
        this._origin && this._origin.setValue(this._value);

        this._reflect();
    }

    private _reflect() {
        if (this._isDirective()) {
            this._handleDirective();
        }
        else {
            if (this._element._element[this._prop] === undefined) {
                this._element._element.setAttribute(this._prop, this._value);
            }
            else {
                this._element._element[this._prop] = this._value;
            }
        }
    }

    private _isDirective() {
        return ReactiveProp._DIRECTIVES.indexOf(this._prop) !== -1;
    }

    private _handleDirective() {
        if (this._prop === 'html') {
            this._element._element.innerHTML = this._value;
        }
        else if (this._prop === 'text') {
            this._element._element.innerText = this._value;
        }
        else if (this._prop === 'visible') {
            if (this._value == true) {
                this._element._element.style['display'] = '';
            }
            else if (this._value == false) {
                this._element._element.style['display'] = 'none';
            }
        }
    }

    _updateValue() {
        const val = this._element.attrib(this._prop);
        const changed = val != this._value;
        this.setValue(val);

        return changed;
    }

    bind(prop) {
        this._bound.push(prop);
    }

    _updateBound() {
        for (const prop of this._bound) {
            prop.setValue(this._element.attrib(this._prop));
        }
    }
}

class ReactiveElement {
    private _element = null;
    private _propList = {};

    constructor(selector) {
        let el = null;
        if (typeof selector === 'string'){
            el = document.querySelector(selector);
            if (el === null) {
                throw `Element with selector "${selector}" does not exist`;
            }
        }
        else {
            el = selector;
        }

        this._element = el;

        this._mapProps();
        this._initEvents();
    }

    private _mapProps() {
        const propMapCopy = { ...this._element.attributes };
        propMapCopy.length = Object.keys(propMapCopy).length;

        for (const prop of propMapCopy) {
            const name = prop.name;
            const reactiveName = prop.value;

            if (name.indexOf('r-') == 0) {
                const propName = name.substr(2);
                let initValue = this._element.getAttribute(propName);
                if (initValue === null) {
                    initValue = '';
                }

                let propObj = new ReactiveProp(this, name, propName, reactiveName, initValue);
                if (this._propList[reactiveName] === undefined) {
                    this._propList[reactiveName] = []
                }
                this._propList[reactiveName].push(propObj);

                this._defineReactiveProp(reactiveName);

                this._element.attributes.removeNamedItem(name);
            }
        }
    }

    private _defineReactiveProp(reactiveName) {
        Object.defineProperty(this, reactiveName, {
            get: () => {
                const _rprop: ReactiveProp = ReactiveProp._DEFINED[reactiveName];

                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }

                return _rprop.getValue();
            },
            set: (value) => {
                const _rprop: ReactiveProp = ReactiveProp._DEFINED[reactiveName];

                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }

                _rprop.setValue(value);
                _rprop._updateBound();
            },
            enumerable: true,
            configurable: true
        });
    }

    attrib(name) {
        let _v = this._element[name];

        if (_v === undefined) {
            _v = this._element.getAttribute(name);
        }

        return _v;
    }

    private _initEvents() {
        this._element.addEventListener('change', () => {
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props) {
                    if (prop._updateValue()) {
                        break;
                    }
                }
            }
            ReactiveProp.update();
        });
        this._element.addEventListener('input', () => {
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props) {
                    if (prop._updateValue()) {
                        break;
                    }
                }
            }
            ReactiveProp.update();
        });
    }
}

const reactiveElements: any = document.querySelectorAll('[r-reactive]');
if (reactiveElements) {
    for (const el of reactiveElements) {
        new ReactiveElement(el);
    }
}

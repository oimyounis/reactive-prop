class ReactiveProp {
    static _DEFINED = {};
    static update() {
        for (const key in ReactiveProp._DEFINED) {
            const prop: ReactiveProp = ReactiveProp._DEFINED[key];

            prop._updateBound();
        }
    }

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
        // else {
        //     this._bound.push(ReactiveProp._DEFINED[reactiveName]._element);
        // }

        ReactiveProp._DEFINED[reactiveName].bind(this);
    }

    getValue() {
        // let _value = this._element.attrib(this._prop);
        // if (_value === null) {
        //     _value = '';
        // }
        // this._value = _value;
        return this._value;
    }

    setValue(value) {
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
    }
    _updateValue() {
        this.setValue(this._element.attrib(this._prop));
    }

    bind(prop) {
        this._bound.push(prop);
    }

    _updateBound() {
        // this.updateValue();
        for (const prop of this._bound) {
            // element.setAttrib(this);
            prop.setValue(this._element.attrib(this._prop));
        }
        // for (const element of this._bound) {
        // this._element.setAttrib(this);
    }
}

class ReactiveElement {
    private _element = null;
    private _propList = {};

    constructor(selector) {
        if (typeof selector === 'string'){
            const el = document.querySelector(selector);

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

    setAttrib(prop) {
        const value = prop.getValue();

        for (const _prop of this._propList[prop._reactiveName]) {
            _prop.setValue(value);
        }
    }

    private _initEvents() {
        this._element.addEventListener('change', (e) => {
            // for (const key in this._propList) {
            //     const props = this._propList[key];
            //
            //     for (const prop of props) {
            //         prop._update();
            //     }
            // }
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props) {
                    prop._updateValue();
                }
            }
            ReactiveProp.update();
        });
        this._element.addEventListener('input', (e) => {
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props) {
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
    }
}

const reactiveElements = document.querySelectorAll('[ r-reactive]');
if (reactiveElements) {
    for (const el of reactiveElements) {
        new ReactiveElement(el);
    }
}

class ReactiveProp {
    private _element = null;
    private _definitionName = '';
    private _prop = '';
    private _reactiveName = '';
    private _value = '';

    constructor(element, definitionName: string, prop: string, reactiveName: string, initValue = '') {
        this._element = element;
        this._definitionName = definitionName;
        this._prop = prop;
        this._reactiveName = reactiveName;

        this.setValue(initValue);
    }

    getValue() {
        let _value = this._element.attrib(this._prop);
        if (_value === null) {
            _value = '';
        }
        this._value = _value;
        return this._value;
    }

    setValue(value) {
        this._value = value;
    }
}

class ReactiveElement {
    private _element = null;
    private _propList = {};

    constructor(selector: string) {
        const el = document.querySelector(selector);

        if (el === null) {
            throw `Element with selector "${selector}" does not exist`;
        }

        this._element = el;
        this._buildProps();
    }

    private _buildProps() {
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
                this._propList[reactiveName] = new ReactiveProp(this, name, propName, reactiveName, initValue);
                this._defineReactiveProp(reactiveName);

                this._element.attributes.removeNamedItem(name);
            }
        }
    }

    private _defineReactiveProp(reactiveName) {
        Object.defineProperty(this, reactiveName, {
            get: () => {
                const _rprop = this._propList[reactiveName];

                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }

                return this._propList[reactiveName].getValue();
            },
            set: (value) => {
                const _rprop = this._propList[reactiveName];

                if (_rprop === null) {
                    throw 'Tried to access a none existing reactive property';
                }

                this._propList[reactiveName].setValue(value);
            },
            enumerable: true,
            configurable: true
        });
    }

    attrib(name) {
        let _v = this._element.getAttribute(name);

        if (_v === null) {
           if (this._element[name] !== undefined) {
               _v = this._element[name];
           }
        }

        return _v;
    }
}
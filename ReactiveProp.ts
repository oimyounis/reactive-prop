class ReactiveProp {
    static _DEFINED = {};
    static update() {
        for (const key in ReactiveProp._DEFINED) {
            if (DashR._RESERVED.indexOf(key) !== -1)
                continue;

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
    private _external = null;

    constructor(element, definitionName: string, prop: string, reactiveName: string, initValue = '', external: ReactiveElement = null) {
        this._element = element;
        this._definitionName = definitionName;
        this._prop = prop;
        this._reactiveName = reactiveName;

        if (external) {
            this._external = external;
            this._origin = external;
        }

        if (this._element._app && this._element._app._defaults[reactiveName])
            initValue = this._element._app._defaults[reactiveName];

        this.setValue(initValue);

        if (reactiveName != '') {
            if (this._element._scoped) {
                if (DashR._DEFINED[this._element._app.getName()][reactiveName] === undefined)
                    DashR._DEFINED[this._element._app.getName()][reactiveName] = this;
                else
                    this._origin = DashR._DEFINED[this._element._app.getName()][reactiveName];

                DashR._DEFINED[this._element._app.getName()][reactiveName].bind(this);
            }
            else {
                if (ReactiveProp._DEFINED[reactiveName] === undefined)
                    ReactiveProp._DEFINED[reactiveName] = this;
                else
                    this._origin = ReactiveProp._DEFINED[reactiveName];

                ReactiveProp._DEFINED[reactiveName].bind(this);
            }
        }
    }

    getValue() {
        return this._value;
    }

    setValue(value) {
        if (this._definitionName === '-r')
            return;

        if (value === null && !this._external)
            return;

        const valueChanged = this._value != value || this._external;

        if (valueChanged) {
            this._value = value;
            this._origin && this._origin.setValue(this._value);
        }

        this._reflect(valueChanged);
    }

    private _reflect(valueChanged = true) {
        if (this._isDirective()) {
            this._handleDirective(valueChanged);
        }
        else {
            if (valueChanged) {
                if (this._element._element[this._prop] === undefined) {
                    this._element._element.setAttribute(this._prop, this._value);
                }
                else {
                    this._element._element[this._prop] = this._value;
                }
            }
        }
    }

    private _isDirective() {
        return ReactiveProp._DIRECTIVES.indexOf(this._prop) !== -1;
    }

    private _handleDirective(valueChanged = true) {
        if (this._prop === 'html' && valueChanged)
            this._element._element.innerHTML = this._value;
        else if (this._prop === 'text' && valueChanged)
            this._element._element.innerText = this._value;
        else if (this._prop === 'visible')
            if (Boolean(this._value) == true)
                this._element._element.style['display'] = '';
            else if (Boolean(this._value) == false)
                this._element._element.style['display'] = 'none';
    }

    _updateValue() {
        const val = this._element.attrib(this._prop);
        const changed = val != this._value;

        if (changed)
            this.setValue(val);

        return changed;
    }

    bind(prop) {
        if (!this._origin)
            this._bound.push(prop);
    }

    _updateBound() {
        if (this._origin)
            this._origin._updateBound();
        else
            for (const prop of this._bound)
                prop.setValue(this._value);
    }
}

class ReactiveElement {
    private _element = null;
    private _propList = {};

    private _bufferedProps = {};

    private _scoped = false;
    private _app = null;
    private _events = {};

    constructor(selector, app = null) {
        let el = null;
        if (typeof selector === 'string'){
            el = document.querySelector(selector);

            if (!el)
                throw `Element with selector "${selector}" does not exist`;
        }
        else {
            el = selector;
        }

        this._element = el;

        if (app) {
            this._scoped = app.isScoped();
            this._app = app;
        }

        this._mapProps();
        this._initEvents();
    }

    private _mapProps() {
        const propMapCopy = { ...this._element.attributes };
        propMapCopy.length = Object.keys(propMapCopy).length;

        for (const prop of propMapCopy) {
            const name = prop.name;
            const reactiveName = prop.value;

            const initial = name.substr(0, 1);

            if (initial === ':') {
                const propName = name.substr(1);

                let initValue = this._element.getAttribute(propName);

                if (initValue === null)
                    initValue = '';

                let propObj = null;

                if (reactiveName.indexOf('.') !== -1) {
                    const parts = reactiveName.split('.');
                    if (parts[0] === '$apps') {
                        if (DashR._DEFINED[parts[1]] !== undefined) {
                            const externalProp = DashR._DEFINED[parts[1]][parts[2]];

                            if (!externalProp)
                                throw "External property does not exist";

                            propObj = new ReactiveProp(this, name, propName, reactiveName, externalProp.getValue(), externalProp);
                            externalProp.bind(propObj);
                        }
                        else {
                            this._bufferedProps[parts[1]] = {
                                propReactiveName: parts[2],
                                name: name,
                                reactiveName: reactiveName,
                                propName: propName
                            };
                        }
                    }
                }
                else {
                    propObj = new ReactiveProp(this, name, propName, reactiveName, initValue);
                }

                if (propObj) {
                    if (this._propList[reactiveName] === undefined)
                        this._propList[reactiveName] = [];

                    this._propList[reactiveName].push(propObj);

                    this._defineReactiveProp(reactiveName);

                    this._element.attributes.removeNamedItem(name);
                }
            }
            else if (initial === '@') {
                const eventName = name.substr(1);
                this._events[eventName] = reactiveName;

                this._bindEvent(eventName, reactiveName);
            }

            if (name === '-r')
                this._element.attributes.removeNamedItem('-r');
        }
    }

    private _bindEvent(eventName, methodName) {
        if (DashR._methods[methodName]) {

        }
    }

    private _updateExternalProps() {
        const copy = {...this._bufferedProps};
        for (const app in copy) {
            const conf = copy[app];

            if (conf) {
                if (DashR._DEFINED[app]) {
                    const externalProp = DashR._DEFINED[app][conf.propReactiveName];

                    if (!externalProp)
                        throw "External property does not exist";

                    const propObj = new ReactiveProp(this, conf.name, conf.propName, conf.reactiveName, externalProp.getValue(), externalProp);
                    externalProp.bind(propObj);

                    if (this._propList[conf.reactiveName] === undefined)
                        this._propList[conf.reactiveName] = []

                    this._propList[conf.reactiveName].push(propObj);

                    this._defineReactiveProp(conf.reactiveName);

                    this._element.attributes.removeNamedItem(conf.name);

                    delete this._bufferedProps[app];
                }
            }
        }
    }

    private _defineReactiveProp(reactiveName) {
        Object.defineProperty(this, reactiveName, {
            get: () => {
                let _rprop: ReactiveProp = null;

                if (this._scoped)
                    _rprop = DashR._DEFINED[this._app.getName()][reactiveName];
                else
                    _rprop = ReactiveProp._DEFINED[reactiveName];

                if (_rprop === null)
                    throw 'Tried to access a none existing reactive property';

                return _rprop.getValue();
            },
            set: (value) => {
                let _rprop: ReactiveProp = null;

                if (this._scoped)
                    _rprop = DashR._DEFINED[this._app.getName()][reactiveName];
                else
                    _rprop = ReactiveProp._DEFINED[reactiveName];

                if (_rprop === null)
                    throw 'Tried to access a none existing reactive property';

                if (value != _rprop.getValue()){
                    _rprop.setValue(value);
                    _rprop._updateBound();
                }
            },
            enumerable: true,
            configurable: true
        });
    }

    attrib(name) {
        let _v = this._element[name];

        if (_v === undefined)
            _v = this._element.getAttribute(name);

        return _v;
    }

    private _initEvents() {
        this._element.addEventListener('change', () => {
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props)
                    if (prop._updateValue())
                        break;
            }

            if (this._scoped)
                DashR.update(this._app.getName());
            else
                ReactiveProp.update();
        });
        this._element.addEventListener('input', () => {
            for (const key in this._propList) {
                const props = this._propList[key];

                for (const prop of props)
                    if (prop._updateValue())
                        break;
            }

            if (this._scoped)
                DashR.update(this._app.getName());
            else
                ReactiveProp.update();
        });
    }
}

interface AppOptions extends Object {
    name?: string;
    main?: Function;
    loaded?: Function;
    el: string;
    scoped?: boolean;
    defaults?: any;
    methods?: Object;
}

class DashR {
    private name: string = '__app_' + Math.random().toString().slice(2, 8);
    private _main: Function = null;
    private _elSelector = '';
    private _scoped = false;
    private _defaults = {};
    static _methods = {};

    private _relements = [];

    static _RESERVED = ['__instance__'];
    static _DEFINED = {};

    static update(appName) {
        for (const key in DashR._DEFINED[appName]) {
            if (DashR._RESERVED.indexOf(key) !== -1)
                continue;

            const prop: ReactiveProp = DashR._DEFINED[appName][key];
            prop._updateBound();
        }
    }
    static globalUpdate(name) {
        const keys = Object.keys(DashR._DEFINED).reverse();
        for (const key of keys) {
            const app: DashR = DashR._DEFINED[key].__instance__;

            if (app)
                for (const el of app._relements)
                    el._updateExternalProps();
        }

        ReactiveProp.update();

        for (const appName in DashR._DEFINED) {
            for (const key in DashR._DEFINED[appName]) {
                if (DashR._RESERVED.indexOf(key) !== -1)
                    continue;

                const prop: ReactiveProp = DashR._DEFINED[appName][key];
                prop._updateBound();
            }
        }
    }

    $props = {};
    $apps = {};

    constructor(opts: AppOptions = {}) {
        // if (!opts.hasOwnProperty('main'))
        //     throw 'No main function provided';

        if (!opts.hasOwnProperty('el'))
            opts.el = 'body';

        if (!document.querySelector(opts.el))
            throw "Provided root element does not exist";

        if (opts.hasOwnProperty('name'))
            this.name = opts.name;

        this._elSelector = opts.el;

        if (opts.hasOwnProperty('scoped'))
            this._scoped = Boolean(opts.scoped);

        if (opts.hasOwnProperty('defaults')) {
            const defType = typeof opts.defaults;

            if (defType === 'object')
                this._defaults = opts.defaults;
            else if (defType === 'function')
                this._defaults = opts.defaults.call(this);
        }

        DashR._methods[this.name] = {};
        if (opts.hasOwnProperty('methods'))
            DashR._methods[this.name] = opts.methods;

        this._init();

        if (opts.hasOwnProperty('main')) {
            const appFunc: Function = opts.main;
            appFunc.call(this);
            this._main = appFunc;
        }

        DashR.globalUpdate(this.getName()); // TODO: try to move this line up the main func call
    }

    private _init() {
        if (this._scoped)
            this._registerApp();

        const el = document.querySelector(this._elSelector);
        const code = el.innerHTML;
        let matches = [];

        el.innerHTML = code.replace(/\{\{(.+)\}\}/g, (match, group, index)=>{
            const textNode = document.createElement('span')
            textNode.setAttribute(':text', group);
            const reactiveId = 'r-' + Math.random().toString(26).slice(2);
            textNode.setAttribute(reactiveId, '');
            textNode.classList.add('dashr-ref')
            matches.push(reactiveId);
            return textNode.outerHTML;
        });

        const reactiveElements: any = document.querySelectorAll(this._elSelector + ' [-r]');
        if (reactiveElements) {
            for (const el of reactiveElements)
                this._relements.push(new ReactiveElement(el, this));
            for (const el of matches){
                this._relements.push(new ReactiveElement(`[${el}]`, this));
            }

            if (this._scoped){
                for (const key in DashR._DEFINED[this.name]) {
                    const prop: ReactiveProp = DashR._DEFINED[this.name][key];

                    this._defineReactiveProp(key, prop);
                }
            }
            else {
                for (const key in ReactiveProp._DEFINED) {
                    const prop: ReactiveProp = ReactiveProp._DEFINED[key];

                    this._defineReactiveProp(key, prop);
                }
            }
        }
    }

    private _defineReactiveProp(reactiveName, reactiveProp) {
        Object.defineProperty(this.$props, reactiveName, {
            get: () => {
                const _rprop: ReactiveProp = reactiveProp;

                if (_rprop === null)
                    throw 'Tried to access a none existing reactive property';

                return _rprop.getValue();
            },
            set: (value) => {
                const _rprop: ReactiveProp = reactiveProp;

                if (_rprop === null)
                    throw 'Tried to access a none existing reactive property';

                if (value != _rprop.getValue()){
                    _rprop.setValue(value);
                    _rprop._updateBound();
                }
            },
            enumerable: true,
            configurable: true
        });
    }

    private _registerApp() {
        DashR._DEFINED[this.name] = {};
        DashR._DEFINED[this.name].__instance__ = this;

        Object.defineProperty(this, '$apps', {
            get: () => {
                let apps = {};

                for (const key in DashR._DEFINED)
                    apps[key] = DashR._DEFINED[key].__instance__;

                return apps;
            }
        });
    }

    get $app() {
        return this;
    }

    getName() {
        return this.name;
    }

    isScoped() {
        return this._scoped;
    }
}

// const reactiveElements: any = document.querySelectorAll('[-r]');
// if (reactiveElements) {
//     for (const el of reactiveElements) {
//         new ReactiveElement(el);
//     }
// }


/*
DIRECTIVES:
- -r: defined reactive element
- :{attribute_name}: binds an attribute

GLOBAL PROPERTIES:
- $props.{prop_name}
- $apps.{app_name}
*/

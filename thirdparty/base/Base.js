/**
 * Using fork:
 * https://github.com/kcmoot/Base.js-Fork/blob/master/build/base.js
 */
(function (root, factory) {
    /*
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], function () {
            return (root.returnExportsGlobal = factory());
        });
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
    */
        root['Base'] = factory();
    /*
    }
    */
}(this, function () {

    /**
     *   Base.js, version 1.1a
     *   Copyright 2006-2010, Dean Edwards
     *   License: http://www.opensource.org/licenses/mit-license.php
     *
     *   Modified by the Nerdery for improved performance and various bugfixes
     */

    /**
     * Function type
     *
     * @type String
     * @ignore
     * @final
     */
    var TYPE_FUNCTION = 'function';

    /**
     * Object type
     *
     * @type String
     * @ignore
     * @final
     */
    var TYPE_OBJECT = 'object';

    /**
     * String type
     *
     * @type String
     * @ignore
     * @final
     */
    var TYPE_STRING = 'string';

    /**
     * Flag to determine if we are currently creating a clean prototype of a class
     *
     * @type Boolean
     * @private
     * @ignore
     */
    var _prototyping = false;

    /**
     * Method to extend manually - do not do automatically
     *
     * @type Array
     * @private
     * @ignore
     */
    var _hiddenMethods = ['constructor', 'toString', 'valueOf'];

    /**
     * Lenth of hidden methods array
     *
     * @type Number
     * @private
     * @ignore
     */
    var _hiddenMethodsLength = _hiddenMethods.length;

    /**
     * Regex to find any calls to a parent method
     *
     * @type RegExp
     * @private
     * @ignore
     */
    var _superMethodRegex = /\bbase\b/;

    /**
     * Blank function
     *
     * @type Function
     * @private
     * @ignore
     */
    var _blankFunction = function() {};

    /**
     * Prototype default values. When extending methods, if both sources have these values, do not copy them.
     *
     * @type Object
     * @private
     * @ignore
     */
    var _prototypeDefaults = { toSource: null, base: _blankFunction };

    /**
     * BaseLib class
     *
     * A library to create a more traditional OOP interface for developers to work with
     *
     * @class Lib.Base.Base
     *
     * @constructor
     */
    var Base = function() {};

    /**
     * Subclass a class
     *
     * @method extend
     * @param {Object} [instanceMethods] Instance members/methods
     * @param {Object} [staticMethods] Static members/methods
     * @return {Function}
     * @static
     */
    Base.extend = function(instanceMethods, staticMethods) { // subclass
        var extend = Base.prototype.extend;

        // build the prototype
        _prototyping = true;

        var proto = new this();
        extend.call(proto, instanceMethods);

        // call this method from any other method to invoke that method's ancestor
        proto.base = _prototypeDefaults.base;

        _prototyping = false;

        // create the wrapper for the constructor function
        var constructor = proto.constructor;
        var klass = proto.constructor = function() {
            if (!_prototyping) {
                // instantiation
                if (this && (this._constructing || this.constructor === klass)) {
                    this._constructing = true;
                    constructor.apply(this, arguments);
                    this._constructing = false;

                    // casting
                } else if (arguments.length) {
                    Base.cast.apply(klass, arguments);
                }
            }
        };
        // build the class interface
        extend.call(klass, this);
        klass.ancestor = this;
        klass.prototype = proto;

        /**
         * Return original method
         *
         * @method valueOf
         * @param {String} [type]
         * @return Function
         * @static
         */
        klass.valueOf = function(type) {
            return (type === TYPE_OBJECT) ? klass : constructor.valueOf();
        };
        extend.call(klass, staticMethods);

        // if static init method exists, call it
        if (typeof klass.init === TYPE_FUNCTION) {
            klass.init();
        }

        return klass;
    };

    /**
     * @method extend
     * @param {String|Object} source
     * @param {Function} [value]
     * @chainable
     */
    Base.prototype.extend = function(source, value) {
        // extending with a name/value pair
        if (typeof source === TYPE_STRING && arguments.length > 1) {
            var ancestor = this[source];
            if (
                ancestor &&
                    // overriding a method?
                (typeof value === TYPE_FUNCTION) &&
                    // the valueOf() comparison is to avoid circular references
                (!ancestor.valueOf || ancestor.valueOf() !== value.valueOf()) &&
                _superMethodRegex.test(value)
            ) {
                // get the underlying method
                var method = value.valueOf();

                // override
                value = function() {
                    var returnValue;
                    var previous = this.base || _prototypeDefaults.base;
                    this.base = ancestor;
                    if (arguments.length === 0) {
                        returnValue = method.call(this);
                    } else {
                        returnValue = method.apply(this, arguments);
                    }
                    this.base = previous;
                    return returnValue;
                };

                // point to the underlying method
                value.valueOf = function(type) {
                    return (type === TYPE_OBJECT) ? value : method;
                };
                value.toString = Base.toString;
            }
            this[source] = value;

            // extending with an object literal
        } else if (source) {
            var extend = Base.prototype.extend;

            // if this object has a customised extend method then use it
            if (!_prototyping && typeof this !== TYPE_FUNCTION) {
                extend = this.extend || extend;
            }

            // do hidden methods separately
            // if we are prototyping then include the constructor
            var i = _prototyping ? 0 : 1;
            var key;
            for (; i < _hiddenMethodsLength; i++) {
                key = _hiddenMethods[i];
                if (source[key] !== _prototypeDefaults[key]) {
                    extend.call(this, key, source[key]);
                }
            }

            // copy each of the source object's properties to this object
            for (key in source) {
                if (!_prototypeDefaults[key]) {
                    extend.call(this, key, source[key]);
                }
            }
        }

        return this;
    };

    // initialise
    Base = Base.extend({

        /**
         * Default static base method
         *
         * @method base
         * @ignore
         */
        base: _prototypeDefaults.base

    }, {

        /**
         * Parent object/class
         *
         * @property ancestor
         * @type Object
         * @static
         * @ignore
         */
        ancestor: Object,

        /**
         * Base.js version
         *
         * @property version
         * @type String
         * @static
         * @ignore
         */
        version: '1.1',

        /**
         * Extend current class into another object or class.
         *
         * If an object with no prototype is passed, only prototype methods
         * will be cast EXCEPT for the constructor.
         *
         * If an a class (with constructor) is passed, both static and
         * prototype methods will be cast EXCEPT for the constructor.
         *
         * @method cast
         * @param {Object|Function} class* Classes or objects to cast
         * @chainable
         * @static
         */
        cast: function() {
            var i = 0;
            var length = arguments.length;
            var extend;
            var caster;

            for (; i < length; i++) {
                caster = arguments[i];
                extend = caster.extend || Base.prototype.extend;

                // cast prototype and static methods
                if (typeof caster === TYPE_FUNCTION) {
                    extend = caster.prototype.extend || Base.prototype.extend;
                    extend.call(caster.prototype, this.prototype);
                    extend.call(caster, this);
                    caster.ancestor = this;

                    // cast only prototype methods
                } else {
                    extend.call(caster, this.prototype);
                }
            }

            return this;
        },

        /**
         * Implement a class into the current class.
         *
         * All prototype and static properties will be extended into
         * `this` EXCEPT for the constructor.
         *
         * @method implement
         * @param {Object|Function} class* Classes or objects to cast
         * @chainable
         * @static
         */
        implement: function() {
            for (var i = 0; i < arguments.length; i++) {
                this.cast.call(arguments[i], this);
            }

            return this;
        },

        /**
         * Get string value of class
         *
         * @method toString
         * @return String
         * @static
         */
        toString: function() {
            return this.valueOf() + '';
        }

    });

    return Base;


}));
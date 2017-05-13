(function () {
'use strict';

function VNode() {}

var options = {};

const stack = [];

const EMPTY_CHILDREN = [];

function h(nodeName, attributes) {
	let children = EMPTY_CHILDREN,
	    lastSimple,
	    child,
	    simple,
	    i;
	for (i = arguments.length; i-- > 2;) {
		stack.push(arguments[i]);
	}
	if (attributes && attributes.children != null) {
		if (!stack.length) stack.push(attributes.children);
		delete attributes.children;
	}
	while (stack.length) {
		if ((child = stack.pop()) && child.pop !== undefined) {
			for (i = child.length; i--;) stack.push(child[i]);
		} else {
			if (child === true || child === false) child = null;

			if (simple = typeof nodeName !== 'function') {
				if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
			}

			if (simple && lastSimple) {
				children[children.length - 1] += child;
			} else if (children === EMPTY_CHILDREN) {
				children = [child];
			} else {
				children.push(child);
			}

			lastSimple = simple;
		}
	}

	let p = new VNode();
	p.nodeName = nodeName;
	p.children = children;
	p.attributes = attributes == null ? undefined : attributes;
	p.key = attributes == null ? undefined : attributes.key;

	if (options.vnode !== undefined) options.vnode(p);

	return p;
}

function extend(obj, props) {
  for (let i in props) obj[i] = props[i];
  return obj;
}

const NO_RENDER = 0;
const SYNC_RENDER = 1;
const FORCE_RENDER = 2;
const ASYNC_RENDER = 3;

const ATTR_KEY = '__preactattr_';

const IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;

let items = [];

function enqueueRender(component) {
	if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
		(options.debounceRendering || setTimeout)(rerender);
	}
}

function rerender() {
	let p,
	    list = items;
	items = [];
	while (p = list.pop()) {
		if (p._dirty) renderComponent(p);
	}
}

function isSameNodeType(node, vnode, hydrating) {
	if (typeof vnode === 'string' || typeof vnode === 'number') {
		return node.splitText !== undefined;
	}
	if (typeof vnode.nodeName === 'string') {
		return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
	}
	return hydrating || node._componentConstructor === vnode.nodeName;
}

function isNamedNode(node, nodeName) {
	return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

function getNodeProps(vnode) {
	let props = extend({}, vnode.attributes);
	props.children = vnode.children;

	let defaultProps = vnode.nodeName.defaultProps;
	if (defaultProps !== undefined) {
		for (let i in defaultProps) {
			if (props[i] === undefined) {
				props[i] = defaultProps[i];
			}
		}
	}

	return props;
}

function createNode(nodeName, isSvg) {
	let node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
	node.normalizedNodeName = nodeName;
	return node;
}

function removeNode(node) {
	if (node.parentNode) node.parentNode.removeChild(node);
}

function setAccessor(node, name, old, value, isSvg) {
	if (name === 'className') name = 'class';

	if (name === 'key') {} else if (name === 'ref') {
		if (old) old(null);
		if (value) value(node);
	} else if (name === 'class' && !isSvg) {
		node.className = value || '';
	} else if (name === 'style') {
		if (!value || typeof value === 'string' || typeof old === 'string') {
			node.style.cssText = value || '';
		}
		if (value && typeof value === 'object') {
			if (typeof old !== 'string') {
				for (let i in old) if (!(i in value)) node.style[i] = '';
			}
			for (let i in value) {
				node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
			}
		}
	} else if (name === 'dangerouslySetInnerHTML') {
		if (value) node.innerHTML = value.__html || '';
	} else if (name[0] == 'o' && name[1] == 'n') {
		let useCapture = name !== (name = name.replace(/Capture$/, ''));
		name = name.toLowerCase().substring(2);
		if (value) {
			if (!old) node.addEventListener(name, eventProxy, useCapture);
		} else {
			node.removeEventListener(name, eventProxy, useCapture);
		}
		(node._listeners || (node._listeners = {}))[name] = value;
	} else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
		setProperty(node, name, value == null ? '' : value);
		if (value == null || value === false) node.removeAttribute(name);
	} else {
		let ns = isSvg && name !== (name = name.replace(/^xlink\:?/, ''));
		if (value == null || value === false) {
			if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
		} else if (typeof value !== 'function') {
			if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
		}
	}
}

function setProperty(node, name, value) {
	try {
		node[name] = value;
	} catch (e) {}
}

function eventProxy(e) {
	return this._listeners[e.type](options.event && options.event(e) || e);
}

const mounts = [];

let diffLevel = 0;

let isSvgMode = false;

let hydrating = false;

function flushMounts() {
	let c;
	while (c = mounts.pop()) {
		if (options.afterMount) options.afterMount(c);
		if (c.componentDidMount) c.componentDidMount();
	}
}

function diff(dom, vnode, context, mountAll, parent, componentRoot) {
	if (!diffLevel++) {
		isSvgMode = parent != null && parent.ownerSVGElement !== undefined;

		hydrating = dom != null && !(ATTR_KEY in dom);
	}

	let ret = idiff(dom, vnode, context, mountAll, componentRoot);

	if (parent && ret.parentNode !== parent) parent.appendChild(ret);

	if (! --diffLevel) {
		hydrating = false;

		if (!componentRoot) flushMounts();
	}

	return ret;
}

function idiff(dom, vnode, context, mountAll, componentRoot) {
	let out = dom,
	    prevSvgMode = isSvgMode;

	if (vnode == null) vnode = '';

	if (typeof vnode === 'string') {
		if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
			if (dom.nodeValue != vnode) {
				dom.nodeValue = vnode;
			}
		} else {
			out = document.createTextNode(vnode);
			if (dom) {
				if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
				recollectNodeTree(dom, true);
			}
		}

		out[ATTR_KEY] = true;

		return out;
	}

	if (typeof vnode.nodeName === 'function') {
		return buildComponentFromVNode(dom, vnode, context, mountAll);
	}

	isSvgMode = vnode.nodeName === 'svg' ? true : vnode.nodeName === 'foreignObject' ? false : isSvgMode;

	if (!dom || !isNamedNode(dom, String(vnode.nodeName))) {
		out = createNode(String(vnode.nodeName), isSvgMode);

		if (dom) {
			while (dom.firstChild) out.appendChild(dom.firstChild);

			if (dom.parentNode) dom.parentNode.replaceChild(out, dom);

			recollectNodeTree(dom, true);
		}
	}

	let fc = out.firstChild,
	    props = out[ATTR_KEY] || (out[ATTR_KEY] = {}),
	    vchildren = vnode.children;

	if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
		if (fc.nodeValue != vchildren[0]) {
			fc.nodeValue = vchildren[0];
		}
	} else if (vchildren && vchildren.length || fc != null) {
			innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
		}

	diffAttributes(out, vnode.attributes, props);

	isSvgMode = prevSvgMode;

	return out;
}

function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
	let originalChildren = dom.childNodes,
	    children = [],
	    keyed = {},
	    keyedLen = 0,
	    min = 0,
	    len = originalChildren.length,
	    childrenLen = 0,
	    vlen = vchildren ? vchildren.length : 0,
	    j,
	    c,
	    vchild,
	    child;

	if (len !== 0) {
		for (let i = 0; i < len; i++) {
			let child = originalChildren[i],
			    props = child[ATTR_KEY],
			    key = vlen && props ? child._component ? child._component.__key : props.key : null;
			if (key != null) {
				keyedLen++;
				keyed[key] = child;
			} else if (props || (child.splitText !== undefined ? isHydrating ? child.nodeValue.trim() : true : isHydrating)) {
				children[childrenLen++] = child;
			}
		}
	}

	if (vlen !== 0) {
		for (let i = 0; i < vlen; i++) {
			vchild = vchildren[i];
			child = null;

			let key = vchild.key;
			if (key != null) {
				if (keyedLen && keyed[key] !== undefined) {
					child = keyed[key];
					keyed[key] = undefined;
					keyedLen--;
				}
			} else if (!child && min < childrenLen) {
					for (j = min; j < childrenLen; j++) {
						if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
							child = c;
							children[j] = undefined;
							if (j === childrenLen - 1) childrenLen--;
							if (j === min) min++;
							break;
						}
					}
				}

			child = idiff(child, vchild, context, mountAll);

			if (child && child !== dom) {
				if (i >= len) {
					dom.appendChild(child);
				} else if (child !== originalChildren[i]) {
					if (child === originalChildren[i + 1]) {
						removeNode(originalChildren[i]);
					} else {
						dom.insertBefore(child, originalChildren[i] || null);
					}
				}
			}
		}
	}

	if (keyedLen) {
		for (let i in keyed) if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
	}

	while (min <= childrenLen) {
		if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
	}
}

function recollectNodeTree(node, unmountOnly) {
	let component = node._component;
	if (component) {
		unmountComponent(component);
	} else {
		if (node[ATTR_KEY] != null && node[ATTR_KEY].ref) node[ATTR_KEY].ref(null);

		if (unmountOnly === false || node[ATTR_KEY] == null) {
			removeNode(node);
		}

		removeChildren(node);
	}
}

function removeChildren(node) {
	node = node.lastChild;
	while (node) {
		let next = node.previousSibling;
		recollectNodeTree(node, true);
		node = next;
	}
}

function diffAttributes(dom, attrs, old) {
	let name;

	for (name in old) {
		if (!(attrs && attrs[name] != null) && old[name] != null) {
			setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
		}
	}

	for (name in attrs) {
		if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
			setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
		}
	}
}

const components = {};

function collectComponent(component) {
	let name = component.constructor.name;
	(components[name] || (components[name] = [])).push(component);
}

function createComponent(Ctor, props, context) {
	let list = components[Ctor.name],
	    inst;

	if (Ctor.prototype && Ctor.prototype.render) {
		inst = new Ctor(props, context);
		Component.call(inst, props, context);
	} else {
		inst = new Component(props, context);
		inst.constructor = Ctor;
		inst.render = doRender;
	}

	if (list) {
		for (let i = list.length; i--;) {
			if (list[i].constructor === Ctor) {
				inst.nextBase = list[i].nextBase;
				list.splice(i, 1);
				break;
			}
		}
	}
	return inst;
}

function doRender(props, state, context) {
	return this.constructor(props, context);
}

function setComponentProps(component, props, opts, context, mountAll) {
	if (component._disable) return;
	component._disable = true;

	if (component.__ref = props.ref) delete props.ref;
	if (component.__key = props.key) delete props.key;

	if (!component.base || mountAll) {
		if (component.componentWillMount) component.componentWillMount();
	} else if (component.componentWillReceiveProps) {
		component.componentWillReceiveProps(props, context);
	}

	if (context && context !== component.context) {
		if (!component.prevContext) component.prevContext = component.context;
		component.context = context;
	}

	if (!component.prevProps) component.prevProps = component.props;
	component.props = props;

	component._disable = false;

	if (opts !== NO_RENDER) {
		if (opts === SYNC_RENDER || options.syncComponentUpdates !== false || !component.base) {
			renderComponent(component, SYNC_RENDER, mountAll);
		} else {
			enqueueRender(component);
		}
	}

	if (component.__ref) component.__ref(component);
}

function renderComponent(component, opts, mountAll, isChild) {
	if (component._disable) return;

	let props = component.props,
	    state = component.state,
	    context = component.context,
	    previousProps = component.prevProps || props,
	    previousState = component.prevState || state,
	    previousContext = component.prevContext || context,
	    isUpdate = component.base,
	    nextBase = component.nextBase,
	    initialBase = isUpdate || nextBase,
	    initialChildComponent = component._component,
	    skip = false,
	    rendered,
	    inst,
	    cbase;

	if (isUpdate) {
		component.props = previousProps;
		component.state = previousState;
		component.context = previousContext;
		if (opts !== FORCE_RENDER && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
			skip = true;
		} else if (component.componentWillUpdate) {
			component.componentWillUpdate(props, state, context);
		}
		component.props = props;
		component.state = state;
		component.context = context;
	}

	component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
	component._dirty = false;

	if (!skip) {
		rendered = component.render(props, state, context);

		if (component.getChildContext) {
			context = extend(extend({}, context), component.getChildContext());
		}

		let childComponent = rendered && rendered.nodeName,
		    toUnmount,
		    base;

		if (typeof childComponent === 'function') {

			let childProps = getNodeProps(rendered);
			inst = initialChildComponent;

			if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
				setComponentProps(inst, childProps, SYNC_RENDER, context, false);
			} else {
				toUnmount = inst;

				component._component = inst = createComponent(childComponent, childProps, context);
				inst.nextBase = inst.nextBase || nextBase;
				inst._parentComponent = component;
				setComponentProps(inst, childProps, NO_RENDER, context, false);
				renderComponent(inst, SYNC_RENDER, mountAll, true);
			}

			base = inst.base;
		} else {
			cbase = initialBase;

			toUnmount = initialChildComponent;
			if (toUnmount) {
				cbase = component._component = null;
			}

			if (initialBase || opts === SYNC_RENDER) {
				if (cbase) cbase._component = null;
				base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
			}
		}

		if (initialBase && base !== initialBase && inst !== initialChildComponent) {
			let baseParent = initialBase.parentNode;
			if (baseParent && base !== baseParent) {
				baseParent.replaceChild(base, initialBase);

				if (!toUnmount) {
					initialBase._component = null;
					recollectNodeTree(initialBase, false);
				}
			}
		}

		if (toUnmount) {
			unmountComponent(toUnmount);
		}

		component.base = base;
		if (base && !isChild) {
			let componentRef = component,
			    t = component;
			while (t = t._parentComponent) {
				(componentRef = t).base = base;
			}
			base._component = componentRef;
			base._componentConstructor = componentRef.constructor;
		}
	}

	if (!isUpdate || mountAll) {
		mounts.unshift(component);
	} else if (!skip) {
		flushMounts();

		if (component.componentDidUpdate) {
			component.componentDidUpdate(previousProps, previousState, previousContext);
		}
		if (options.afterUpdate) options.afterUpdate(component);
	}

	if (component._renderCallbacks != null) {
		while (component._renderCallbacks.length) component._renderCallbacks.pop().call(component);
	}

	if (!diffLevel && !isChild) flushMounts();
}

function buildComponentFromVNode(dom, vnode, context, mountAll) {
	let c = dom && dom._component,
	    originalComponent = c,
	    oldDom = dom,
	    isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
	    isOwner = isDirectOwner,
	    props = getNodeProps(vnode);
	while (c && !isOwner && (c = c._parentComponent)) {
		isOwner = c.constructor === vnode.nodeName;
	}

	if (c && isOwner && (!mountAll || c._component)) {
		setComponentProps(c, props, ASYNC_RENDER, context, mountAll);
		dom = c.base;
	} else {
		if (originalComponent && !isDirectOwner) {
			unmountComponent(originalComponent);
			dom = oldDom = null;
		}

		c = createComponent(vnode.nodeName, props, context);
		if (dom && !c.nextBase) {
			c.nextBase = dom;

			oldDom = null;
		}
		setComponentProps(c, props, SYNC_RENDER, context, mountAll);
		dom = c.base;

		if (oldDom && dom !== oldDom) {
			oldDom._component = null;
			recollectNodeTree(oldDom, false);
		}
	}

	return dom;
}

function unmountComponent(component) {
	if (options.beforeUnmount) options.beforeUnmount(component);

	let base = component.base;

	component._disable = true;

	if (component.componentWillUnmount) component.componentWillUnmount();

	component.base = null;

	let inner = component._component;
	if (inner) {
		unmountComponent(inner);
	} else if (base) {
		if (base[ATTR_KEY] && base[ATTR_KEY].ref) base[ATTR_KEY].ref(null);

		component.nextBase = base;

		removeNode(base);
		collectComponent(component);

		removeChildren(base);
	}

	if (component.__ref) component.__ref(null);
}

function Component(props, context) {
	this._dirty = true;

	this.context = context;

	this.props = props;

	this.state = this.state || {};
}

extend(Component.prototype, {
	setState(state, callback) {
		let s = this.state;
		if (!this.prevState) this.prevState = extend({}, s);
		extend(s, typeof state === 'function' ? state(s, this.props) : state);
		if (callback) (this._renderCallbacks = this._renderCallbacks || []).push(callback);
		enqueueRender(this);
	},

	forceUpdate(callback) {
		if (callback) (this._renderCallbacks = this._renderCallbacks || []).push(callback);
		renderComponent(this, FORCE_RENDER);
	},

	render() {}

});

function render(vnode, parent, merge) {
  return diff(merge, vnode, {}, false, parent, false);
}

var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

var root = freeGlobal || freeSelf || Function('return this')();

var Symbol$1 = root.Symbol;

var objectProto$2 = Object.prototype;

var hasOwnProperty$2 = objectProto$2.hasOwnProperty;

var nativeObjectToString = objectProto$2.toString;

var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

function getRawTag(value) {
  var isOwn = hasOwnProperty$2.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

var objectProto$3 = Object.prototype;

var nativeObjectToString$1 = objectProto$3.toString;

function objectToString$1(value) {
  return nativeObjectToString$1.call(value);
}

var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString$1(value);
}

function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

var getPrototype$1 = overArg(Object.getPrototypeOf, Object);

function isObjectLike$1(value) {
  return value != null && typeof value == 'object';
}

var objectTag$1 = '[object Object]';

var funcProto = Function.prototype;
var objectProto$1 = Object.prototype;

var funcToString$1 = funcProto.toString;

var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

var objectCtorString$1 = funcToString$1.call(Object);

function isPlainObject$1(value) {
  if (!isObjectLike$1(value) || baseGetTag(value) != objectTag$1) {
    return false;
  }
  var proto = getPrototype$1(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty$1.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString$1.call(Ctor) == objectCtorString$1;
}

function symbolObservablePonyfill(root) {
	var result;
	var Symbol = root.Symbol;

	if (typeof Symbol === 'function') {
		if (Symbol.observable) {
			result = Symbol.observable;
		} else {
			result = Symbol('observable');
			Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
}

var root$2;

if (typeof self !== 'undefined') {
  root$2 = self;
} else if (typeof window !== 'undefined') {
  root$2 = window;
} else if (typeof global !== 'undefined') {
  root$2 = global;
} else if (typeof module !== 'undefined') {
  root$2 = module;
} else {
  root$2 = Function('return this')();
}

var result = symbolObservablePonyfill(root$2);

var ActionTypes = {
  INIT: '@@redux/INIT'
};

function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.');
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function getState() {
    return currentState;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    var isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      isSubscribed = false;

      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }

  function dispatch(action) {
    if (!isPlainObject$1(action)) {
      throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property. ' + 'Have you misspelled a constant?');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i]();
    }

    return action;
  }

  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }

    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object') {
          throw new TypeError('Expected the observer to be an object.');
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return { unsubscribe: unsubscribe };
      }
    }, _ref[result] = function () {
      return this;
    }, _ref;
  }

  dispatch({ type: ActionTypes.INIT });

  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[result] = observable, _ref2;
}

function warning$1(message) {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }

  try {
    throw new Error(message);
  } catch (e) {}
}

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + (actionCreators === null ? 'null' : typeof actionCreators) + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  var keys = Object.keys(actionCreators);
  var boundActionCreators = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var actionCreator = actionCreators[key];
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  var last = funcs[funcs.length - 1];
  var rest = funcs.slice(0, -1);
  return function () {
    return rest.reduceRight(function (composed, f) {
      return f(composed);
    }, last.apply(undefined, arguments));
  };
}

var _extends$1 = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }return target;
};

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function (reducer, preloadedState, enhancer) {
      var store = createStore(reducer, preloadedState, enhancer);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose.apply(undefined, chain)(store.dispatch);

      return _extends$1({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

function isCrushed() {}

if (true && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning$1('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}

var Children = {
  only: function only(children) {
    return children && children[0] || null;
  }
};

function proptype() {}
proptype.isRequired = proptype;

var PropTypes = {
  element: proptype,
  func: proptype,
  shape: function shape() {
    return proptype;
  },
  instanceOf: function instanceOf() {
    return proptype;
  }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var CLEARED = null;
var nullListeners = {
  notify: function notify() {}
};

function createListenerCollection() {
  var current = [];
  var next = [];

  return {
    clear: function clear() {
      next = CLEARED;
      current = CLEARED;
    },
    notify: function notify() {
      var listeners = current = next;
      for (var i = 0; i < listeners.length; i++) {
        listeners[i]();
      }
    },
    subscribe: function subscribe(listener) {
      var isSubscribed = true;
      if (next === current) next = current.slice();
      next.push(listener);

      return function unsubscribe() {
        if (!isSubscribed || current === CLEARED) return;
        isSubscribed = false;

        if (next === current) next = current.slice();
        next.splice(next.indexOf(listener), 1);
      };
    }
  };
}

var Subscription = function () {
  function Subscription(store, parentSub) {
    classCallCheck(this, Subscription);

    this.store = store;
    this.parentSub = parentSub;
    this.unsubscribe = null;
    this.listeners = nullListeners;
  }

  Subscription.prototype.addNestedSub = function addNestedSub(listener) {
    this.trySubscribe();
    return this.listeners.subscribe(listener);
  };

  Subscription.prototype.notifyNestedSubs = function notifyNestedSubs() {
    this.listeners.notify();
  };

  Subscription.prototype.isSubscribed = function isSubscribed() {
    return Boolean(this.unsubscribe);
  };

  Subscription.prototype.trySubscribe = function trySubscribe() {
    if (!this.unsubscribe) {
      this.unsubscribe = this.parentSub ? this.parentSub.addNestedSub(this.onStateChange) : this.store.subscribe(this.onStateChange);

      this.listeners = createListenerCollection();
    }
  };

  Subscription.prototype.tryUnsubscribe = function tryUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.listeners.clear();
      this.listeners = nullListeners;
    }
  };

  return Subscription;
}();

var storeShape = PropTypes.shape({
  subscribe: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired
});

function warning(message) {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }

  try {
    throw new Error(message);
  } catch (e) {}
}

var didWarnAboutReceivingStore = false;
function warnAboutReceivingStore() {
  if (didWarnAboutReceivingStore) {
    return;
  }
  didWarnAboutReceivingStore = true;

  warning('<Provider> does not support changing `store` on the fly. ' + 'It is most likely that you see this error because you updated to ' + 'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' + 'automatically. See https://github.com/reactjs/react-redux/releases/' + 'tag/v2.0.0 for the migration instructions.');
}

var Provider = function (_Component) {
  inherits(Provider, _Component);

  Provider.prototype.getChildContext = function getChildContext() {
    return { store: this.store, storeSubscription: null };
  };

  function Provider(props, context) {
    classCallCheck(this, Provider);

    var _this = possibleConstructorReturn(this, _Component.call(this, props, context));

    _this.store = props.store;
    return _this;
  }

  Provider.prototype.render = function render$$1() {
    return Children.only(this.props.children);
  };

  return Provider;
}(Component);

{
  Provider.prototype.componentWillReceiveProps = function (nextProps) {
    var store = this.store;
    var nextStore = nextProps.store;

    if (store !== nextStore) {
      warnAboutReceivingStore();
    }
  };
}

Provider.childContextTypes = {
  store: storeShape.isRequired,
  storeSubscription: PropTypes.instanceOf(Subscription)
};
Provider.displayName = 'Provider';

var REACT_STATICS = {
  childContextTypes: true,
  contextTypes: true,
  defaultProps: true,
  displayName: true,
  getDefaultProps: true,
  mixins: true,
  propTypes: true,
  type: true
};

var KNOWN_STATICS = {
  name: true,
  length: true,
  prototype: true,
  caller: true,
  arguments: true,
  arity: true
};

var isGetOwnPropertySymbolsAvailable = typeof Object.getOwnPropertySymbols === 'function';

var index = function hoistNonReactStatics(targetComponent, sourceComponent, customStatics) {
  if (typeof sourceComponent !== 'string') {
    var keys = Object.getOwnPropertyNames(sourceComponent);

    if (isGetOwnPropertySymbolsAvailable) {
      keys = keys.concat(Object.getOwnPropertySymbols(sourceComponent));
    }

    for (var i = 0; i < keys.length; ++i) {
      if (!REACT_STATICS[keys[i]] && !KNOWN_STATICS[keys[i]] && (!customStatics || !customStatics[keys[i]])) {
        try {
          targetComponent[keys[i]] = sourceComponent[keys[i]];
        } catch (error) {}
      }
    }
  }

  return targetComponent;
};

var invariant = function () {};

var hotReloadingVersion = 0;
function connectAdvanced(selectorFactory) {
  var _contextTypes, _childContextTypes;

  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var _ref$getDisplayName = _ref.getDisplayName;
  var getDisplayName = _ref$getDisplayName === undefined ? function (name) {
    return 'ConnectAdvanced(' + name + ')';
  } : _ref$getDisplayName;
  var _ref$methodName = _ref.methodName;
  var methodName = _ref$methodName === undefined ? 'connectAdvanced' : _ref$methodName;
  var _ref$renderCountProp = _ref.renderCountProp;
  var renderCountProp = _ref$renderCountProp === undefined ? undefined : _ref$renderCountProp;
  var _ref$shouldHandleStat = _ref.shouldHandleStateChanges;
  var shouldHandleStateChanges = _ref$shouldHandleStat === undefined ? true : _ref$shouldHandleStat;
  var _ref$storeKey = _ref.storeKey;
  var storeKey = _ref$storeKey === undefined ? 'store' : _ref$storeKey;
  var _ref$withRef = _ref.withRef;
  var withRef = _ref$withRef === undefined ? false : _ref$withRef;
  var connectOptions = objectWithoutProperties(_ref, ['getDisplayName', 'methodName', 'renderCountProp', 'shouldHandleStateChanges', 'storeKey', 'withRef']);

  var subscriptionKey = storeKey + 'Subscription';
  var version = hotReloadingVersion++;

  var contextTypes = (_contextTypes = {}, _contextTypes[storeKey] = storeShape, _contextTypes[subscriptionKey] = PropTypes.instanceOf(Subscription), _contextTypes);
  var childContextTypes = (_childContextTypes = {}, _childContextTypes[subscriptionKey] = PropTypes.instanceOf(Subscription), _childContextTypes);

  return function wrapWithConnect(WrappedComponent) {
    invariant(typeof WrappedComponent == 'function', 'You must pass a component to the function returned by ' + ('connect. Instead received ' + WrappedComponent));

    var wrappedComponentName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    var displayName = getDisplayName(wrappedComponentName);

    var selectorFactoryOptions = _extends({}, connectOptions, {
      getDisplayName: getDisplayName,
      methodName: methodName,
      renderCountProp: renderCountProp,
      shouldHandleStateChanges: shouldHandleStateChanges,
      storeKey: storeKey,
      withRef: withRef,
      displayName: displayName,
      wrappedComponentName: wrappedComponentName,
      WrappedComponent: WrappedComponent
    });

    var Connect = function (_Component) {
      inherits(Connect, _Component);

      function Connect(props, context) {
        classCallCheck(this, Connect);

        var _this = possibleConstructorReturn(this, _Component.call(this, props, context));

        _this.version = version;
        _this.state = {};
        _this.renderCount = 0;
        _this.store = _this.props[storeKey] || _this.context[storeKey];
        _this.parentSub = props[subscriptionKey] || context[subscriptionKey];

        _this.setWrappedInstance = _this.setWrappedInstance.bind(_this);

        invariant(_this.store, 'Could not find "' + storeKey + '" in either the context or ' + ('props of "' + displayName + '". ') + 'Either wrap the root component in a <Provider>, ' + ('or explicitly pass "' + storeKey + '" as a prop to "' + displayName + '".'));

        _this.getState = _this.store.getState.bind(_this.store);

        _this.initSelector();
        _this.initSubscription();
        return _this;
      }

      Connect.prototype.getChildContext = function getChildContext() {
        var _ref2;

        return _ref2 = {}, _ref2[subscriptionKey] = this.subscription || this.parentSub, _ref2;
      };

      Connect.prototype.componentDidMount = function componentDidMount() {
        if (!shouldHandleStateChanges) return;

        this.subscription.trySubscribe();
        this.selector.run(this.props);
        if (this.selector.shouldComponentUpdate) this.forceUpdate();
      };

      Connect.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
        this.selector.run(nextProps);
      };

      Connect.prototype.shouldComponentUpdate = function shouldComponentUpdate() {
        return this.selector.shouldComponentUpdate;
      };

      Connect.prototype.componentWillUnmount = function componentWillUnmount() {
        if (this.subscription) this.subscription.tryUnsubscribe();

        this.subscription = null;
        this.store = null;
        this.parentSub = null;
        this.selector.run = function () {};
      };

      Connect.prototype.getWrappedInstance = function getWrappedInstance() {
        invariant(withRef, 'To access the wrapped instance, you need to specify ' + ('{ withRef: true } in the options argument of the ' + methodName + '() call.'));
        return this.wrappedInstance;
      };

      Connect.prototype.setWrappedInstance = function setWrappedInstance(ref) {
        this.wrappedInstance = ref;
      };

      Connect.prototype.initSelector = function initSelector() {
        var dispatch = this.store.dispatch;
        var getState = this.getState;

        var sourceSelector = selectorFactory(dispatch, selectorFactoryOptions);

        var selector = this.selector = {
          shouldComponentUpdate: true,
          props: sourceSelector(getState(), this.props),
          run: function runComponentSelector(props) {
            try {
              var nextProps = sourceSelector(getState(), props);
              if (selector.error || nextProps !== selector.props) {
                selector.shouldComponentUpdate = true;
                selector.props = nextProps;
                selector.error = null;
              }
            } catch (error) {
              selector.shouldComponentUpdate = true;
              selector.error = error;
            }
          }
        };
      };

      Connect.prototype.initSubscription = function initSubscription() {
        var _this2 = this;

        if (shouldHandleStateChanges) {
          (function () {
            var subscription = _this2.subscription = new Subscription(_this2.store, _this2.parentSub);
            var dummyState = {};

            subscription.onStateChange = function onStateChange() {
              this.selector.run(this.props);

              if (!this.selector.shouldComponentUpdate) {
                subscription.notifyNestedSubs();
              } else {
                this.componentDidUpdate = function componentDidUpdate() {
                  this.componentDidUpdate = undefined;
                  subscription.notifyNestedSubs();
                };

                this.setState(dummyState);
              }
            }.bind(_this2);
          })();
        }
      };

      Connect.prototype.isSubscribed = function isSubscribed() {
        return Boolean(this.subscription) && this.subscription.isSubscribed();
      };

      Connect.prototype.addExtraProps = function addExtraProps(props) {
        if (!withRef && !renderCountProp) return props;

        var withExtras = _extends({}, props);
        if (withRef) withExtras.ref = this.setWrappedInstance;
        if (renderCountProp) withExtras[renderCountProp] = this.renderCount++;
        return withExtras;
      };

      Connect.prototype.render = function render$$1() {
        var selector = this.selector;
        selector.shouldComponentUpdate = false;

        if (selector.error) {
          throw selector.error;
        } else {
          return h(WrappedComponent, this.addExtraProps(selector.props));
        }
      };

      return Connect;
    }(Component);

    Connect.WrappedComponent = WrappedComponent;
    Connect.displayName = displayName;
    Connect.childContextTypes = childContextTypes;
    Connect.contextTypes = contextTypes;

    {
      Connect.prototype.componentWillUpdate = function componentWillUpdate() {
        if (this.version !== version) {
          this.version = version;
          this.initSelector();

          if (this.subscription) this.subscription.tryUnsubscribe();
          this.initSubscription();
          if (shouldHandleStateChanges) this.subscription.trySubscribe();
        }
      };
    }

    return index(Connect, WrappedComponent);
  };
}

var hasOwn = Object.prototype.hasOwnProperty;

function shallowEqual(a, b) {
  if (a === b) return true;

  var countA = 0;
  var countB = 0;

  for (var key in a) {
    if (hasOwn.call(a, key) && a[key] !== b[key]) return false;
    countA++;
  }

  for (var _key in b) {
    if (hasOwn.call(b, _key)) countB++;
  }

  return countA === countB;
}

var nativeGetPrototype = Object.getPrototypeOf;

function getPrototype(value) {
  return nativeGetPrototype(Object(value));
}

function isHostObject(value) {
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

function isObjectLike(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

var objectTag = '[object Object]';

var objectProto = Object.prototype;

var funcToString = Function.prototype.toString;

var hasOwnProperty = objectProto.hasOwnProperty;

var objectCtorString = funcToString.call(Object);

var objectToString = objectProto.toString;

function isPlainObject(value) {
  if (!isObjectLike(value) || objectToString.call(value) != objectTag || isHostObject(value)) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
}

function verifyPlainObject(value, displayName, methodName) {
  if (!isPlainObject(value)) {
    warning(methodName + '() in ' + displayName + ' must return a plain object. Instead received ' + value + '.');
  }
}

function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options$$1) {
    var constant = getConstant(dispatch, options$$1);

    function constantSelector() {
      return constant;
    }
    constantSelector.dependsOnOwnProps = false;
    return constantSelector;
  };
}

function getDependsOnOwnProps(mapToProps) {
  return mapToProps.dependsOnOwnProps !== null && mapToProps.dependsOnOwnProps !== undefined ? Boolean(mapToProps.dependsOnOwnProps) : mapToProps.length !== 1;
}

function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, _ref) {
    var displayName = _ref.displayName;

    var proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      return proxy.dependsOnOwnProps ? proxy.mapToProps(stateOrDispatch, ownProps) : proxy.mapToProps(stateOrDispatch);
    };

    proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps);

    proxy.mapToProps = function detectFactoryAndVerify(stateOrDispatch, ownProps) {
      proxy.mapToProps = mapToProps;
      var props = proxy(stateOrDispatch, ownProps);

      if (typeof props === 'function') {
        proxy.mapToProps = props;
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props);
        props = proxy(stateOrDispatch, ownProps);
      }

      verifyPlainObject(props, displayName, methodName);

      return props;
    };

    return proxy;
  };
}

function whenMapDispatchToPropsIsFunction(mapDispatchToProps) {
  return typeof mapDispatchToProps === 'function' ? wrapMapToPropsFunc(mapDispatchToProps, 'mapDispatchToProps') : undefined;
}

function whenMapDispatchToPropsIsMissing(mapDispatchToProps) {
  return !mapDispatchToProps ? wrapMapToPropsConstant(function (dispatch) {
    return { dispatch: dispatch };
  }) : undefined;
}

function whenMapDispatchToPropsIsObject(mapDispatchToProps) {
  return mapDispatchToProps && (typeof mapDispatchToProps === 'undefined' ? 'undefined' : _typeof(mapDispatchToProps)) === 'object' ? wrapMapToPropsConstant(function (dispatch) {
    return bindActionCreators(mapDispatchToProps, dispatch);
  }) : undefined;
}

var defaultMapDispatchToPropsFactories = [whenMapDispatchToPropsIsFunction, whenMapDispatchToPropsIsMissing, whenMapDispatchToPropsIsObject];

function whenMapStateToPropsIsFunction(mapStateToProps) {
  return typeof mapStateToProps === 'function' ? wrapMapToPropsFunc(mapStateToProps, 'mapStateToProps') : undefined;
}

function whenMapStateToPropsIsMissing(mapStateToProps) {
  return !mapStateToProps ? wrapMapToPropsConstant(function () {
    return {};
  }) : undefined;
}

var defaultMapStateToPropsFactories = [whenMapStateToPropsIsFunction, whenMapStateToPropsIsMissing];

function defaultMergeProps(stateProps, dispatchProps, ownProps) {
  return _extends({}, ownProps, stateProps, dispatchProps);
}

function wrapMergePropsFunc(mergeProps) {
  return function initMergePropsProxy(dispatch, _ref) {
    var displayName = _ref.displayName;
    var pure = _ref.pure;
    var areMergedPropsEqual = _ref.areMergedPropsEqual;

    var hasRunOnce = false;
    var mergedProps = void 0;

    return function mergePropsProxy(stateProps, dispatchProps, ownProps) {
      var nextMergedProps = mergeProps(stateProps, dispatchProps, ownProps);

      if (hasRunOnce) {
        if (!pure || !areMergedPropsEqual(nextMergedProps, mergedProps)) mergedProps = nextMergedProps;
      } else {
        hasRunOnce = true;
        mergedProps = nextMergedProps;

        verifyPlainObject(mergedProps, displayName, 'mergeProps');
      }

      return mergedProps;
    };
  };
}

function whenMergePropsIsFunction(mergeProps) {
  return typeof mergeProps === 'function' ? wrapMergePropsFunc(mergeProps) : undefined;
}

function whenMergePropsIsOmitted(mergeProps) {
  return !mergeProps ? function () {
    return defaultMergeProps;
  } : undefined;
}

var defaultMergePropsFactories = [whenMergePropsIsFunction, whenMergePropsIsOmitted];

function verify(selector, methodName, displayName) {
  if (!selector) {
    throw new Error('Unexpected value for ' + methodName + ' in ' + displayName + '.');
  } else if (methodName === 'mapStateToProps' || methodName === 'mapDispatchToProps') {
    if (!selector.hasOwnProperty('dependsOnOwnProps')) {
      warning('The selector for ' + methodName + ' of ' + displayName + ' did not specify a value for dependsOnOwnProps.');
    }
  }
}

function verifySubselectors(mapStateToProps, mapDispatchToProps, mergeProps, displayName) {
  verify(mapStateToProps, 'mapStateToProps', displayName);
  verify(mapDispatchToProps, 'mapDispatchToProps', displayName);
  verify(mergeProps, 'mergeProps', displayName);
}

function impureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch) {
  return function impureFinalPropsSelector(state, ownProps) {
    return mergeProps(mapStateToProps(state, ownProps), mapDispatchToProps(dispatch, ownProps), ownProps);
  };
}

function pureFinalPropsSelectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, _ref) {
  var areStatesEqual = _ref.areStatesEqual;
  var areOwnPropsEqual = _ref.areOwnPropsEqual;
  var areStatePropsEqual = _ref.areStatePropsEqual;

  var hasRunAtLeastOnce = false;
  var state = void 0;
  var ownProps = void 0;
  var stateProps = void 0;
  var dispatchProps = void 0;
  var mergedProps = void 0;

  function handleFirstCall(firstState, firstOwnProps) {
    state = firstState;
    ownProps = firstOwnProps;
    stateProps = mapStateToProps(state, ownProps);
    dispatchProps = mapDispatchToProps(dispatch, ownProps);
    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    hasRunAtLeastOnce = true;
    return mergedProps;
  }

  function handleNewPropsAndNewState() {
    stateProps = mapStateToProps(state, ownProps);

    if (mapDispatchToProps.dependsOnOwnProps) dispatchProps = mapDispatchToProps(dispatch, ownProps);

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }

  function handleNewProps() {
    if (mapStateToProps.dependsOnOwnProps) stateProps = mapStateToProps(state, ownProps);

    if (mapDispatchToProps.dependsOnOwnProps) dispatchProps = mapDispatchToProps(dispatch, ownProps);

    mergedProps = mergeProps(stateProps, dispatchProps, ownProps);
    return mergedProps;
  }

  function handleNewState() {
    var nextStateProps = mapStateToProps(state, ownProps);
    var statePropsChanged = !areStatePropsEqual(nextStateProps, stateProps);
    stateProps = nextStateProps;

    if (statePropsChanged) mergedProps = mergeProps(stateProps, dispatchProps, ownProps);

    return mergedProps;
  }

  function handleSubsequentCalls(nextState, nextOwnProps) {
    var propsChanged = !areOwnPropsEqual(nextOwnProps, ownProps);
    var stateChanged = !areStatesEqual(nextState, state);
    state = nextState;
    ownProps = nextOwnProps;

    if (propsChanged && stateChanged) return handleNewPropsAndNewState();
    if (propsChanged) return handleNewProps();
    if (stateChanged) return handleNewState();
    return mergedProps;
  }

  return function pureFinalPropsSelector(nextState, nextOwnProps) {
    return hasRunAtLeastOnce ? handleSubsequentCalls(nextState, nextOwnProps) : handleFirstCall(nextState, nextOwnProps);
  };
}

function finalPropsSelectorFactory(dispatch, _ref2) {
  var initMapStateToProps = _ref2.initMapStateToProps;
  var initMapDispatchToProps = _ref2.initMapDispatchToProps;
  var initMergeProps = _ref2.initMergeProps;
  var options$$1 = objectWithoutProperties(_ref2, ['initMapStateToProps', 'initMapDispatchToProps', 'initMergeProps']);

  var mapStateToProps = initMapStateToProps(dispatch, options$$1);
  var mapDispatchToProps = initMapDispatchToProps(dispatch, options$$1);
  var mergeProps = initMergeProps(dispatch, options$$1);

  {
    verifySubselectors(mapStateToProps, mapDispatchToProps, mergeProps, options$$1.displayName);
  }

  var selectorFactory = options$$1.pure ? pureFinalPropsSelectorFactory : impureFinalPropsSelectorFactory;

  return selectorFactory(mapStateToProps, mapDispatchToProps, mergeProps, dispatch, options$$1);
}

function match(arg, factories, name) {
  for (var i = factories.length - 1; i >= 0; i--) {
    var result = factories[i](arg);
    if (result) return result;
  }

  return function (dispatch, options$$1) {
    throw new Error('Invalid value of type ' + (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) + ' for ' + name + ' argument when connecting component ' + options$$1.wrappedComponentName + '.');
  };
}

function strictEqual(a, b) {
  return a === b;
}

function createConnect() {
  var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var _ref$connectHOC = _ref.connectHOC;
  var connectHOC = _ref$connectHOC === undefined ? connectAdvanced : _ref$connectHOC;
  var _ref$mapStateToPropsF = _ref.mapStateToPropsFactories;
  var mapStateToPropsFactories = _ref$mapStateToPropsF === undefined ? defaultMapStateToPropsFactories : _ref$mapStateToPropsF;
  var _ref$mapDispatchToPro = _ref.mapDispatchToPropsFactories;
  var mapDispatchToPropsFactories = _ref$mapDispatchToPro === undefined ? defaultMapDispatchToPropsFactories : _ref$mapDispatchToPro;
  var _ref$mergePropsFactor = _ref.mergePropsFactories;
  var mergePropsFactories = _ref$mergePropsFactor === undefined ? defaultMergePropsFactories : _ref$mergePropsFactor;
  var _ref$selectorFactory = _ref.selectorFactory;
  var selectorFactory = _ref$selectorFactory === undefined ? finalPropsSelectorFactory : _ref$selectorFactory;

  return function connect(mapStateToProps, mapDispatchToProps, mergeProps) {
    var _ref2 = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    var _ref2$pure = _ref2.pure;
    var pure = _ref2$pure === undefined ? true : _ref2$pure;
    var _ref2$areStatesEqual = _ref2.areStatesEqual;
    var areStatesEqual = _ref2$areStatesEqual === undefined ? strictEqual : _ref2$areStatesEqual;
    var _ref2$areOwnPropsEqua = _ref2.areOwnPropsEqual;
    var areOwnPropsEqual = _ref2$areOwnPropsEqua === undefined ? shallowEqual : _ref2$areOwnPropsEqua;
    var _ref2$areStatePropsEq = _ref2.areStatePropsEqual;
    var areStatePropsEqual = _ref2$areStatePropsEq === undefined ? shallowEqual : _ref2$areStatePropsEq;
    var _ref2$areMergedPropsE = _ref2.areMergedPropsEqual;
    var areMergedPropsEqual = _ref2$areMergedPropsE === undefined ? shallowEqual : _ref2$areMergedPropsE;
    var extraOptions = objectWithoutProperties(_ref2, ['pure', 'areStatesEqual', 'areOwnPropsEqual', 'areStatePropsEqual', 'areMergedPropsEqual']);

    var initMapStateToProps = match(mapStateToProps, mapStateToPropsFactories, 'mapStateToProps');
    var initMapDispatchToProps = match(mapDispatchToProps, mapDispatchToPropsFactories, 'mapDispatchToProps');
    var initMergeProps = match(mergeProps, mergePropsFactories, 'mergeProps');

    return connectHOC(selectorFactory, _extends({
      methodName: 'connect',

      getDisplayName: function getDisplayName(name) {
        return 'Connect(' + name + ')';
      },

      shouldHandleStateChanges: Boolean(mapStateToProps),

      initMapStateToProps: initMapStateToProps,
      initMapDispatchToProps: initMapDispatchToProps,
      initMergeProps: initMergeProps,
      pure: pure,
      areStatesEqual: areStatesEqual,
      areOwnPropsEqual: areOwnPropsEqual,
      areStatePropsEqual: areStatePropsEqual,
      areMergedPropsEqual: areMergedPropsEqual

    }, extraOptions));
  };
}

var connect$1 = createConnect();

var lib$1 = {
  Provider: Provider,
  connect: connect$1,
  connectAdvanced: connectAdvanced
};

const formatDistance = distance => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${Math.round(distance / 10) / 100}km`;
};

const weekday = timestamp => {
  const format = new Intl.DateTimeFormat(navigator.languages, { weekday: 'long' });
  const date = new Date(timestamp * 1000);

  return format.format(date);
};

const filterLocations = (locations, search) => {
  const match = (location, search) => location.name.toLowerCase().indexOf(search);
  const normalizedSearch = search.trim().toLowerCase();

  if (search === '') {
    return locations;
  }

  return locations.map(location => ({ location, match: match(location, normalizedSearch) })).filter(({ match }) => match > -1).sort((a, b) => a.match > b.match).map(({ location }) => location);
};

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}

const maxLocations = () => window.innerWidth < 796 ? 3 : 8;

const Distance = ({ distance }) => {
  return h(
    'span',
    { 'class': 'distance' },
    `${formatDistance(distance)} away`
  );
};

const Location = ({ location, onSelect }) => {
  const onClick = () => {
    onSelect(location.id);
  };

  const onKeyPress = event => {
    if (event.key === 'Enter') {
      onSelect(location.id);
    }
  };

  return h(
    'li',
    { 'class': 'location' },
    h(
      'a',
      { onClick: onClick, onKeyPress: onKeyPress, tabIndex: '0' },
      location.name,
      location.distance && h(Distance, { distance: location.distance })
    )
  );
};

class Locations extends Component {
  constructor() {
    super();

    this._updateMaxLocations = () => {
      this.setState({ maxLocations: maxLocations() });
    };

    this.state.maxLocations = maxLocations();
  }

  componentDidMount() {
    window.addEventListener('resize', this._updateMaxLocations);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._updateMaxLocations);
  }

  render({ onSelectLocation, locations }, { maxLocations }) {
    const locationsCount = locations.length;

    return h(
      'div',
      null,
      h(
        'ul',
        { 'class': 'locations-list' },
        locations.slice(0, maxLocations).map(location => h(Location, { location: location, onSelect: onSelectLocation }))
      ),
      h(
        'footer',
        { 'class': 'locations-hidden' },
        locationsCount > maxLocations ? `${locationsCount - maxLocations} locations hidden` : ''
      )
    );
  }
}

var _extends$2 = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};













var objectWithoutProperties$1 = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

const Menu = ({ menu }) => {
  return h(
    'section',
    { 'class': 'menu-item' },
    h(
      'h2',
      null,
      menu.title
    ),
    h(
      'h3',
      null,
      'CHF ',
      menu.price
    ),
    h(
      'ul',
      { 'class': 'dishes' },
      menu.menu.map(dish => h(
        'li',
        null,
        dish
      ))
    )
  );
};

const Day = ({ day, timestamp, onClick, active }) => {
  return h(
    'li',
    { 'class': `item${active ? ' -active' : ''}`, onClick: () => onClick(day) },
    weekday(timestamp)
  );
};

const Location$1 = ({ location, menus, days, onSelectDay }) => {
  return h(
    'article',
    null,
    h(
      'h1',
      null,
      location.name
    ),
    h(
      'ul',
      { 'class': 'weekday-list' },
      days.map(day => h(Day, _extends$2({ onClick: onSelectDay }, day)))
    ),
    h(
      'div',
      { 'class': 'menu-items' },
      menus.map(menu => h(Menu, { menu: menu }))
    )
  );
};

function Search({ onSearch }) {
  return h("input", { type: "search",
    placeholder: "Search",
    onInput: event => onSearch(event.target.value),
    "class": "locations-search" });
}

const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2';

const encode = encodeURIComponent;

function fetchMenusFromApi(location) {
  return fetch(`${API_BASE}/locations/${encode(location)}/menus`).then(resp => resp.json()).then(({ results }) => {
    const byDay = new Map();

    results.sort((a, b) => a.timestamp > b.timestamp).forEach(menu => {
      const timestamp = menu.timestamp;

      if (byDay.has(timestamp)) {
        byDay.get(timestamp).push(menu);
      } else {
        byDay.set(timestamp, [menu]);
      }
    });

    return Array.from(byDay).map(([timestamp, menus]) => ({ timestamp, menus }));
  });
}

function fetchLocationsFromApi() {
  return fetch(`${API_BASE}/locations`).then(resp => resp.json()).then(({ results }) => {
    return results.sort((a, b) => a.name.localeCompare(b.name));
  });
}

function fetchLocationsByPositionFromApi(latitude, longitude) {
  return fetch(`${API_BASE}/locations?latitude=${encode(latitude)}&longitude=${encode(longitude)}`).then(resp => resp.json()).then(({ results }) => results);
}

const SET_LOCATIONS = 'SET_LOCATIONS';
const SELECT_LOCATION = 'SELECT_LOCATION';
const RECEIVE_MENUS = 'RECEIVE_MENUS';
const SELECT_DAY = 'SELECT_DAY';
const SEARCH = 'SEARCH';

const setLocations = locations => {
  return { type: SET_LOCATIONS, locations };
};

const selectLocation = location => {
  return { type: SELECT_LOCATION, location };
};

const receiveMenus = menus => {
  return { type: RECEIVE_MENUS, menus };
};

const selectDay = day => {
  return { type: SELECT_DAY, day };
};

const search = search => {
  return { type: SEARCH, search };
};

const fetchMenus = location => {
  return dispatch => {
    return fetchMenusFromApi(location).then(menus => dispatch(receiveMenus(menus)));
  };
};

const fetchLocations = () => {
  return dispatch => {
    let setByPosition = false;

    const withoutLocation = fetchLocationsFromApi().then(locations => {
      if (!setByPosition) {
        dispatch(setLocations(locations));
      }
    });

    const withLocation = getCurrentPosition().then(({ coords }) => fetchLocationsByPositionFromApi(coords.latitude, coords.longitude)).then(locations => {
      setByPosition = true;
      dispatch(setLocations(locations));
    });

    return Promise.all([withoutLocation, withLocation]);
  };
};

const { connect } = lib$1;

const mapDispatchToProps = dispatch => {
  return {
    onSearch: value => dispatch(search(value)),
    onSelectLocation: id => {
      dispatch(selectLocation(id));
      dispatch(fetchMenus(id));
    },
    onSelectDay: day => {
      dispatch(selectDay(day));
    }
  };
};

const findLocation = (locations, location) => {
  return locations.find($ => $.id === location);
};

const filterMenus = (menus, day) => {
  const dayMenus = menus[day];

  if (dayMenus == null) {
    return [];
  }

  return dayMenus.menus;
};

const days = (menus, day) => {
  if (menus == null) {
    return [];
  }

  return menus.map(({ timestamp }, i) => {
    return { day: i, timestamp, active: i === day };
  });
};

const mapStateToProps = ({ locations, location, menus, day, search: search$$1 }) => {
  return {
    locations: filterLocations(locations, search$$1),
    location: findLocation(locations, location),
    menus: filterMenus(menus, day),
    days: days(menus, day)
  };
};

const App = ({ locations, menus, location, days, onSearch, onSelectLocation, onSelectDay }) => {
  return h(
    'div',
    { 'class': 'page-content' },
    h(
      'div',
      { 'class': 'app-layout' },
      h(
        'nav',
        { 'class': 'nav' },
        h(Search, { onSearch: onSearch }),
        h(Locations, { locations: locations, onSelectLocation: onSelectLocation })
      ),
      h(
        'main',
        { 'class': 'content' },
        location && h(Location$1, { location: location, menus: menus, days: days, onSelectDay: onSelectDay })
      )
    )
  );
};

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

function createThunkMiddleware(extraArgument) {
  return function (_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (typeof action === 'function') {
          return action(dispatch, getState, extraArgument);
        }

        return next(action);
      };
    };
  };
}

var thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

const initialState = {
  locations: [],
  location: null,
  menus: [],
  search: '',
  day: 0
};

function reduce(state = initialState, _ref) {
  let { type } = _ref,
      action = objectWithoutProperties$1(_ref, ['type']);

  switch (type) {
    case SELECT_LOCATION:
      return _extends$2({}, state, { location: action.location });
    case RECEIVE_MENUS:
      return _extends$2({}, state, { menus: action.menus });
    case SET_LOCATIONS:
      return _extends$2({}, state, { locations: action.locations });
    case SEARCH:
      return _extends$2({}, state, { search: action.search });
    case SELECT_DAY:
      return _extends$2({}, state, { day: action.day });
  }

  return state;
}

const store = createStore(reduce, applyMiddleware(thunk));

store.dispatch(fetchLocations());

render(h(ConnectedApp, { store: store }), document.body);

}());

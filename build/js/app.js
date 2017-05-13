(function () {
'use strict';

function VNode() {}

var options = {};

const stack = [];

const EMPTY_CHILDREN = [];

function h$1(nodeName, attributes) {
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

const formatDistance = distance => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${Math.round(distance / 10) / 100}km`;
};

const Distance = ({ distance }) => {
  return h$1(
    'span',
    { 'class': 'distance' },
    `${formatDistance(distance)} away`
  );
};

const Location = ({ location, onSelect }) => {
  const onClick = event => {
    event.preventDefault();
    onSelect(location.id);
  };

  return h$1(
    'li',
    { 'class': 'location' },
    h$1(
      'a',
      { onClick: onClick },
      location.name,
      location.distance ? h$1(Distance, { distance: location.distance }) : ''
    )
  );
};

const Locations = ({ onSelectLocation, locations }) => {
  return h$1(
    'ul',
    { 'class': 'locations-list' },
    locations.map(location => h$1(Location, { location: location, onSelect: onSelectLocation }))
  );
};

const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2';

const encode = encodeURIComponent;



function fetchLocationMenus(location) {
  return fetch(`${API_BASE}/locations/${encode(location)}/menus`).then(resp => resp.json()).then(resp => resp.results);
}

const weekday = timestamp => {
  const format = new Intl.DateTimeFormat(navigator.languages, { weekday: 'long' });
  const date = new Date(timestamp * 1000);

  return format.format(date);
};

const groupByDay = menus => {
  const byDay = new Map();

  menus.sort((a, b) => a.timestamp > b.timestamp).forEach(menu => {
    const timestamp = menu.timestamp;

    if (byDay.has(timestamp)) {
      byDay.get(timestamp).push(menu);
    } else {
      byDay.set(timestamp, [menu]);
    }
  });

  return byDay;
};

const Menu = ({ menu }) => {
  return h$1(
    'section',
    { 'class': 'menu-item' },
    h$1(
      'h2',
      null,
      menu.title
    ),
    h$1(
      'h3',
      null,
      'CHF ',
      menu.price
    ),
    h$1(
      'ul',
      { 'class': 'dishes' },
      menu.menu.map(dish => h$1(
        'li',
        null,
        dish
      ))
    )
  );
};

const Day = ({ day, onSelect, active }) => {
  return h$1(
    'li',
    { 'class': `item${active ? ' -active' : ''}`, onClick: onSelect(day) },
    weekday(day)
  );
};

class Location$1 extends Component {
  constructor() {
    super();

    this._onDaySelect = day => {
      return () => {
        this.setState({ day });
      };
    };

    this.state.menusByDay = new Map();
    this.state.day = null;
  }

  componentWillMount() {
    this._fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this._fetchData(nextProps);
  }

  render({ location }, { menusByDay, day }) {
    const menus = menusByDay.get(day) || [];
    const days = Array.from(menusByDay.keys());

    return h$1(
      'article',
      null,
      h$1(
        'h1',
        null,
        location.name
      ),
      h$1(
        'ul',
        { 'class': 'weekday-list' },
        days.map($ => h$1(Day, { day: $, active: $ === day, onSelect: this._onDaySelect }))
      ),
      h$1(
        'div',
        { 'class': 'menu-items' },
        menus.map(menu => h$1(Menu, { menu: menu }))
      )
    );
  }

  _fetchData({ location }) {
    fetchLocationMenus(location.id).then(menus => {
      const menusByDay = groupByDay(menus);
      const day = menusByDay.keys().next().value;

      this.setState({ menusByDay, day });
    });
  }
}

var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

var root = freeGlobal || freeSelf || Function('return this')();

var Symbol$1 = root.Symbol;

var objectProto$1 = Object.prototype;

var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

var nativeObjectToString = objectProto$1.toString;

var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

function getRawTag(value) {
  var isOwn = hasOwnProperty$1.call(value, symToStringTag$1),
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

var objectProto$2 = Object.prototype;

var nativeObjectToString$1 = objectProto$2.toString;

function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

var getPrototype = overArg(Object.getPrototypeOf, Object);

function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var objectTag = '[object Object]';

var funcProto = Function.prototype;
var objectProto = Object.prototype;

var funcToString = funcProto.toString;

var hasOwnProperty = objectProto.hasOwnProperty;

var objectCtorString = funcToString.call(Object);

function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) != objectTag) {
    return false;
  }
  var proto = getPrototype(value);
  if (proto === null) {
    return true;
  }
  var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
  return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
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
    if (!isPlainObject(action)) {
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

function warning(message) {
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }

  try {
    throw new Error(message);
  } catch (e) {}
}

function isCrushed() {}

if (undefined !== 'production' && typeof isCrushed.name === 'string' && isCrushed.name !== 'isCrushed') {
  warning('You are currently using minified code outside of NODE_ENV === \'production\'. ' + 'This means that you are running a slower development build of Redux. ' + 'You can use loose-envify (https://github.com/zertosh/loose-envify) for browserify ' + 'or DefinePlugin for webpack (http://stackoverflow.com/questions/30030031) ' + 'to ensure you have the correct code for your production build.');
}

const SET_LOCATIONS = 'SET_LOCATIONS';
const SELECT_LOCATION = 'SELECT_LOCATION';

const SEARCH = 'SEARCH';

var _extends$1 = Object.assign || function (target) {
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

const initialState = {
  locations: [],
  location: 0,
  search: ''
};

function app(state = initialState, action) {
  switch (action.type) {
    case SELECT_LOCATION:
      return _extends$1({}, state, { location: action.location });
    case SET_LOCATIONS:
      return _extends$1({}, state, { locations: action.locations });
    case SEARCH:
      return _extends$1({}, state, { search: action.search });
  }

  return state;
}

const store = createStore(app);

const locations = [{
  'id': 2257,
  'location': {
    'address': {
      'city': 'Kriens',
      'house_number': '2',
      'street': 'Hobacherweg',
      'zip': 6010
    },
    'coordinates': [8.273273, 47.0344]
  },
  'name': 'Kriens Schappe Bistro'
}, {
  'id': 2135,
  'location': {
    'address': {
      'city': 'Emmenbr\u00fccke',
      'house_number': '1',
      'street': 'Fichtenstrasse',
      'zip': 6020
    },
    'coordinates': [8.290494, 47.073261]
  },
  'name': 'Emmenbr\u00fccke'
}, {
  'id': 2847,
  'location': {
    'address': {
      'city': 'Kriens',
      'house_number': '19',
      'street': 'Ringstrasse',
      'zip': 6010
    },
    'coordinates': [8.295953, 47.020227]
  },
  'name': 'Kriens Pilatusmarkt'
}, {
  'id': 2130,
  'location': {
    'address': {
      'city': 'Luzern',
      'house_number': '9',
      'street': 'Z\u00fcrichstrasse',
      'zip': 6004
    },
    'coordinates': [8.310045, 47.056913]
  },
  'name': 'L\u00f6wencenter LU'
}, {
  'id': 2575,
  'location': {
    'address': {
      'city': 'Schenkon',
      'house_number': '',
      'street': 'Zellfeld',
      'zip': 6214
    },
    'coordinates': [8.126401, 47.178165]
  },
  'name': 'Schenkon'
}, {
  'id': 2131,
  'location': {
    'address': {
      'city': 'Stans',
      'house_number': '4/6',
      'street': 'Buochserstrasse',
      'zip': 6370
    },
    'coordinates': [8.368674, 46.958373]
  },
  'name': 'Stans'
}, {
  'id': 2138,
  'location': {
    'address': {
      'city': 'Sarnen',
      'house_number': '32',
      'street': 'Marktstrasse',
      'zip': 6060
    },
    'coordinates': [8.251211, 46.897303]
  },
  'name': 'Sarnen'
}, {
  'id': 2258,
  'location': {
    'address': {
      'city': 'Willisau',
      'house_number': '',
      'street': 'Feldli',
      'zip': 6130
    },
    'coordinates': [7.997246, 47.127368]
  },
  'name': 'Willisau'
}, {
  'id': 2038,
  'location': {
    'address': {
      'city': 'Reinach',
      'house_number': '134',
      'street': 'Obere Stumpenbachstrasse',
      'zip': 5734
    },
    'coordinates': [8.182447, 47.25163]
  },
  'name': 'Reinach AG'
}, {
  'id': 2136,
  'location': {
    'address': {
      'city': 'Zug',
      'house_number': '6',
      'street': 'Baarerstrasse',
      'zip': 6300
    },
    'coordinates': [8.516536, 47.171017]
  },
  'name': 'Zug Neustadt'
}, {
  'id': 2317,
  'location': {
    'address': {
      'city': 'Baar',
      'house_number': '3',
      'street': 'Poststrasse',
      'zip': 6340
    },
    'coordinates': [8.524314, 47.194854]
  },
  'name': 'Baar Gotthard'
}, {
  'id': 2133,
  'location': {
    'address': {
      'city': 'Baar',
      'house_number': '10',
      'street': 'L\u00e4ttichstrasse',
      'zip': 6340
    },
    'coordinates': [8.540937, 47.201623]
  },
  'name': 'Baar Delfin'
}, {
  'id': 2137,
  'location': {
    'address': {
      'city': 'Engelberg',
      'house_number': '5',
      'street': 'Titliszentrum',
      'zip': 6390
    },
    'coordinates': [8.404397, 46.820871]
  },
  'name': 'Engelberg'
}, {
  'id': 2090,
  'location': {
    'address': {
      'city': 'Affoltern am Albis',
      'house_number': '15',
      'street': 'B\u00fcelstrasse',
      'zip': 8910
    },
    'coordinates': [8.446388, 47.274164]
  },
  'name': 'Affoltern am Albis'
}, {
  'id': 2461,
  'location': {
    'address': {
      'city': 'Seewen',
      'house_number': '',
      'street': 'Steinbislin 7',
      'zip': 6423
    },
    'coordinates': [8.628244, 47.033456]
  },
  'name': 'Seewen Markt'
}, {
  'id': 2097,
  'location': {
    'address': {
      'city': 'Zofingen',
      'house_number': '4',
      'street': 'Aarburgerstrasse',
      'zip': 4800
    },
    'coordinates': [7.942626, 47.292235]
  },
  'name': 'Zofingen'
}, {
  'id': 3687,
  'location': {
    'address': {
      'city': 'Langnau',
      'house_number': '37',
      'street': 'S\u00e4gestrasse',
      'zip': 3550
    },
    'coordinates': [7.778296, 46.940431]
  },
  'name': 'Langnau'
}, {
  'id': 4177,
  'location': {
    'address': {
      'city': 'Langnau am Albis',
      'house_number': '7',
      'street': 'H\u00f6flistrasse',
      'zip': 8135
    },
    'coordinates': [8.539751, 47.28952]
  },
  'name': 'Langnau Ca\'Puccini'
}, {
  'id': 3845,
  'location': {
    'address': {
      'city': 'Unterentfelden',
      'house_number': '3',
      'street': 'Schinhuetweg',
      'zip': 5035
    },
    'coordinates': [8.0526, 47.360764]
  },
  'name': 'Unterentfelden Ca\'Puccini'
}, {
  'id': 2093,
  'location': {
    'address': {
      'city': 'Langenthal',
      'house_number': '3',
      'street': 'St. Urbanstrasse',
      'zip': 4900
    },
    'coordinates': [7.79012, 47.21228]
  },
  'name': 'Langenthal Tell'
}, {
  'id': 2037,
  'location': {
    'address': {
      'city': 'Lenzburg',
      'house_number': '31',
      'street': 'Aug. Keller-Strasse',
      'zip': 5600
    },
    'coordinates': [8.171423, 47.389942]
  },
  'name': 'Lenzburg'
}, {
  'id': 3702,
  'location': {
    'address': {
      'city': 'Schafisheim',
      'house_number': '5',
      'street': 'Rupperswilerstrasse',
      'zip': 5503
    },
    'coordinates': [8.136649, 47.387405]
  },
  'name': 'Schafisheim'
}, {
  'id': 4457,
  'location': {
    'address': {
      'city': 'Thalwil',
      'house_number': '1',
      'street': 'Florastrasse',
      'zip': 8800
    },
    'coordinates': [8.562137, 47.296627]
  },
  'name': 'Thalwil'
}, {
  'id': 2139,
  'location': {
    'address': {
      'city': 'Altdorf',
      'house_number': '3',
      'street': 'Hellgasse',
      'zip': 6460
    },
    'coordinates': [8.64572, 46.880931]
  },
  'name': 'Altdorf'
}, {
  'id': 4502,
  'location': {
    'address': {
      'city': 'Feldmeilen',
      'house_number': '65',
      'street': 'General-Wille-Strasse',
      'zip': 8706
    },
    'coordinates': [8.615553, 47.279686]
  },
  'name': 'Feldmeilen Ca\'Puccini'
}, {
  'id': 2042,
  'location': {
    'address': {
      'city': 'Aarau',
      'house_number': '17',
      'street': 'Igelweid',
      'zip': 5000
    },
    'coordinates': [8.045976, 47.391677]
  },
  'name': 'Aarau'
}, {
  'id': 2039,
  'location': {
    'address': {
      'city': 'Aarau',
      'house_number': '67',
      'street': 'Tellistrasse',
      'zip': 5004
    },
    'coordinates': [8.058209, 47.398025]
  },
  'name': 'Aarau Telli'
}, {
  'id': 2092,
  'location': {
    'address': {
      'city': 'Olten',
      'house_number': '10',
      'street': 'Baslerstrasse',
      'zip': 4600
    },
    'coordinates': [7.90293, 47.350534]
  },
  'name': 'Olten'
}, {
  'id': 4103,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '334',
      'street': 'Albisriedstrasse',
      'zip': 8047
    },
    'coordinates': [8.484201, 47.375447]
  },
  'name': 'Z\u00fcrich A-Park Ca\'Puccini'
}, {
  'id': 2095,
  'location': {
    'address': {
      'city': 'Herzogenbuchsee',
      'house_number': '43',
      'street': 'Bernstrasse',
      'zip': 3360
    },
    'coordinates': [7.70329, 47.185798]
  },
  'name': 'Herzogenbuchsee'
}, {
  'id': 2084,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '200',
      'street': 'Birmensdorferstrasse',
      'zip': 8003
    },
    'coordinates': [8.515939, 47.370729]
  },
  'name': 'Z\u00fcrich Wiedikon'
}, {
  'id': 2088,
  'location': {
    'address': {
      'city': 'Schlieren',
      'house_number': '6',
      'street': 'Z\u00fcrcherstrasse',
      'zip': 8952
    },
    'coordinates': [8.448875, 47.397295]
  },
  'name': 'Schlieren Lilien'
}, {
  'id': 3709,
  'location': {
    'address': {
      'city': 'Dietikon',
      'house_number': '1-3',
      'street': 'Reservatstrasse',
      'zip': 8953
    },
    'coordinates': [8.402214, 47.415395]
  },
  'name': 'Personal Dietikon'
}, {
  'id': 2546,
  'location': {
    'address': {
      'city': 'Egerkingen',
      'house_number': '3',
      'street': 'Hausimollstrasse',
      'zip': 4622
    },
    'coordinates': [7.803091, 47.317981]
  },
  'name': 'Egerkingen G\u00e4upark'
}, {
  'id': 2901,
  'location': {
    'address': {
      'city': 'Egerkingen',
      'house_number': '3',
      'street': 'Hausimollstrasse',
      'zip': 4622
    },
    'coordinates': [7.803091, 47.317981]
  },
  'name': 'Egerkingen G\u00e4upark'
}, {
  'id': 2829,
  'location': {
    'address': {
      'city': 'Dietikon',
      'house_number': '9',
      'street': 'Silbernstrasse',
      'zip': 8953
    },
    'coordinates': [8.392182, 47.418303]
  },
  'name': 'Dietikon Silbern'
}, {
  'id': 4013,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '50',
      'street': 'Baslerstrasse',
      'zip': 8048
    },
    'coordinates': [8.498772, 47.38636]
  },
  'name': 'Z\u00fcrich Letzipark CremAmore'
}, {
  'id': 2625,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '18',
      'street': 'Theaterstrasse',
      'zip': 8024
    },
    'coordinates': [8.545907, 47.367091]
  },
  'name': 'Z\u00fcrich Bellevue'
}, {
  'id': 2083,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '57',
      'street': 'Bahnhofstrasse',
      'zip': 8001
    },
    'coordinates': [8.537818, 47.372925]
  },
  'name': 'Z\u00fcrich St. Annahof'
}, {
  'id': 2162,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '57',
      'street': 'Bahnhofstrasse',
      'zip': 8001
    },
    'coordinates': [8.537818, 47.372925]
  },
  'name': 'City St. Annahof Take it'
}, {
  'id': 2544,
  'location': {
    'address': {
      'city': 'Burgdorf',
      'house_number': '14',
      'street': 'S\u00e4gegasse',
      'zip': 3400
    },
    'coordinates': [7.629367, 47.056822]
  },
  'name': 'Burgdorf Sch\u00fctzenmatte'
}, {
  'id': 2884,
  'location': {
    'address': {
      'city': 'Wettingen',
      'house_number': '42',
      'street': 'Jurastrasse',
      'zip': 5430
    },
    'coordinates': [8.329765, 47.458746]
  },
  'name': 'Wettingen T\u00e4gipark'
}, {
  'id': 5080,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '4',
      'street': 'Sophie T\u00e4uber Strasse',
      'zip': 8050
    },
    'coordinates': [8.541612, 47.413583]
  },
  'name': 'Z\u00fcrich Eleven'
}, {
  'id': 2524,
  'location': {
    'address': {
      'city': 'Baden',
      'house_number': '28',
      'street': 'Bahnhofstrasse',
      'zip': 5401
    },
    'coordinates': [8.307696, 47.475779]
  },
  'name': 'Baden'
}, {
  'id': 2068,
  'location': {
    'address': {
      'city': 'Kirchberg',
      'house_number': '1',
      'street': 'Z\u00fcrichstrasse',
      'zip': 3422
    },
    'coordinates': [7.583908, 47.086761]
  },
  'name': 'Kirchberg'
}, {
  'id': 2079,
  'location': {
    'address': {
      'city': 'Interlaken',
      'house_number': '10',
      'street': 'Untere B\u00f6nigstrasse',
      'zip': 3800
    },
    'coordinates': [7.869247, 46.689681]
  },
  'name': 'Interlaken Ost'
}, {
  'id': 4902,
  'location': {
    'address': {
      'city': 'Volketswil',
      'house_number': '1',
      'street': 'Industriestrasse',
      'zip': 8604
    },
    'coordinates': [8.667621, 47.38251]
  },
  'name': 'Volkiland'
}, {
  'id': 5306,
  'location': {
    'address': {
      'city': 'Volketswil',
      'house_number': '1',
      'street': 'Industriestrasse',
      'zip': 8604
    },
    'coordinates': [8.667621, 47.38251]
  },
  'name': 'Volketswil Volkiland Bistro'
}, {
  'id': 2481,
  'location': {
    'address': {
      'city': 'Volketswil',
      'house_number': '1',
      'street': 'Industriestrasse',
      'zip': 8604
    },
    'coordinates': [8.667621, 47.38251]
  },
  'name': 'Volketswil Volkiland Take it'
}, {
  'id': 4055,
  'location': {
    'address': {
      'city': 'Dietlikon',
      'house_number': '28',
      'street': 'Industriestrasse',
      'zip': 8305
    },
    'coordinates': [8.618612, 47.412769]
  },
  'name': 'Dietlikon Center'
}, {
  'id': 2377,
  'location': {
    'address': {
      'city': 'Biberist',
      'house_number': '44',
      'street': 'Hauptstrasse',
      'zip': 4562
    },
    'coordinates': [7.563256, 47.18187]
  },
  'name': 'Biberist'
}, {
  'id': 2254,
  'location': {
    'address': {
      'city': 'Jona',
      'house_number': '17',
      'street': 'Allmeindstrasse',
      'zip': 8645
    },
    'coordinates': [8.83674, 47.231625]
  },
  'name': 'Jona Eisenhof'
}, {
  'id': 2085,
  'location': {
    'address': {
      'city': 'Dielsdorf',
      'house_number': '5',
      'street': 'Niederhaslistrasse',
      'zip': 8157
    },
    'coordinates': [8.466156, 47.483574]
  },
  'name': 'Dielsdorf'
}, {
  'id': 2060,
  'location': {
    'address': {
      'city': 'Worb',
      'house_number': '4',
      'street': 'B\u00e4renplatz',
      'zip': 3076
    },
    'coordinates': [7.561448, 46.928923]
  },
  'name': 'Worb'
}, {
  'id': 2094,
  'location': {
    'address': {
      'city': 'Zuchwil',
      'house_number': '54',
      'street': 'Hauptstrasse',
      'zip': 4528
    },
    'coordinates': [7.558963, 47.203336]
  },
  'name': 'Zuchwil Bistro'
}, {
  'id': 3555,
  'location': {
    'address': {
      'city': 'W\u00fcrenlingen',
      'house_number': '7',
      'street': 'Kuhg\u00e4ssli',
      'zip': 5303
    },
    'coordinates': [8.245983, 47.525784]
  },
  'name': 'W\u00fcrenlingen Aarepark'
}, {
  'id': 2047,
  'location': {
    'address': {
      'city': 'Frick',
      'house_number': '37',
      'street': 'Hauptstrasse',
      'zip': 5070
    },
    'coordinates': [8.019214, 47.509028]
  },
  'name': 'Frick'
}, {
  'id': 4054,
  'location': {
    'address': {
      'city': 'Hinwil',
      'house_number': '38',
      'street': 'W\u00e4sseristrasse',
      'zip': 8340
    },
    'coordinates': [8.817954, 47.306626]
  },
  'name': 'Hinwil Center'
}, {
  'id': 4841,
  'location': {
    'address': {
      'city': 'Urtenen-Sch\u00f6nb\u00fchl',
      'house_number': '8',
      'street': 'Sandstrasse',
      'zip': 3322
    },
    'coordinates': [7.500875, 47.018663]
  },
  'name': 'Sch\u00f6nb\u00fchl'
}, {
  'id': 4512,
  'location': {
    'address': {
      'city': 'Heimberg',
      'house_number': '61',
      'street': 'Bl\u00fcmlisalpstrasse',
      'zip': 3627
    },
    'coordinates': [7.608261, 46.779828]
  },
  'name': 'Heimberg Center'
}, {
  'id': 2078,
  'location': {
    'address': {
      'city': 'Thun',
      'house_number': '1',
      'street': 'Schw\u00e4bisgasse',
      'zip': 3600
    },
    'coordinates': [7.62739, 46.760584]
  },
  'name': 'Thun Kyburg'
}, {
  'id': 2161,
  'location': {
    'address': {
      'city': 'Thun',
      'house_number': '1',
      'street': 'Schw\u00e4bisgasse',
      'zip': 3600
    },
    'coordinates': [7.62739, 46.760584]
  },
  'name': 'Thun City Kyburg Take it'
}, {
  'id': 3316,
  'location': {
    'address': {
      'city': 'G\u00fcmligen',
      'house_number': '1',
      'street': 'Turbenweg',
      'zip': 3073
    },
    'coordinates': [7.503941, 46.933297]
  },
  'name': 'G\u00fcmligen Zentrum'
}, {
  'id': 2570,
  'location': {
    'address': {
      'city': 'Bachenb\u00fclach',
      'house_number': '6',
      'street': 'Grabenstrasse',
      'zip': 8184
    },
    'coordinates': [8.541831, 47.506121]
  },
  'name': 'Bachenb\u00fclach'
}, {
  'id': 2077,
  'location': {
    'address': {
      'city': 'Ittigen',
      'house_number': '19',
      'street': 'Talgutzentrum',
      'zip': 3063
    },
    'coordinates': [7.48169, 46.974227]
  },
  'name': 'Ittigen'
}, {
  'id': 2076,
  'location': {
    'address': {
      'city': 'Ostermundigen',
      'house_number': '3',
      'street': 'Bahnhofstrasse',
      'zip': 3072
    },
    'coordinates': [7.483632, 46.955651]
  },
  'name': 'Ostermundigen Bahnhof'
}, {
  'id': 2866,
  'location': {
    'address': {
      'city': 'Thun',
      'house_number': '32',
      'street': 'Schulstrasse',
      'zip': 3604
    },
    'coordinates': [7.621942, 46.740524]
  },
  'name': 'Thun Str\u00e4ttligen Markt'
}, {
  'id': 2055,
  'location': {
    'address': {
      'city': 'Bubendorf',
      'house_number': '4',
      'street': 'Gewerbestrasse',
      'zip': 4416
    },
    'coordinates': [7.736225, 47.454608]
  },
  'name': 'Bubendorf'
}, {
  'id': 2067,
  'location': {
    'address': {
      'city': 'Zollikofen',
      'house_number': '1',
      'street': 'M\u00e4ritgasse',
      'zip': 3052
    },
    'coordinates': [7.458555, 46.997135]
  },
  'name': 'Zollikofen'
}, {
  'id': 2914,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '85',
      'street': 'Papierm\u00fchlestrasse',
      'zip': 3014
    },
    'coordinates': [7.465572, 46.963617]
  },
  'name': 'Bern Wankdorf Center'
}, {
  'id': 2065,
  'location': {
    'address': {
      'city': 'M\u00fcnchenbuchsee',
      'house_number': '39',
      'street': 'Oberdorfstrasse',
      'zip': 3053
    },
    'coordinates': [7.444688, 47.019831]
  },
  'name': 'M\u00fcnchenbuchsee'
}, {
  'id': 2071,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '2',
      'street': 'Stauffacherstrasse',
      'zip': 3014
    },
    'coordinates': [7.455007, 46.959275]
  },
  'name': 'Bern Breitenrain'
}, {
  'id': 5302,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '53',
      'street': 'Aarbergergasse',
      'zip': 3011
    },
    'coordinates': [7.442039, 46.949552]
  },
  'name': 'Bern Ryfflihof Take it'
}, {
  'id': 2044,
  'location': {
    'address': {
      'city': 'Liestal',
      'house_number': '45',
      'street': 'Rathausstrasse',
      'zip': 4410
    },
    'coordinates': [7.735262, 47.483985]
  },
  'name': 'Liestal Stabhof'
}, {
  'id': 3776,
  'location': {
    'address': {
      'city': 'Uznach',
      'house_number': '',
      'street': 'Linthpark',
      'zip': 8730
    },
    'coordinates': [8.970294, 47.225185]
  },
  'name': 'Uznach Take it'
}, {
  'id': 4221,
  'location': {
    'address': {
      'city': 'Winterthur',
      'house_number': '51',
      'street': 'Z\u00fcrcherstrasse',
      'zip': 8406
    },
    'coordinates': [8.712463, 47.494934]
  },
  'name': 'Winterthur Lokwerk'
}, {
  'id': 2390,
  'location': {
    'address': {
      'city': 'Frenkendorf',
      'house_number': '22',
      'street': 'Bahnhofstrasse',
      'zip': 4402
    },
    'coordinates': [7.721467, 47.502223]
  },
  'name': 'Frenkendorf Bistro'
}, {
  'id': 2074,
  'location': {
    'address': {
      'city': 'K\u00f6niz',
      'house_number': '5',
      'street': 'Stapfenstrasse',
      'zip': 3098
    },
    'coordinates': [7.415477, 46.923293]
  },
  'name': 'K\u00f6niz Stapfenm\u00e4rit'
}, {
  'id': 4948,
  'location': {
    'address': {
      'city': 'Winterthur',
      'house_number': '3',
      'street': 'Bahnhofplatz',
      'zip': 8400
    },
    'coordinates': [8.723571, 47.4993]
  },
  'name': 'Winterthur City'
}, {
  'id': 2140,
  'location': {
    'address': {
      'city': 'Winterthur',
      'house_number': '8/12',
      'street': 'Bankstrasse',
      'zip': 8400
    },
    'coordinates': [8.725898, 47.500569]
  },
  'name': 'Winterthur Stadtgarten'
}, {
  'id': 4814,
  'location': {
    'address': {
      'city': 'Winterthur',
      'house_number': '8/12',
      'street': 'Bankstrasse',
      'zip': 8400
    },
    'coordinates': [8.725898, 47.500569]
  },
  'name': 'Winterthur Stadtgarten Take '
}, {
  'id': 2054,
  'location': {
    'address': {
      'city': 'M\u00f6hlin',
      'house_number': '9',
      'street': 'Hauptstrasse',
      'zip': 4313
    },
    'coordinates': [7.842218, 47.563366]
  },
  'name': 'M\u00f6hlin'
}, {
  'id': 2070,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '7/9',
      'street': 'Kasparstrasse',
      'zip': 3027
    },
    'coordinates': [7.392188, 46.950712]
  },
  'name': 'Bern Bethlehem'
}, {
  'id': 2226,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '118',
      'street': 'Br\u00fcnnenstrasse',
      'zip': 3018
    },
    'coordinates': [7.39175, 46.941348]
  },
  'name': 'Bern B\u00fcmpliz'
}, {
  'id': 2406,
  'location': {
    'address': {
      'city': 'Grenchen',
      'house_number': '2',
      'street': 'Bachstrasse',
      'zip': 2540
    },
    'coordinates': [7.397296, 47.192373]
  },
  'name': 'Grenchen'
}, {
  'id': 2142,
  'location': {
    'address': {
      'city': 'Winterthur',
      'house_number': '19',
      'street': 'Rudolf Diesel-Strasse',
      'zip': 8404
    },
    'coordinates': [8.758385, 47.494923]
  },
  'name': 'Winterthur Gr\u00fczemarkt'
}, {
  'id': 2089,
  'location': {
    'address': {
      'city': 'Netstal',
      'house_number': '41',
      'street': 'Molliserstrasse',
      'zip': 8754
    },
    'coordinates': [9.058654, 47.067388]
  },
  'name': 'Netstal Wiggispark'
}, {
  'id': 4937,
  'location': {
    'address': {
      'city': 'Kaiseraugst',
      'house_number': '5',
      'street': 'Junkholzweg',
      'zip': 4303
    },
    'coordinates': [7.732031, 47.538217]
  },
  'name': 'Kaiseraugst'
}, {
  'id': 2050,
  'location': {
    'address': {
      'city': 'Pratteln',
      'house_number': '18',
      'street': 'Bahnhofstrasse',
      'zip': 4133
    },
    'coordinates': [7.691292, 47.520209]
  },
  'name': 'Pratteln Bahnhof'
}, {
  'id': 2056,
  'location': {
    'address': {
      'city': 'Reinach',
      'house_number': '1',
      'street': 'Austrasse',
      'zip': 4153
    },
    'coordinates': [7.593326, 47.493759]
  },
  'name': 'Reinach BL'
}, {
  'id': 3794,
  'location': {
    'address': {
      'city': 'Lyss',
      'house_number': '2',
      'street': 'Beundengasse',
      'zip': 3250
    },
    'coordinates': [7.302594, 47.072749]
  },
  'name': 'Lyss Stigli'
}, {
  'id': 2045,
  'location': {
    'address': {
      'city': 'M\u00fcnchenstein',
      'house_number': '8',
      'street': 'St\u00f6ckackerstrasse',
      'zip': 4142
    },
    'coordinates': [7.607121, 47.521297]
  },
  'name': 'M\u00fcnchenstein Gartenstadt'
}, {
  'id': 5305,
  'location': {
    'address': {
      'city': 'M\u00fcnchenstein',
      'house_number': '8',
      'street': 'St\u00f6ckackerstrasse',
      'zip': 4142
    },
    'coordinates': [7.607121, 47.521297]
  },
  'name': 'M\u00fcnchenstein Garten Take it'
}, {
  'id': 4093,
  'location': {
    'address': {
      'city': 'Biel',
      'house_number': '24C',
      'street': 'Z\u00fcrichstrasse',
      'zip': 2504
    },
    'coordinates': [7.294125, 47.162013]
  },
  'name': 'Biel Boujean'
}, {
  'id': 4469,
  'location': {
    'address': {
      'city': 'Oberwil',
      'house_number': '34',
      'street': 'M\u00fchlemattstrasse',
      'zip': 4104
    },
    'coordinates': [7.553718, 47.507593]
  },
  'name': 'Oberwil M\u00fchlematt'
}, {
  'id': 4698,
  'location': {
    'address': {
      'city': 'Aarberg',
      'house_number': '11',
      'street': 'Bahnhofstrasse',
      'zip': 3270
    },
    'coordinates': [7.276433, 47.042456]
  },
  'name': 'Aarberg'
}, {
  'id': 2057,
  'location': {
    'address': {
      'city': 'Oberwil',
      'house_number': '1',
      'street': 'Bahnhofstrasse',
      'zip': 4104
    },
    'coordinates': [7.557862, 47.514487]
  },
  'name': 'Oberwil'
}, {
  'id': 2073,
  'location': {
    'address': {
      'city': 'Schwarzenburg',
      'house_number': '10',
      'street': 'Bernstrasse',
      'zip': 3150
    },
    'coordinates': [7.341903, 46.819799]
  },
  'name': 'Schwarzenburg'
}, {
  'id': 2389,
  'location': {
    'address': {
      'city': 'Bottmingen',
      'house_number': '43',
      'street': 'Baslerstrasse',
      'zip': 4103
    },
    'coordinates': [7.572907, 47.526927]
  },
  'name': 'Bottmingen Bistro'
}, {
  'id': 2048,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '190',
      'street': 'G\u00fcterstrasse',
      'zip': 4053
    },
    'coordinates': [7.593111, 47.542992]
  },
  'name': 'Basel Gundeli'
}, {
  'id': 2157,
  'location': {
    'address': {
      'city': 'Wattwil',
      'house_number': '4',
      'street': 'Gr\u00fcnaustrasse',
      'zip': 9630
    },
    'coordinates': [9.086299, 47.303204]
  },
  'name': 'Wattwil Bistro'
}, {
  'id': 4288,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '125',
      'street': 'G\u00fcterstrasse',
      'zip': 4053
    },
    'coordinates': [7.588655, 47.545381]
  },
  'name': 'Basel S\u00fcdpark Take it'
}, {
  'id': 2043,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '75',
      'street': 'Freie Strasse',
      'zip': 4051
    },
    'coordinates': [7.590796, 47.555649]
  },
  'name': 'Basel Pfauen'
}, {
  'id': 5301,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '75',
      'street': 'Freie Strasse',
      'zip': 4002
    },
    'coordinates': [7.590796, 47.555649]
  },
  'name': 'Basel City Pfauen Take it'
}, {
  'id': 2499,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '4',
      'street': 'Gerbergasse',
      'zip': 4001
    },
    'coordinates': [7.587798, 47.557443]
  },
  'name': 'Basel Am Marktplatz'
}, {
  'id': 4156,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '41',
      'street': 'Clarastrasse',
      'zip': 4058
    },
    'coordinates': [7.597475, 47.563366]
  },
  'name': 'Basel Europe Ca\'Puccini'
}, {
  'id': 2066,
  'location': {
    'address': {
      'city': 'Biel',
      'house_number': '35',
      'street': 'Nidaugasse',
      'zip': 2502
    },
    'coordinates': [7.247049, 47.138621]
  },
  'name': 'Biel Nidaugasse'
}, {
  'id': 5312,
  'location': {
    'address': {
      'city': 'Biel',
      'house_number': '35',
      'street': 'Nidaugasse',
      'zip': 2502
    },
    'coordinates': [7.247049, 47.138621]
  },
  'name': 'Biel Nidaugasse Take it'
}, {
  'id': 2062,
  'location': {
    'address': {
      'city': 'Biel',
      'house_number': '31',
      'street': 'Salzhausstrasse',
      'zip': 2503
    },
    'coordinates': [7.243771, 47.130241]
  },
  'name': 'Biel Bahnhof'
}, {
  'id': 4149,
  'location': {
    'address': {
      'city': 'Allschwil',
      'house_number': '82',
      'street': 'Binningerstrasse',
      'zip': 4123
    },
    'coordinates': [7.545861, 47.54729]
  },
  'name': 'Allschwil Letten'
}, {
  'id': 4150,
  'location': {
    'address': {
      'city': 'Basel',
      'house_number': '10',
      'street': 'Vogesenplatz',
      'zip': 4056
    },
    'coordinates': [7.573802, 47.570681]
  },
  'name': 'Basel Volta Zentrum'
}, {
  'id': 2144,
  'location': {
    'address': {
      'city': 'Frauenfeld',
      'house_number': '138',
      'street': 'Z\u00fcrcherstrasse',
      'zip': 8500
    },
    'coordinates': [8.896873, 47.554098]
  },
  'name': 'Frauenfeld Schlosspark'
}, {
  'id': 2554,
  'location': {
    'address': {
      'city': 'Rickenbach bei Wil',
      'house_number': '4',
      'street': 'Breitenstrasse',
      'zip': 9532
    },
    'coordinates': [9.053022, 47.447047]
  },
  'name': 'Rickenbach'
}, {
  'id': 2454,
  'location': {
    'address': {
      'city': 'Wil',
      'house_number': '39',
      'street': 'Obere Bahnhofstrasse',
      'zip': 9500
    },
    'coordinates': [9.045289, 47.464994]
  },
  'name': 'Wil Stadtmarkt'
}, {
  'id': 2599,
  'location': {
    'address': {
      'city': 'Schaffhausen',
      'house_number': '69',
      'street': 'Vordergasse',
      'zip': 8201
    },
    'coordinates': [8.634502, 47.696283]
  },
  'name': 'Schaffhausen'
}, {
  'id': 2350,
  'location': {
    'address': {
      'city': 'Bassecourt',
      'house_number': '81',
      'street': 'Rue de l\'Abb\u00e9 Monnin',
      'zip': 2854
    },
    'coordinates': [7.253093, 47.338447]
  },
  'name': 'Bassecourt'
}, {
  'id': 2300,
  'location': {
    'address': {
      'city': 'Ilanz',
      'house_number': '9',
      'street': 'Via Santeri',
      'zip': 7130
    },
    'coordinates': [9.200023, 46.772914]
  },
  'name': 'Ilanz Bistro'
}, {
  'id': 2149,
  'location': {
    'address': {
      'city': 'Uzwil',
      'house_number': '1',
      'street': 'Wattstrasse',
      'zip': 9240
    },
    'coordinates': [9.138017, 47.435457]
  },
  'name': 'Uzwil'
}, {
  'id': 2563,
  'location': {
    'address': {
      'city': 'Granges-Paccot',
      'house_number': '1',
      'street': 'Route d\'Agy',
      'zip': 1763
    },
    'coordinates': [7.153794, 46.819836]
  },
  'name': 'Granges-Paccot'
}, {
  'id': 3743,
  'location': {
    'address': {
      'city': 'Fribourg',
      'house_number': '12',
      'street': 'Avenue de la Gare',
      'zip': 1701
    },
    'coordinates': [7.152545, 46.803236]
  },
  'name': 'Fribourg'
}, {
  'id': 4047,
  'location': {
    'address': {
      'city': 'Visp Eyholz',
      'house_number': '57',
      'street': 'Kantonsstrasse',
      'zip': 3930
    },
    'coordinates': [7.914619, 46.296269]
  },
  'name': 'Eyholz Center'
}, {
  'id': 4535,
  'location': {
    'address': {
      'city': 'Villars-sur-Gl\u00e2ne',
      'house_number': '',
      'street': 'Route de Moncor',
      'zip': 1752
    },
    'coordinates': [7.123807, 46.798069]
  },
  'name': 'Villars-sur-Gl\u00e2ne'
}, {
  'id': 4583,
  'location': {
    'address': {
      'city': 'Weinfelden',
      'house_number': '18',
      'street': 'Fichtenstrasse',
      'zip': 8570
    },
    'coordinates': [9.096933, 47.566315]
  },
  'name': 'Weinfelden Thurmarkt'
}, {
  'id': 2147,
  'location': {
    'address': {
      'city': 'Gossau',
      'house_number': '75',
      'street': 'St. Gallerstrasse',
      'zip': 9200
    },
    'coordinates': [9.251527, 47.41673]
  },
  'name': 'Gossau SG'
}, {
  'id': 3711,
  'location': {
    'address': {
      'city': 'Matran',
      'house_number': '1',
      'street': 'Route du Bois',
      'zip': 1753
    },
    'coordinates': [7.088016, 46.780801]
  },
  'name': 'Matran'
}, {
  'id': 3763,
  'location': {
    'address': {
      'city': 'Matran',
      'house_number': '1',
      'street': 'Route du Bois',
      'zip': 1753
    },
    'coordinates': [7.088016, 46.780801]
  },
  'name': 'Matran Ca\'Puccini'
}, {
  'id': 2370,
  'location': {
    'address': {
      'city': 'Mels',
      'house_number': '63',
      'street': 'Grossfeldstrasse',
      'zip': 8887
    },
    'coordinates': [9.434969, 47.04037]
  },
  'name': 'Mels Pizolcenter'
}, {
  'id': 4018,
  'location': {
    'address': {
      'city': 'Saignel\u00e9gier',
      'house_number': '4',
      'street': 'Rue des Rangiers',
      'zip': 2350
    },
    'coordinates': [6.999138, 47.256808]
  },
  'name': 'Saignel\u00e9gier Bistro'
}, {
  'id': 2106,
  'location': {
    'address': {
      'city': 'Porrentruy',
      'house_number': '3',
      'street': 'Sur les Ponts',
      'zip': 2900
    },
    'coordinates': [7.077826, 47.417147]
  },
  'name': 'Porrentruy'
}, {
  'id': 2153,
  'location': {
    'address': {
      'city': 'Appenzell',
      'house_number': '13',
      'street': 'Zielstrasse',
      'zip': 9050
    },
    'coordinates': [9.407329, 47.33363]
  },
  'name': 'Appenzell Bistro'
}, {
  'id': 2080,
  'location': {
    'address': {
      'city': 'Gstaad',
      'house_number': '20',
      'street': 'Untergstaadstrasse',
      'zip': 3780
    },
    'coordinates': [7.283387, 46.476554]
  },
  'name': 'Gstaad'
}, {
  'id': 3262,
  'location': {
    'address': {
      'city': 'Neuch\u00e2tel',
      'house_number': '10',
      'street': 'Rue de la Pierre-\u00e0-Mazel',
      'zip': 2000
    },
    'coordinates': [6.943219, 46.995383]
  },
  'name': 'Neuch\u00e2tel Maladi\u00e8re'
}, {
  'id': 3747,
  'location': {
    'address': {
      'city': 'Neuch\u00e2tel',
      'house_number': '10',
      'street': 'Rue de la Pierre-\u00e0-Mazel',
      'zip': 2000
    },
    'coordinates': [6.943219, 46.995383]
  },
  'name': 'Neuch\u00e2tel Maladi\u00e8re Ca\'Pucci'
}, {
  'id': 2634,
  'location': {
    'address': {
      'city': 'Neuch\u00e2tel',
      'house_number': '3',
      'street': 'Rue des Epancheurs',
      'zip': 2000
    },
    'coordinates': [6.930097, 46.989937]
  },
  'name': 'Neuch\u00e2tel'
}, {
  'id': 2143,
  'location': {
    'address': {
      'city': 'Kreuzlingen',
      'house_number': '16',
      'street': 'Sonnenstrasse',
      'zip': 8280
    },
    'coordinates': [9.173254, 47.650622]
  },
  'name': 'Kreuzlingen Karussell'
}, {
  'id': 4270,
  'location': {
    'address': {
      'city': 'Kreuzlingen',
      'house_number': '16',
      'street': 'Sonnenstrasse',
      'zip': 8280
    },
    'coordinates': [9.173254, 47.650622]
  },
  'name': 'Kreuzlingen Ca\'Puccini'
}, {
  'id': 2158,
  'location': {
    'address': {
      'city': 'Amriswil',
      'house_number': '18',
      'street': 'Bahnhofstrasse',
      'zip': 8580
    },
    'coordinates': [9.301973, 47.547394]
  },
  'name': 'Amriswil Bistro'
}, {
  'id': 3580,
  'location': {
    'address': {
      'city': 'Sierre',
      'house_number': '3',
      'street': 'Avenue Max Huber',
      'zip': 3960
    },
    'coordinates': [7.534826, 46.293955]
  },
  'name': 'Sierre'
}, {
  'id': 2473,
  'location': {
    'address': {
      'city': 'Bulle',
      'house_number': '50',
      'street': 'Route de Riaz',
      'zip': 1630
    },
    'coordinates': [7.060066, 46.625016]
  },
  'name': 'Bulle Le Caro'
}, {
  'id': 2345,
  'location': {
    'address': {
      'city': 'Payerne',
      'house_number': '7',
      'street': 'Place du G\u00e9n\u00e9ral Guisan',
      'zip': 1530
    },
    'coordinates': [6.941864, 46.822116]
  },
  'name': 'Payerne Bistro'
}, {
  'id': 2141,
  'location': {
    'address': {
      'city': 'St. Gallen',
      'house_number': '6',
      'street': 'Favrestrasse',
      'zip': 9016
    },
    'coordinates': [9.413162, 47.437906]
  },
  'name': 'St. Gallen Gallusmarkt'
}, {
  'id': 4461,
  'location': {
    'address': {
      'city': 'Chur',
      'house_number': '35',
      'street': 'Rasch\u00e4renstrasse',
      'zip': 7000
    },
    'coordinates': [9.508287, 46.84746]
  },
  'name': 'Chur West'
}, {
  'id': 2155,
  'location': {
    'address': {
      'city': 'Landquart',
      'house_number': '5',
      'street': 'Werkst\u00e4tterstrasse',
      'zip': 7302
    },
    'coordinates': [9.556347, 46.966855]
  },
  'name': 'Landquart'
}, {
  'id': 2367,
  'location': {
    'address': {
      'city': 'Chur',
      'house_number': '36',
      'street': 'Quaderstrasse',
      'zip': 7000
    },
    'coordinates': [9.534594, 46.852443]
  },
  'name': 'Chur Quader'
}, {
  'id': 2156,
  'location': {
    'address': {
      'city': 'Romanshorn',
      'house_number': '41',
      'street': 'Alleestrasse',
      'zip': 8590
    },
    'coordinates': [9.377226, 47.56355]
  },
  'name': 'Romanshorn'
}, {
  'id': 2148,
  'location': {
    'address': {
      'city': 'Arbon',
      'house_number': '15',
      'street': 'St. Gallerstrasse',
      'zip': 9320
    },
    'coordinates': [9.430581, 47.511472]
  },
  'name': 'Arbon Novaseta'
}, {
  'id': 2467,
  'location': {
    'address': {
      'city': 'La Chaux-de-Fonds',
      'house_number': '151',
      'street': 'Avenue L\u00e9opold Robert',
      'zip': 2300
    },
    'coordinates': [6.816777, 47.094588]
  },
  'name': 'La Chaux-de-Fonds Entilles'
}, {
  'id': 2152,
  'location': {
    'address': {
      'city': 'Rorschach',
      'house_number': '12',
      'street': 'Marktplatz',
      'zip': 9400
    },
    'coordinates': [9.490971, 47.478019]
  },
  'name': 'Rorschach'
}, {
  'id': 2874,
  'location': {
    'address': {
      'city': 'Tenero',
      'house_number': '8',
      'street': 'Via Br\u00e9re',
      'zip': 6598
    },
    'coordinates': [8.855501, 46.174745]
  },
  'name': 'Tenero'
}, {
  'id': 3559,
  'location': {
    'address': {
      'city': 'Tenero',
      'house_number': '8',
      'street': 'Via Br\u00e9re',
      'zip': 6598
    },
    'coordinates': [8.855501, 46.174745]
  },
  'name': 'Tenero CremAmore'
}, {
  'id': 2098,
  'location': {
    'address': {
      'city': 'Sion',
      'house_number': '44',
      'street': 'Place du Midi',
      'zip': 1950
    },
    'coordinates': [7.362755, 46.231271]
  },
  'name': 'Sion'
}, {
  'id': 2145,
  'location': {
    'address': {
      'city': 'Heerbrugg',
      'house_number': '203',
      'street': 'Balgacherstrasse',
      'zip': 9435
    },
    'coordinates': [9.624605, 47.409664]
  },
  'name': 'Heerbrugg'
}, {
  'id': 2059,
  'location': {
    'address': {
      'city': 'Bellinzona',
      'house_number': '2',
      'street': 'Via G. Guisan',
      'zip': 6500
    },
    'coordinates': [9.024798, 46.194718]
  },
  'name': 'Bellinzona Centro'
}, {
  'id': 3707,
  'location': {
    'address': {
      'city': 'Moudon',
      'house_number': '2A',
      'street': 'Avenue de Cerjat',
      'zip': 1510
    },
    'coordinates': [6.800228, 46.668215]
  },
  'name': 'Moudon Bistro'
}, {
  'id': 4057,
  'location': {
    'address': {
      'city': 'Conthey',
      'house_number': '2',
      'street': 'Rue de la Madeleine',
      'zip': 1964
    },
    'coordinates': [7.295797, 46.223965]
  },
  'name': 'Conthey Bassin'
}, {
  'id': 2101,
  'location': {
    'address': {
      'city': 'Oron-La-Ville',
      'house_number': '31',
      'street': 'Route de Lausanne',
      'zip': 1610
    },
    'coordinates': [6.82028, 46.570631]
  },
  'name': 'Oron-La-Ville'
}, {
  'id': 2125,
  'location': {
    'address': {
      'city': 'La Tour-De-Peilz',
      'house_number': '6',
      'street': 'Place des Anciens Foss\u00e9s',
      'zip': 1814
    },
    'coordinates': [6.857478, 46.453134]
  },
  'name': 'La Tour-de-Peilz'
}, {
  'id': 2122,
  'location': {
    'address': {
      'city': 'Yverdon',
      'house_number': '1',
      'street': 'Rue d\'Orbe',
      'zip': 1400
    },
    'coordinates': [6.636221, 46.780348]
  },
  'name': 'Yverdon Bel-Air'
}, {
  'id': 2666,
  'location': {
    'address': {
      'city': 'Montagny-pr\u00e8s-Yverdon',
      'house_number': '5',
      'street': 'En Chamard',
      'zip': 1442
    },
    'coordinates': [6.620675, 46.789935]
  },
  'name': 'Montagny-pr\u00e8s-Yverdon'
}, {
  'id': 2150,
  'location': {
    'address': {
      'city': 'Davos Platz',
      'house_number': '1',
      'street': 'Bahnhofstrasse',
      'zip': 7270
    },
    'coordinates': [9.820724, 46.792914]
  },
  'name': 'Davos'
}, {
  'id': 4050,
  'location': {
    'address': {
      'city': 'Canobbio',
      'house_number': '5',
      'street': 'Via Sonvico',
      'zip': 6952
    },
    'coordinates': [8.967566, 46.028321]
  },
  'name': 'Canobbio Ipermercato Resega'
}, {
  'id': 2470,
  'location': {
    'address': {
      'city': 'Collombey',
      'house_number': '',
      'street': 'Route du Montagnier',
      'zip': 1868
    },
    'coordinates': [6.953772, 46.264962]
  },
  'name': 'Collombey'
}, {
  'id': 2126,
  'location': {
    'address': {
      'city': 'Orbe',
      'house_number': '1',
      'street': 'Route de Valeyres',
      'zip': 1350
    },
    'coordinates': [6.531194, 46.732261]
  },
  'name': 'Orbe'
}, {
  'id': 2542,
  'location': {
    'address': {
      'city': 'Lausanne',
      'house_number': '4',
      'street': 'Avenue du Th\u00e9\u00e2tre',
      'zip': 1002
    },
    'coordinates': [6.635131, 46.518736]
  },
  'name': 'Lausanne Saint-Fran\u00e7ois'
}, {
  'id': 2118,
  'location': {
    'address': {
      'city': 'Lausanne',
      'house_number': '24-30',
      'street': 'Rue Saint-Laurent',
      'zip': 1003
    },
    'coordinates': [6.630459, 46.522653]
  },
  'name': 'Lausanne Au Centre'
}, {
  'id': 5300,
  'location': {
    'address': {
      'city': 'Lausanne',
      'house_number': '24-30',
      'street': 'Rue Saint-Laurent',
      'zip': 1003
    },
    'coordinates': [6.630459, 46.522653]
  },
  'name': 'Au Centre Take it'
}, {
  'id': 2121,
  'location': {
    'address': {
      'city': 'Prilly',
      'house_number': '28',
      'street': 'Route de Cossonay',
      'zip': 1008
    },
    'coordinates': [6.606119, 46.534208]
  },
  'name': 'Prilly Centre'
}, {
  'id': 2428,
  'location': {
    'address': {
      'city': 'Martigny',
      'house_number': ' 53',
      'street': 'Avenue de Fully',
      'zip': 1920
    },
    'coordinates': [7.075245, 46.111007]
  },
  'name': 'Martigny Cristal'
}, {
  'id': 2264,
  'location': {
    'address': {
      'city': 'Crissier',
      'house_number': '1',
      'street': 'Chemin du Saugy',
      'zip': 1023
    },
    'coordinates': [6.57002, 46.544958]
  },
  'name': 'Crissier'
}, {
  'id': 4046,
  'location': {
    'address': {
      'city': 'Crissier',
      'house_number': '1',
      'street': 'Chemin du Saugy',
      'zip': 1023
    },
    'coordinates': [6.57002, 46.544958]
  },
  'name': 'Crissier CremAmore'
}, {
  'id': 2123,
  'location': {
    'address': {
      'city': 'Ecublens',
      'house_number': '3',
      'street': 'Chemin du Croset',
      'zip': 1024
    },
    'coordinates': [6.566198, 46.533702]
  },
  'name': 'Ecublens'
}, {
  'id': 2383,
  'location': {
    'address': {
      'city': 'St. Moritz',
      'house_number': '20',
      'street': 'Via dal Bagn',
      'zip': 7500
    },
    'coordinates': [9.83506, 46.490898]
  },
  'name': 'St. Moritz Bellevue Bistro'
}, {
  'id': 3364,
  'location': {
    'address': {
      'city': 'Aclens',
      'house_number': '',
      'street': 'Route de la Plaine',
      'zip': 1123
    },
    'coordinates': [6.52358, 46.565645]
  },
  'name': 'Aclens personnel'
}, {
  'id': 2124,
  'location': {
    'address': {
      'city': 'Morges',
      'house_number': '4',
      'street': 'Rue des Foss\u00e9s',
      'zip': 1110
    },
    'coordinates': [6.496548, 46.508991]
  },
  'name': 'Morges Charpentiers'
}, {
  'id': 2058,
  'location': {
    'address': {
      'city': 'Serfontana',
      'house_number': '',
      'street': 'Centro Commerciale Serfontana',
      'zip': 6836
    },
    'coordinates': [9.016277, 45.845359]
  },
  'name': 'Serfontana'
}, {
  'id': 2348,
  'location': {
    'address': {
      'city': 'Allaman',
      'house_number': '10',
      'street': 'Route de la Gare',
      'zip': 1165
    },
    'coordinates': [6.402704, 46.477146]
  },
  'name': 'Allaman K.'
}, {
  'id': 2568,
  'location': {
    'address': {
      'city': 'Vich',
      'house_number': '',
      'street': 'Chemin de la Bichette',
      'zip': 1267
    },
    'coordinates': [6.254805, 46.424159]
  },
  'name': 'Vich'
}, {
  'id': 2115,
  'location': {
    'address': {
      'city': 'Signy',
      'house_number': '7a',
      'street': 'Rue des Fl\u00e9ch\u00e8res',
      'zip': 1274
    },
    'coordinates': [6.205944, 46.397629]
  },
  'name': 'Signy'
}, {
  'id': 2110,
  'location': {
    'address': {
      'city': 'Gen\u00e8ve',
      'house_number': '5',
      'street': 'Rue Jargonnant',
      'zip': 1207
    },
    'coordinates': [6.160029, 46.200487]
  },
  'name': 'Gen\u00e8ve Eaux-Vives'
}, {
  'id': 2114,
  'location': {
    'address': {
      'city': 'Gen\u00e8ve',
      'house_number': '90',
      'street': 'Rue de Montbrillant',
      'zip': 1202
    },
    'coordinates': [6.141922, 46.220344]
  },
  'name': 'Gen\u00e8ve Montbrillant'
}, {
  'id': 2113,
  'location': {
    'address': {
      'city': 'Gen\u00e8ve',
      'house_number': '5',
      'street': 'Rue du Commerce',
      'zip': 1204
    },
    'coordinates': [6.145197, 46.20416]
  },
  'name': 'Gen\u00e8ve Fusterie'
}, {
  'id': 2107,
  'location': {
    'address': {
      'city': 'Gen\u00e8ve',
      'house_number': '83',
      'street': 'Rue de la Servette',
      'zip': 1201
    },
    'coordinates': [6.131664, 46.212452]
  },
  'name': 'Gen\u00e8ve Servette'
}, {
  'id': 4053,
  'location': {
    'address': {
      'city': 'Vernier',
      'house_number': '171',
      'street': 'Route de Meyrin',
      'zip': 1214
    },
    'coordinates': [6.095742, 46.221838]
  },
  'name': 'Vernier'
}, {
  'id': 4070,
  'location': {
    'address': {
      'city': 'Carouge',
      'house_number': '10',
      'street': 'Route des Jeunes',
      'zip': 1227
    },
    'coordinates': [6.128079, 46.179942]
  },
  'name': 'Carouge La Praille'
}, {
  'id': 2108,
  'location': {
    'address': {
      'city': 'Onex',
      'house_number': '17-19',
      'street': 'Rue des Bossons',
      'zip': 1213
    },
    'coordinates': [6.104576, 46.187701]
  },
  'name': 'Onex'
}, {
  'id': 2167,
  'location': {
    'address': {
      'city': 'Z\u00fcrich',
      'house_number': '50',
      'street': 'Baslerstrasse',
      'zip': 8048
    },
    'coordinates': [8.498772, 47.38636]
  },
  'name': 'Z\u00fcrich Letzipark Take it'
}, {
  'id': 2409,
  'location': {
    'address': {
      'city': 'Belp',
      'house_number': '3',
      'street': 'Sch\u00fctzenweg',
      'zip': 3123
    },
    'coordinates': [7.497424, 46.894099]
  },
  'name': 'Belp'
}, {
  'id': 2146,
  'location': {
    'address': {
      'city': 'Feuerthalen',
      'house_number': '30',
      'street': 'Sch\u00fctzenstrasse',
      'zip': 8245
    },
    'coordinates': [8.647417, 47.69069]
  },
  'name': 'Feuerthalen Rhymarkt'
}, {
  'id': 2529,
  'location': {
    'address': {
      'city': 'Luzern',
      'house_number': '18-20',
      'street': 'R\u00f6ssligasse',
      'zip': 6000
    },
    'coordinates': [8.30386, 47.052138]
  },
  'name': 'Luzern'
}, {
  'id': 2411,
  'location': {
    'address': {
      'city': 'Wangen bei Olten',
      'house_number': '17',
      'street': 'industriestrasse',
      'zip': 4612
    },
    'coordinates': [-0.161718, 44.890033]
  },
  'name': 'Wangen VZ'
}, {
  'id': 2649,
  'location': {
    'address': {
      'city': 'Lugano',
      'house_number': '22',
      'street': 'Via Nassa',
      'zip': 6900
    },
    'coordinates': [8.949716, 46.002659]
  },
  'name': 'Lugano'
}, {
  'id': 2069,
  'location': {
    'address': {
      'city': 'Bern',
      'house_number': '53',
      'street': 'Aarbergergasse',
      'zip': 3011
    },
    'coordinates': [7.442039, 46.949552]
  },
  'name': 'Bern Ryfflihof'
}, {
  'id': 3341,
  'location': {
    'address': {
      'city': 'Muri',
      'house_number': '',
      'street': 'Seetalstrasse',
      'zip': 5630
    },
    'coordinates': [8.340763, 47.272664]
  },
  'name': 'Muri AG'
}, {
  'id': 2532,
  'location': {
    'address': {
      'city': 'Zug',
      'house_number': '11',
      'street': 'Bundesplatz',
      'zip': 6304
    },
    'coordinates': [8.51433, 47.171505]
  },
  'name': 'Zug'
}];

function Search({ onSearch }) {
  return h("input", { type: "search",
    placeholder: "Search",
    onInput: event => onSearch(event.target.value),
    "class": "locations-search" });
}

class App extends Component {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this._onSelectLocation = location => {
      console.log('selected location', location);
    }, this._onSearch = search$$1 => {
      console.log('searching', search$$1);
    }, _temp;
  }

  render({}, { location }) {
    return h$1(
      'div',
      { 'class': 'page-content' },
      h$1(
        'div',
        { 'class': 'app-layout' },
        h$1(
          'nav',
          { 'class': 'nav' },
          h$1(Search, { onSearch: this._onSearch }),
          h$1(Locations, { locations: locations, onSelectLocation: this._onSelectLocation })
        ),
        h$1(
          'main',
          { 'class': 'content' },
          location ? h$1(Location$1, { location: location }) : []
        )
      )
    );
  }
}

render(h$1(App, null), document.body);

}());
//# sourceMappingURL=app.js.map

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

const API_BASE = 'https://themachine.jeremystucki.com/coop/api/v2';

const encode = encodeURIComponent;

function fetchLocation(location) {
  return fetch(`${API_BASE}/locations/${encode(location)}`).then(resp => resp.json());
}

function fetchLocationMenus(location) {
  return fetch(`${API_BASE}/locations/${encode(location)}/menus/today`).then(resp => resp.json());
}

function fetchLocations() {
  return fetch(`${API_BASE}/locations`).then(resp => resp.json()).then(({ results }) => {
    return results.sort((a, b) => a.name.localeCompare(b.name));
  });
}

function fetchLocationsByPosition(latitude, longitude) {
  return fetch(`${API_BASE}/locations?latitude=${encode(latitude)}&longitude=${encode(longitude)}`).then(resp => resp.json()).then(({ results }) => results);
}

const formatDistance = distance => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  }

  return `${Math.round(distance / 10) / 100}km`;
};

class Locations extends Component {
  constructor() {
    super();

    this._onChange = location => {
      return event => {
        event.preventDefault();

        this.props.onChange(location);
      };
    };

    this._onInput = event => {
      const search = event.target.value.toLowerCase();

      this.setState({ search: search });
    };

    this.state.locations = [];
    this.state.filteredLocations = [];
    this.state.search = null;
    this.state.loadedByPosition = false;
  }

  _getFilteredLocations() {
    if (!this.state.search) {
      return this.state.locations;
    }

    const search = this.state.search.toLowerCase();

    return this.state.locations.map(location => ({ location, match: location.name.toLowerCase().indexOf(search) })).filter(({ match }) => match > -1).sort((a, b) => a.match > b.match).map(({ location }) => location);
  }

  componentDidMount() {
    fetchLocations().then(locations => {
      if (!this.state.loadedByPosition) {
        this.setState({ locations });
      }
    });

    navigator.geolocation.getCurrentPosition(({ coords }) => {
      fetchLocationsByPosition(coords.latitude, coords.longitude).then(locations => {
        this.setState({ locations, loadedByPosition: true });
        this.props.onChange(locations[0].id);
      });
    });
  }

  render({ onSelectLocation }, {}) {
    const locations = this._getFilteredLocations();

    return h(
      'div',
      null,
      h('input', { type: 'search', placeholder: 'Search', onInput: this._onInput, 'class': 'locations-search' }),
      h(
        'ul',
        { 'class': 'locations-list' },
        locations.map(location => h(
          'li',
          { 'class': 'location' },
          h(
            'a',
            { href: '#', onClick: this._onChange(location.id) },
            location.name,
            h(
              'span',
              { 'class': 'distance' },
              location.distance ? `${formatDistance(location.distance)} away` : ''
            )
          )
        ))
      )
    );
  }
}

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

class Location extends Component {
  constructor() {
    super();

    this.state.location = {};
    this.state.menus = [];
  }

  componentWillMount() {
    this._fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this._fetchData(nextProps);
  }

  render({ location: _location }, { location, menus }) {
    return h(
      'article',
      null,
      h(
        'h1',
        null,
        location.name
      ),
      h(
        'div',
        { 'class': 'menu-items' },
        menus.map(menu => h(Menu, { menu: menu }))
      )
    );
  }

  _fetchData({ location }) {
    let requests = Promise.all([fetchLocation(location), fetchLocationMenus(location)]);

    return requests.then(([location, menus]) => this.setState({ location: location, menus: menus.results }));
  }
}

class App extends Component {
  constructor(...args) {
    var _temp;

    return _temp = super(...args), this._onLocationChange = location => {
      this.setState({ location });
    }, _temp;
  }

  render({}, { location }) {
    return h(
      'div',
      { 'class': 'page-content' },
      h(
        'div',
        { 'class': 'app-layout' },
        h(
          'nav',
          { 'class': 'nav' },
          h(Locations, { onChange: this._onLocationChange })
        ),
        h(
          'main',
          { 'class': 'content' },
          location ? h(Location, { location: location }) : []
        )
      )
    );
  }
}

render(h(App, null), document.body);

}());
//# sourceMappingURL=app.js.map

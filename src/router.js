import {
  $,
  Time,
  isNullish,
  isEmpty,
  sleep,
  noop,
  getScrollTop,
} from '/src/utils.js';

function replaceHash(path, replace = true) {
  if (replace) {
    const i = location.href.indexOf('#');
    location.replace(location.href.slice(0, i >= 0 ? i : 0) + '#' + path);
    return;
  }
  window.location.hash = path;
}

export function getCurrentPath(prefix = true) {
  const href = location.href;
  const index = href.indexOf('#');
  return index === -1 ? '' : href.slice(index + 1).replace(new RegExp('^/'), prefix ? '/' : '');
}

class Route {
  name;
  element;
  parent;
  routes = new Map();
  callback = noop;
  scrollTop = 0;

  constructor(name) {
    this.name = name;
  }
}

export class Router {
  routes = new Map();
  elements = [];
  listeners = [];
  currentRoute;

  constructor() {
    window.addEventListener('load', this._process.bind(this));
    window.addEventListener('hashchange', this._process.bind(this));
    window.addEventListener('scroll', event => {
      const route = this.currentRoute;
      route.scrollTop = getScrollTop();
    });
    const path = getCurrentPath();
    replaceHash(isEmpty(path) ? '/' : path);
  }

  _process(event) {
    const path = getCurrentPath();
    const segments = path.split(/(?=[\/])/g);
    let parent;
    for (const segment of segments) {
      if (!parent) parent = this;
      let route = parent.routes.get(segment);
      if (!route) return replaceHash('/404');
      parent = route;
    }
    if (!parent.element) return replaceHash('/404');
    this.elements.forEach(el => {
      if (el === parent.element) return;
      el.classList.remove('active');
    });
    sleep(0)
      .then(() => parent.element.classList.add('active'))
      .then(() => window.scrollTo({
        top: parent.scrollTop,
      }))
    this.currentRoute = parent;
    for (const callback of this.listeners) callback.call(this, event);
    parent.callback.call(this, parent);
  }

  onChange(callback) {
    this.listeners.push(callback);
  }

  route(path, el, callback = noop, options) {
    const segments = path.split(/(?=[\/])/g);
    let parent;
    for (const segment of segments) {
      if (!parent) parent = this;
      let route = parent.routes.get(segment);
      if (!route) {
        route = new Route(segment);
        route.parent = parent;
        route.callback = callback;
        parent.routes.set(segment, route);
      }
      parent = route;
    }
    if (el) {
      if (typeof el === 'string') el = $(el);
      this.elements.push(parent.element = el);
    }
    return parent;
  }

  push(path, history = false) {
    if (!path.startsWith('/')) path = '/' + path;
    replaceHash(path, !history);
  }
}

export default Router;
import {
  $,
  Time,
  isNullish,
  isEmpty,
  sleep,
  noop
} from '/src/utils.js';

function replaceHash(path) {
  const i = location.href.indexOf('#');
  location.replace(location.href.slice(0, i >= 0 ? i : 0) + '#' + path);
}

function getCurrentPath() {
  const href = location.href;
  const index = href.indexOf('#');
  return index === -1 ? '' : href.slice(index + 1);
}

class Route {
  name;
  element;
  parent;
  routes = new Map();
  callback = noop;

  constructor(name) {
    this.name = name;
  }
}

export class Router {
  routes = new Map();
  elements = [];
  listeners = [];

  constructor() {
    window.addEventListener('load', this._process.bind(this));
    window.addEventListener('hashchange', this._process.bind(this));
    const path = getCurrentPath();
    if (isEmpty(path)) replaceHash('/');
    if (!path.startsWith('/')) replaceHash('/' + path);
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
      sleep(Time.second * 0.4).then(() => {
        if (el.classList.contains('active')) return;
      });
    });
    sleep(40).then(() => parent.element.classList.add('active'));
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
    if (!!el) {
      if (typeof el === 'string') el = $(el);
      this.elements.push(parent.element = el);
    }
    return parent;
  }

  push(path) {
    replaceHash(path);
  }
}

export default Router;
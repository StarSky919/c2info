const $ = function(selector) {
    try {
        const nodes = document.querySelectorAll(selector);
        return nodes.length > 1 ? nodes : nodes[0];
    } catch (e) {
        return null;
    }
};

Node.prototype.$ = function(selector) {
    try {
        const nodes = this.querySelectorAll(selector);
        return nodes.length > 1 ? nodes : nodes[0];
    } catch (e) {
        return null;
    }
};

Node.prototype.hasClass = function(cls) {
    const classList = this.classList;
    for (let i in classList) {
        if (classList[i] == cls) {
            return true;
        }
    }
    return false;
}

Node.prototype.addClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            if (this.hasClass(cls[i])) { return this; }
            this.classList.add(cls[i]);
        }
        return this;
    }
    this.classList.add(cls);
    return this;
}

Node.prototype.removeClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            if (!this.hasClass(cls[i])) { return this; }
            this.classList.remove(cls[i]);
        }
        return this;
    }
    this.classList.remove(cls);
    return this;
}

Node.prototype.toggleClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            this.classList.toggle(cls[i]);
        }
        return this;
    }
    this.classList.toggle(cls);
    return this;
}

Node.prototype.css = function(css) {
    this.style.cssText = css;
    return this;
}

Node.prototype.addCSS = function(css) {
    this.style.cssText += css;
    return this;
}

Node.prototype.getAttr = function(name) {
    this.getAttribute(name);
    return this;
}

Node.prototype.setAttr = function(name, value) {
    this.setAttribute(name, value);
    return this;
}

Node.prototype.removeAttr = function(name, value) {
    this.removeAttribute(name);
    return this;
}

Node.prototype.setHtml = function(html) {
    this.innerHTML = html;
    return this;
}

Node.prototype.getHtml = function() {
    return this.innerHTML;
}

Node.prototype.setText = function(text) {
    this.innerText = text;
    return this;
}

Node.prototype.getText = function() {
    return this.innerText;
}

Node.prototype.bindEvent = function(type, callback, option) {
    this.addEventListener(type, function(event) {
        const target = event.target;
        callback.call(target, event);
    }, option);
    return this;
};

Node.prototype.removeEvent = function(type, func) {
    this.removeEventListener(type, func);
    return this;
}

NodeList.prototype.bindEvent = function(type, callback, option) {
    for (let [index, elem] of this.entries()) {
        elem.bindEvent(type, callback, option);
    }
    return this;
}

NodeList.prototype.removeEvent = function(type, func) {
    for (let [index, elem] of this.entries()) {
        elem.removeEventListener(type, func);
    }
    return this;
}

window.bindEvent = function(type, callback, option) {
    this.addEventListener(type, function(event) {
        const target = event.target;
        callback.call(target, event);
    }, option);
    return this;
};

window.removeEvent = function(type, func) {
    this.removeEventListener(type, func);
    return this;
}

Node.prototype.exec = function(callback) {
    callback.call(this, 0);
    return this;
}

NodeList.prototype.exec = function(callback) {
    for (let [index, elem] of this.entries()) {
        callback.call(elem, index);
    }
    return this;
}

const createElement = function({ tag, id, classList, css, innerHTML, innerText }) {
    if (!tag) { return; }
    const element = document.createElement(tag);
    id ? element.id = id : false;
    classList ? element.addClass(classList) : false;
    css ? element.css(css) : false;
    innerHTML ? element.setHtml(innerHTML) : false;
    innerText ? element.setText(innerText) : false;
    return element;
}

const createFrag = function() {
    return document.createDocumentFragment();
}

const domToString = function(obj) {
    const element = createElement({ tag: 'div' });
    element.appendChild(obj);
    return element.innerHTML;
}

const scrollTo = function(top) {
    window.scrollTo({
        top: top,
        behavior: 'smooth'
    });
}

const getWidth = function() {
    return document.body.offsetWidth || document.body.scrollWidth;
}

const getScrollTop = function() {
    return document.body.scrollTop || document.documentElement.scrollTop || window.pageYOffset;
}

const getScrollHeight = function() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
}

const cookie = {
    set: function(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = 'expires=' + date.toGMTString();
        document.cookie = `${name}=${value};${expires};path=/`;
    },
    get: function(cname) {
        const name = cname + '=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    },
    del: function(name) {
        this.set(name, null, -1);
    }
}

const copy = function(obj) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(obj);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
}

const random = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

const isJSON = function(str) {
    if (typeof str != 'string') {
        return false;
    }

    try {
        const json = JSON.parse(str);
        if (json && typeof json == 'object') {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

const timeout = function(delay) {
    return new Promise(function(resolve) {
        setTimeout(resolve, delay);
    });
}

const debounce = function(callback, delay) {
    let timeout;
    return function() {
        clearTimeout(timeout);
        const [that, args] = [this, arguments];
        timeout = setTimeout(function() {
            callback.apply(that, args);
            clearTimeout(timeout);
            timeout = null;
        }, delay);
    }
}

const throttle = function(callback, delay) {
    let timer;
    return function() {
        if (timer) { return; }
        const [that, args] = [this, arguments];
        timer = setTimeout(function() {
            clearTimeout(timer);
            timer = null;
            callback.apply(that, args);
        }, delay);
    }
}

const toast = function(msg, sec = 2.5, callback) {
    const toast = createElement({
        tag: 'div',
        classList: 'toast',
        css: `animation: fade-in 0.25s, fade-out 0.25s ${sec - 0.25}s;`,
        innerText: msg
    });
    $('body').appendChild(toast);
    timeout(sec * 1000).then(function() {
        $('body').removeChild(toast);
        callback.call(null);
    });
}

class Ajax {
    constructor() {}

    request({ method = 'get', url = '', data = {}, responseType = 'Text' }) {
        return new Promise(function(resolve) {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.responseType = responseType;
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    switch (xhr.status) {
                        case 200:
                            resolve({ status: xhr.status, response: isJSON(xhr.response) ? JSON.parse(xhr.response) : xhr.response });
                            break;
                        default:
                            resolve({ status: xhr.status, response: null });
                            break;
                    }
                }
            }
            xhr.send(JSON.stringify(data));
        });
    }

    get(url) {
        return this.request({
            method: 'get',
            url: url
        }).then(function({ status, response }) {
            if (status == 200) {
                return response;
            }
        });
    }

    post(url, data) {
        return this.request({
            method: 'post',
            url: url,
            data: data
        }).then(function({ status, response }) {
            if (status == 200) {
                return response;
            }
        });
    }
}

/*----------------*/

window.ajax = new Ajax();
let globalData = {
    btMinHeight: 0
};

//Back-to-Top Button ↓↓↓

const bt = createElement({
    tag: 'i',
    id: 'bt',
    classList: ['fa', 'fa-arrow-up']
}).bindEvent('click', function(e) {
    scrollTo(0);
});
$('body').appendChild(bt);

window.bindEvent('scroll', function(e) {
    getScrollTop() > globalData.btMinHeight ? bt.addClass('display') : bt.removeClass('display');
});

//Back-to-Top Button ↑↑↑

//Navigation Bar ↓↓↓

const contentHeights = new Map();
const toggleNav = function() {
    this.checked ? $(`.content[data-id=${this.id}]`).style.height = contentHeights.get(this.id) + 'px' : $(`.content[data-id=${this.id}]`).style.height = 0 + 'px';
}
const closeMenu = function() {
    $('#navcb1').checked = false;
}
const refreshNav = function() {
    $('#items .content').exec(function(i) {
        contentHeights.set(this.dataset.id, this.offsetHeight);
        toggleNav.call($(`#${this.dataset.id}`));
    });
    $('.titlecb').removeEvent('click', toggleNav).bindEvent('click', toggleNav);
    $('#items .content a').removeEvent('click', closeMenu);
    $('#items .content a[data-scroll]') ? $('#items .content a[data-scroll]').bindEvent('click', function(e) {
        closeMenu();
        scrollTo($(`#${this.dataset.scroll}`).offsetTop - 50);
    }) : false;
    $('#items .content a:not([href])') ? $('#items .content a:not([href])').exec(function(i) {
        this.href = 'javascript: void(0)';
    }) : false;
}

if ($('.titlecb') && $('.content')) {
    timeout(250).then(function() {
        refreshNav();
    });
}

//Navigation Bar ↑↑↑

$('main').bindEvent('click', function(e) {
    $('#navcb1') ? $('#navcb1').checked = false : false;
});

$('main a[href],#items a[href]').exec(function(e) {
    if (!this.href.includes(document.domain)) {
        this.innerHTML += domToString(createElement({
            tag: 'i',
            classList: ['fa', 'fa-external-link'],
            css: 'font-size: 0.85em; margin-left: 0.1rem; vertical-align: -5%;'
        }));
    }
});
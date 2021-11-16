'use strict'

const $ = function(selector) {
    try {
        const nodes = document.querySelectorAll(selector);
        return nodes.length > 1 ? nodes : nodes[0];
    } catch (e) {
        return null;
    }
};

Element.prototype.$ = function(selector) {
    try {
        const nodes = this.querySelectorAll(selector);
        return nodes.length > 1 ? nodes : nodes[0];
    } catch (e) {
        return null;
    }
};

Element.prototype.hasClass = function(cls) {
    const classList = this.classList;
    for (let i in classList) {
        if (classList[i] == cls) {
            return true;
        }
    }
    return false;
}

Element.prototype.addClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            if (this.hasClass(cls[i])) { return; }
            this.classList.add(cls[i]);
        }
        return;
    }
    this.classList.add(cls);
}

Element.prototype.removeClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            if (!this.hasClass(cls[i])) { return; }
            this.classList.remove(cls[i]);
        }
        return;
    }
    this.classList.remove(cls);
}

Element.prototype.toggleClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
            this.classList.toggle(cls[i]);
        }
        return;
    }
    this.classList.toggle(cls);
}

Element.prototype.css = function(css) {
    this.style.cssText = css;
}

Element.prototype.addCSS = function(css) {
    this.style.cssText += css;
}

Element.prototype.bindEvent = function(type, callback, option) {
    this.addEventListener(type, function(event) {
        const target = event.target;
        callback.call(target, event);
    }, option);
};

Element.prototype.removeEvent = function(type, func) {
    this.removeEventListener(type, func);
}

NodeList.prototype.bindEvent = function(type, callback, option) {
    for (let [index, elem] of this.entries()) {
        elem.bindEvent(type, callback, option);
    }
}

NodeList.prototype.removeEvent = function(type, func) {
    for (let [index, elem] of this.entries()) {
        elem.removeEventListener(type, func);
    }
}

window.bindEvent = function(type, callback, option) {
    this.addEventListener(type, function(event) {
        const target = event.target;
        callback.call(target, event);
    }, option);
};

window.removeEvent = function(type, func) {
    this.removeEventListener(type, func);
}

Element.prototype.exec = function(callback) {
    callback.call(this, 0);
}

NodeList.prototype.exec = function(callback) {
    for (let [index, elem] of this.entries()) {
        callback.call(elem, index);
    }
}

const createElement = function({ tag, id, classList, innerHTML }) {
    if (!tag) { return; }
    const element = document.createElement(tag);
    id ? element.id = id : false;
    classList ? element.addClass(classList) : false;
    innerHTML ? element.innerHTML = innerHTML : false;
    return element;
}

const createFrag = function() {
    return document.createDocumentFragment();
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
    return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
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

$('#noscript') ? $('#noscript').remove() : false;

const ajax = new Ajax();
window.data = {
    btMinHeight: 0
};

//Back-to-Top Button ↓↓↓

const bt = createElement({
    tag: 'i',
    id: 'bt',
    classList: ['fa', 'fa-arrow-up']
});
bt.bindEvent('click', function(e) {
    scrollTo(0);
});
$('body').appendChild(bt);

const refreshBT = function() {
    if (getScrollHeight() > window.screen.height) {
        bt.dataset.enable = true;
    } else {
        bt.dataset.enable = false;
    }
}
refreshBT();

const btObserver = new MutationObserver(refreshBT);
btObserver.observe($('main'), {
    attributes: true,
    childList: true,
    subtree: true
});

window.bindEvent('scroll', function(e) {
    if (!bt.dataset.enable) { return; }
    getScrollTop() > window.data.btMinHeight ? bt.addClass('display') : bt.removeClass('display');
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
    $('.titlecb').removeEvent('click', toggleNav);
    $('.titlecb').bindEvent('click', toggleNav);
    $('#items .content a').removeEvent('click', closeMenu);
    $('#items .content a[data-scroll]') ? $('#items .content a[data-scroll]').bindEvent('click', closeMenu) : false;
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
'use strict'

const $ = function(selector) {
    let nodes = document.querySelectorAll(selector);
    return nodes.length > 1 ? nodes : nodes[0];
};

Element.prototype.$ = function(selector) {
    let nodes = this.querySelectorAll(selector);
    return nodes.length > 1 ? nodes : nodes[0];
};

Element.prototype.hasClass = function(cls) {
    let classList = this.classList;
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

Element.prototype.bindEvent = function(type, selector, callback) {
    if (callback == null) {
        callback = selector;
        selector = null;
    }

    this.addEventListener(type, function(event) {
        let target = event.target;

        if (selector && target.matches(selector)) {
            callback.call(target, event);
        } else {
            callback.call(target, event);
        }
    });
};

NodeList.prototype.bindEvent = function(type, callback) {
    for (let [index, elem] of this.entries()) {
        elem.bindEvent(type, callback);
    }
}

window.bindEvent = function(type, callback) {
    this.addEventListener(type, function(event) {
        let target = event.target;
        callback.call(target, event);
    });
};

Element.prototype.exec = function(callback) {
    callback.call(this);
}

NodeList.prototype.exec = function(callback) {
    for (let [index, elem] of this.entries()) {
        callback.call(elem, index);
    }
}

const scrollTop = function() {
    return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
}

const scrollTo = function(top) {
    window.scrollTo({
        top: top,
        behavior: 'smooth'
    });
}

const getHeight = function() {
    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
}

const cookie = {
    set: function(name, value, days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        let expires = 'expires=' + date.toGMTString();
        document.cookie = `${name}=${value};${expires};path=/`;
    },
    get: function(cname) {
        let name = cname + '=';
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
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
    let selection = window.getSelection();
    let range = document.createRange();
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
        let json = JSON.parse(str);
        if (json && typeof json == 'object') {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        return false;
    }
}

class Ajax {
    constructor() {}

    request(config) {
        return new Promise(function(resolve) {
            let { method = 'get', url = '', data = {} } = config;
            let xhr = new XMLHttpRequest();
            xhr.open(method, url, true);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    let response = xhr.responseText;
                    resolve(isJSON(response) ? JSON.parse(response) : response);
                }
            }
            xhr.send(JSON.stringify(data));
        });
    }

    get(url) {
        return this.request({
            method: 'get',
            url: url,
        });
    }

    post(url, data) {
        return this.request({
            method: 'post',
            url: url,
            data: data
        });
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
        let that = this,
            args = arguments;
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
        let that = this,
            args = arguments;
        timer = setTimeout(function() {
            clearTimeout(timer);
            timer = null;
            callback.apply(that, args);
        }, delay);
    }
}

/*────────*/

const ajax = new Ajax();

let bt = document.createElement('i');
bt.id = 'bt';
bt.addClass(['fa', 'fa-arrow-up']);
bt.bindEvent('click', function(e) {
    scrollTo(0);
});
$('body').appendChild(bt);

window.btOption = {
    //CC: 0.75,
    minHeight: 0
}

const refreshBT = function() {
    if (getHeight() > window.screen.height) {
        bt.dataset.enable = true;
    } else {
        bt.dataset.enable = false;
    }
}

window.bindEvent('load', refreshBT);

let observer = new MutationObserver(refreshBT);
observer.observe($('main'), {
    attributes: true,
    childList: true,
    subtree: true
});

window.bindEvent('scroll', function(e) {
    if (!bt.dataset.enable) { return; }
    /*let btRight = (scrollTop() - btOption.minHeight) * btOption.CC >= 75 ? 25 : (scrollTop() - btOption.minHeight) * btOption.CC - 50;
    bt.style.right = `${btRight}px`;*/
    scrollTop() > window.btOption.minHeight ? bt.addClass('display') : bt.removeClass('display');
});

$('main').bindEvent('click', function(e) {
    $('#navcb1').checked = false;
});
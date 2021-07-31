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
            this.classList.add(cls[i]);
        }
        return;
    }
    this.classList.add(cls);
}

Element.prototype.removeClass = function(cls) {
    if (Array.isArray(cls)) {
        for (let i in cls) {
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

const timeOut = function(delay = 1000) {
    return new Promise(function(resolve) { setTimeout(resolve, delay) });
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
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
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
    return Math.round(Math.random() * (max - min + 1) + min);
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
                    resolve(JSON.parse(xhr.responseText));
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

/*────────*/

const ajax = new Ajax();

try {
    $('a:not(.title):not([href])').exec(function(i) {
        this.href = 'javascript: void(0)';
    });
} catch (e) {}

try {
    $('a[data-scroll]').exec(function(i) {
        this.href = 'javascript: void(0)';
    });

    $('a[data-scroll]').bindEvent('click', function(e) {
        if ($('#keyword') && !$('#keyword').value) {
            scrollTo($(`#${this.dataset.scroll}`).offsetTop);
            return;
        }
        scrollTo($(`#${this.dataset.scroll}`).offsetTop);
    });
} catch (e) {}
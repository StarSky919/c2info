const $ = function(elm) {
    return document.querySelector(elm)
};

const $a = function(elm) {
    return document.querySelectorAll(elm);
}

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

const scrollTop = function() {
    return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
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

const toast = function(msg, sec) {
    sec = sec || 2;
    let toast = document.createElement('div');
    toast.style.cssText = `display: block; position: fixed; line-height: 24px; left: 50%; bottom: 10vh; padding: 8px 24px; color: #FFFFFF; background: rgba(0, 0, 0, 0.6); -webkit-border-radius: 4px; border-radius: 4px; font-size: 16px; -webkit-transform: translateX(-50%); transform: translateX(-50%); -webkit-animation: fade-in 0.25s, fade-out 0.25s ${sec - 0.25}s; animation: fade-in 0.25s, fade-out 0.25s ${sec - 0.25}s; -webkit-animation-fill-mode: none, forwards; animation-fill-mode: none, forwards; z-index: 9999;`;
    toast.innerHTML = msg;
    $('body').appendChild(toast);
    setTimeout(function() {
        $('body').removeChild(toast);
    }, sec * 1000);
}

const random = function(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

const ajax = function(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('get', url);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            callback(xhr.responseText);
        }
    }
    xhr.send();
}

/*if ($('body').hasClass('back-top')) {
    let top = document.createElement('i');
    top.id = 'top';
    top.addClass(['fa', 'fa-arrow-up']);
    top.css('display: none; position: fixed; width: 50px; height: 50px; line-height: 50px; right: 25px; bottom: 25px; color: #000000; background: #FFFFFF; -webkit-border-radius: 50%; border-radius: 50%; -webkit-box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25); box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25); text-align: center; font-size: 1.125em;');
    top.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    $('body').appendChild(top);

    window.addEventListener('scroll', function() {
        if (scrollTop() >= 100) {
            $('#top').style.display = 'block';
        } else {
            $('#top').style.display = 'none';
        }
    });

};*/
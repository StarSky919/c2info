'use strict';

$('#search').style.display = 'block';
$('#loading').style.display = 'block';
$('#divide_1, #divide_2').exec(function(i) {
    this.style.display = 'block';
});
$('#noscript').remove();

cookie.del('song_name');
cookie.del('artist');
cookie.del('levels');

switch (cookie.get('filter')) {
    case 'song_name':
        cookie.set('filter', 'name', 365);
        break;
    case 'level':
        cookie.set('filter', 'constant', 365);
        break;
}

if (cookie.get('filter')) {
    $(`#${cookie.get('filter')}`).checked = true;
} else {
    cookie.set('filter', 'name', 365);
    $('#name').checked = true;
}

$('#search, #search_box').bindEvent('click', function(e) {
    $('#navcb1').checked = false;
});

$('#search_box').bindEvent('mouseover', function(e) {
    $('#filters').addClass('show');
});

$('#search_box').bindEvent('mouseout', function(e) {
    if (!$('#keyword').value) {
        $('#filters').removeClass('show');
    }
});

const getSpecialChart = function(data) {
    if (this.$('.constant_g')) {
        data += this.$('.constant_g').innerHTML;
    }
    return data;
}

const search = function() {
    let case_sensitive = $('#case_sensitive').checked;
    let input = case_sensitive ? $('#keyword').value : $('#keyword').value.toLowerCase();
    let counter = 0;

    $('#result, #divide_1').exec(function(e) {
        this.style.display = input ? 'block' : 'none';
    });

    input ? $('#songs').addClass('searching') : $('#songs').removeClass('searching');

    $('.list h2').exec(function(i) {
        this.style.display = input ? 'none' : 'block';
    });

    $('#egg_1').style.display = input == '114514' ? 'block' : 'none';
    $('#egg_2').style.display = input == (case_sensitive ? 'Graff.J' : 'graff.j') ? 'block' : 'none';

    if (input) {
        let data = '';
        let names = $('.song .name');
        let artists = $('.song .artist');
        let constants = $('.song .constant');

        $('.song').exec(function(i) {
            data = $('#name').checked ? names[i].innerHTML : $('#artist').checked ? artists[i].innerHTML : $('#constant').checked ? constants[i].innerHTML : '';
            data += $('#constant').checked ? getSpecialChart.call(this, data) : '';
            data = case_sensitive ? data : data.toLowerCase();

            if (data.indexOf(input) > -1) {
                this.removeClass('hidden');
                counter += 1;
            } else {
                this.addClass('hidden');
            }
        });

        $('#result').innerHTML = counter == 0 ? '搜索无结果' : `搜索到 ${counter} 个结果：`;
    } else {
        if ($('.song.hidden')) {
            $('.song.hidden').exec(function(i) {
                this.removeClass('hidden');
            });
        }
    }
}

const throttleSearch = throttle(search, 250);

$('#keyword').bindEvent('input', throttleSearch);

$('#clear').bindEvent('click', function(e) {
    $('#keyword').value = '';
    $('#keyword').focus();
    throttleSearch();
});

$('#filters input').bindEvent('click', function(e) {
    if (!$('#keyword').value) {
        $('#keyword').focus();
    }
});

$('#filters input[type=radio]').bindEvent('click', function(e) {
    cookie.set('filter', this.id, 365);
    throttleSearch();
});

$('#case_sensitive').checked = cookie.get('case_sensitive') == 'on' ? true : false;

$('#case_sensitive').bindEvent('click', function() {
    cookie.set('case_sensitive', $('#case_sensitive').checked ? 'on' : 'off', 365);
    throttleSearch();
});

(function(characters) {
    characters.id = 'characters';
    characters.addClass('item');
    characters.innerHTML = '<input type="checkbox" id="t1" class="titlecb" checked /><label for="t1"><a class="title arrow">角色列表</a></label><div class="content" data-id="t1">';
    $('#items').insertBefore(characters, $('#items').children[0]);
})(document.createElement('div'));

(async function() {
    if (localStorage.getItem('songData')) {
        try {
            JSON.parse(localStorage.getItem('songData'));
        } catch (e) {
            localStorage.removeItem('songData');
        }
    }

    let dataResponse = JSON.stringify(await ajax.get('https://cdn.jsdelivr.net/gh/StarSky919/c2info/songs.json'));

    if (!localStorage.getItem('songData') || localStorage.getItem('songData') != dataResponse) {
        $('#initializing').style.display = 'flex';
        localStorage.setItem('songData', dataResponse);
        timeout(100).then(function() {
            window.location.reload();
        });
        return;
    }

    let songData = JSON.parse(localStorage.getItem('songData'));
    let data = songData;

    (function renderNav() {
        Object.keys(data).forEach(function(key) {
            let a = document.createElement('a');
            a.href = 'javascript: void(0)';
            a.dataset.scroll = `${key}`;
            a.innerHTML = data[key].name;
            a.bindEvent('click', function(e) {
                if (!$('#keyword').value) {
                    scrollTo($(`#${this.dataset.scroll}`).offsetTop);
                }
            });
            $('.content[data-id=t1]').appendChild(a);
        });

        let contentHeight = new Map();

        const navInitialize = function() {
            if (this.checked) {
                $(`.content[data-id=${this.id}]`).style.height = contentHeight.get(this.id) + 'px';
            } else {
                $(`.content[data-id=${this.id}]`).style.height = 0 + 'px';
            }
        }
        $('#items .content').exec(function(i) {
            contentHeight.set(this.dataset.id, this.offsetHeight);
            navInitialize.call($(`#${this.dataset.id}`));
        });
        $('.titlecb').bindEvent('click', navInitialize);

        $('main, #menu, #items').bindEvent('click', function(e) {
            if ($('#keyword') && !$('#keyword').value) {
                $('#navcb2').checked = false;
            }
        });

        $('#items .content a').bindEvent('click', function(e) {
            $('#navcb1').checked = false;
        });
    })();

    (function renderSongs() {
        let listsFrag = document.createDocumentFragment();

        Object.keys(data).forEach(function(key) {
            let list = document.createElement('div');
            list.id = key;
            list.addClass('list');

            let title = document.createElement('h2');
            title.addClass('ul');
            title.innerHTML = data[key].name;
            list.appendChild(title);

            let songs = document.createElement('div');
            songs.addClass('songs');

            Object.values(data[key].songs).forEach(function(data) {
                let song = document.createElement('div');
                song.addClass('song');
                let songFrag = document.createDocumentFragment();

                let name = document.createElement('h3');
                name.addClass('name');
                name.innerHTML = data.title;
                songFrag.appendChild(name);

                let artist = document.createElement('p');
                artist.addClass('artist');
                artist.innerHTML = `曲师：${data.artist}`;
                songFrag.appendChild(artist);

                let bpm = document.createElement('p');
                bpm.innerHTML = `BPM：${data.bpm}`;
                songFrag.appendChild(bpm);

                if (data.chaos) {
                    let level_chaos = document.createElement('p');
                    level_chaos.innerHTML = `<strong>CHAOS ${data.chaos.level}</strong>`;
                    songFrag.appendChild(level_chaos);

                    let notes_chaos = document.createElement('p');
                    notes_chaos.innerHTML = `物量：${data.chaos.notes}`;
                    songFrag.appendChild(notes_chaos);

                    let constant_chaos = document.createElement('p');
                    constant_chaos.addClass('constant');
                    let constant = data.chaos.constant;
                    constant_chaos.innerHTML = `定数：${constant == 0 ? 'N/A' : constant.toFixed(1)}`;
                    songFrag.appendChild(constant_chaos);
                }

                if (data.glitch) {
                    let level_glitch = document.createElement('p');
                    level_glitch.innerHTML = `<strong>GLITCH ${data.glitch.level}</strong>`;
                    songFrag.appendChild(level_glitch);

                    let notes_glitch = document.createElement('p');
                    notes_glitch.innerHTML = `物量：${data.glitch.notes}`;
                    songFrag.appendChild(notes_glitch);

                    let constant_glitch = document.createElement('p');
                    constant_glitch.addClass('constant_g');
                    let constant = data.glitch.constant;
                    constant_glitch.innerHTML = `定数：${constant == 0 ? 'N/A' : constant.toFixed(1)}`;
                    songFrag.appendChild(constant_glitch);
                }

                song.appendChild(songFrag);

                songs.appendChild(song);
            });

            list.appendChild(songs);

            listsFrag.append(list);
        });

        timeout(100).then(function() {
            $('#songs').appendChild(listsFrag);

            $('#loading, #divide_1').exec(function(e) {
                this.style.display = 'none';
            });

            window.btOption.minHeight = $('.list:first-of-type').offsetTop;
        });
    })();
})();
'use strict';

$('#search').style.display = 'block';
$('#loading').style.display = 'block';
$('#divide_1, #divide_2').exec(function(i) {
    this.style.display = 'block';
});

cookie.del('song_name');
cookie.del('artist');
cookie.del('levels');

/*----------------*/

let songsInfo;

const search = function(e) {
    const case_sensitive = $('#case_sensitive').checked;
    const input = case_sensitive ? $('#keyword').value : $('#keyword').value.toLowerCase();

    $('#result, #divide_1').exec(function(i) {
        this.style.display = input ? 'block' : 'none';
    });
    $('.list h2').exec(function(i) {
        this.style.display = input ? 'none' : 'block';
    });
    $('#egg_1').style.display = input == '114514' ? 'block' : 'none';
    $('#egg_2').style.display = input == (case_sensitive ? 'Graff.J' : 'graff.j') ? 'block' : 'none';

    if (!input && $('.song.hidden')) {
        $('.song.hidden').exec(function(i) {
            this.removeClass('hidden');
        });
        return;
    }

    let data = [];
    const filter = $('#filters input[type=radio]:checked').id;
    const searchItems = songsInfo.get(filter);
    let counter = 0;

    $('.song').exec(function(i) {
        const that = this;
        data = searchItems[i];
        data.forEach(function(e) {
            !case_sensitive ? e = e.toLowerCase() : false;
            const [exact, fuzzy] = [input == e, e.indexOf(input) > -1];
            if ($('#exact_match').checked ? exact : fuzzy) {
                that.removeClass('hidden');
                counter++;
            } else {
                that.addClass('hidden');
            }
        });
    });

    $('#result').innerHTML = counter == 0 ? '搜索无结果。' : `搜索到 ${counter} 首曲目：`;
}

const throttleSearch = throttle(search, 200);

$('#keyword').bindEvent('input', throttleSearch);

$('#clear').bindEvent('click', function(e) {
    $('#keyword').value = '';
    $('#keyword').focus();
    throttleSearch();
});

$('#search, #search_box').bindEvent('click', function(e) {
    $('#navcb1').checked = false;
});

$('#search_box').bindEvent('mouseover', function(e) {
    $('#filters').addClass('show');
});

$('#search_box').bindEvent('mouseout', function(e) {
    $('#filters').removeClass('show');
});

$('#search_box').bindEvent('click', function(e) {
    !$('#keyword').value ? $('#keyword').focus() : false;
});

if (cookie.get('filter')) {
    $(`#${cookie.get('filter')}`).click();
} else {
    cookie.set('filter', 'name', 365);
    $('#name').click();
}

$('#filters input[type=radio]').bindEvent('click', function(e) {
    cookie.set('filter', this.id, 365);
    throttleSearch();
});

$('#exact_match').bindEvent('click', function(e) {
    if ($('#case_sensitive').checked) {
        $('#case_sensitive').click();
    }
    $('#case_sensitive').disabled = this.checked;
});

$('#filters input[type=checkbox]').exec(function(i) {
    if (cookie.get(this.id) == 'on' && this.checked == false) {
        this.click();
    }
});

$('#filters input[type=checkbox]').bindEvent('click', function() {
    cookie.set(this.id, this.checked ? 'on' : 'off', 365);
    throttleSearch();
});

$('main, #menu, #items').bindEvent('click', function(e) {
    !$('#keyword').value ? $('#navcb2').checked = false : false;
});

/*----------------*/

(async function() {
    if (localStorage.getItem('songData')) {
        try {
            JSON.parse(localStorage.getItem('songData'));
        } catch (e) {
            localStorage.removeItem('songData');
        }
    }

    const dataResponse = JSON.stringify(await ajax.get('https://cdn.jsdelivr.net/gh/StarSky919/c2info@latest/songs.json'));
    //const dataResponse = JSON.stringify(await ajax.get('songs.json'));

    if (!localStorage.getItem('songData') || localStorage.getItem('songData') != dataResponse) {
        $('#initializing').style.display = 'flex';
        localStorage.setItem('songData', dataResponse);
        timeout(100).then(function() {
            window.location.reload();
        });
        return;
    }

    const { version, characters } = JSON.parse(localStorage.getItem('songData'));

    $('#items').insertBefore(createElement({
        tag: 'div',
        id: 'characters',
        classList: 'item',
        innerHTML: '<input type="checkbox" id="t1" class="titlecb" /><label for="t1"><a class="title arrow">角色列表</a></label><div class="content" data-id="t1">'
    }), $('#items').children[0]);

    Object.entries(characters).forEach(function([key, data]) {
        const a = createElement({
            tag: 'a',
            innerHTML: data.name
        });
        a.dataset.scroll = `${key}`;
        a.bindEvent('click', function(e) {
            !$('#keyword').value ? scrollTo($(`#${this.dataset.scroll}`).offsetTop) : false;
        });
        $('.content[data-id=t1]').appendChild(a);
    });

    refreshNav();

    const difficulties = new Map([[-1, 'α'], [-2, 'β'], [-3, 'γ']]);
    const getDifficulty = function(difficulty) {
        return difficulties.get(difficulty) || difficulty;
    }

    const constants = new Map([[0, 'N/A'], [-1, '？？？']]);
    const getConstant = function(constant) {
        return constants.get(constant) || constant.toFixed(1);
    }

    const createLevel = function(type, data) {
        const { difficulty, version, note_count, constant } = data;
        const levelFrag = createFrag();

        const level = createElement({
            tag: 'p',
            classList: 'level'
        });

        level.appendChild(createElement({
            tag: 'span',
            classList: ['difficulty', type],
            innerHTML: `${type.toUpperCase()} <span>${getDifficulty(difficulty)}</span>`
        }));

        level.appendChild(createElement({
            tag: 'span',
            classList: ['version', type],
            innerHTML: `<small>v${version}</small>`
        }));

        levelFrag.appendChild(level);

        levelFrag.appendChild(createElement({
            tag: 'p',
            classList: ['note_count', type],
            innerHTML: `物量：<span>${note_count}</span>`
        }));

        levelFrag.appendChild(createElement({
            tag: 'p',
            classList: ['constant', type],
            innerHTML: `定数：<span>${getConstant(constant)}</span>`
        }));

        return levelFrag;
    }

    let counter = 0;
    const lists = createFrag();

    Object.entries(characters).forEach(function([key, data]) {
        const list = createElement({
            tag: 'div',
            id: key,
            classList: 'list'
        });

        list.appendChild(createElement({
            tag: 'h2',
            classList: 'ul',
            innerHTML: data.name
        }));

        const songs = createElement({
            tag: 'div',
            classList: 'songs'
        });

        Object.entries(data.songs).forEach(function([key, data]) {
            const { title, artist, bpm, hard, chaos, glitch, crash } = data;
            const song = createElement({
                tag: 'div',
                classList: 'song'
            });

            song.appendChild(createElement({
                tag: 'h3',
                classList: 'name',
                innerHTML: `<span>${title}</span>`
            }));

            song.appendChild(createElement({
                tag: 'p',
                classList: 'artist',
                innerHTML: `曲师：<span>${artist}</span>`
            }));

            song.appendChild(createElement({
                tag: 'p',
                classList: 'bpm',
                innerHTML: `BPM：<span>${bpm}</span>`
            }));

            hard ? song.appendChild(createLevel('hard', hard)) : false;
            chaos ? song.appendChild(createLevel('chaos', chaos)) : false;
            glitch ? song.appendChild(createLevel('glitch', glitch)) : false;
            crash ? song.appendChild(createLevel('crash', crash)) : false;

            songs.appendChild(song);

            counter += 1;
        });

        list.appendChild(songs);
        lists.append(list);
    });

    await timeout(100);

    $('#songs').appendChild(lists);

    window.data.btMinHeight = $('.list:first-of-type').offsetTop;

    $('#info').exec(function(i) {
        this.innerHTML = `截至${version}版本，共有${counter}首曲目。`;
        this.style.display = 'block';
    });
    $('#loading, #divide_1').exec(function(i) {
        this.style.display = 'none';
    });

    const getBaseInformation = function(type) {
        const temps = [];
        $(`.song .${type} span`).forEach(function(e) {
            temps.push([e.innerHTML]);
        });
        return temps;
    }
    const getMultiDifficulty = function(type) {
        const temps = [];
        $('.song').exec(function(i) {
            const temp = [];
            this.$('.hard') ? temp.push(this.$(`.${type}.hard span`).innerHTML) : false;
            this.$('.chaos') ? temp.push(this.$(`.${type}.chaos span`).innerHTML) : false;
            this.$('.glitch') ? temp.push(this.$(`.${type}.glitch span`).innerHTML) : false;
            this.$('.crash') ? temp.push(this.$(`.${type}.crash span`).innerHTML) : false;
            temps.push(temp);
        });
        return temps;
    }
    songsInfo = new Map(Object.entries({
        'name': getBaseInformation('name'),
        'artist': getBaseInformation('artist'),
        'bpm': getBaseInformation('bpm'),
        'difficulty': getMultiDifficulty('difficulty'),
        'note_count': getMultiDifficulty('note_count'),
        'constant': getMultiDifficulty('constant')
    }));
})();
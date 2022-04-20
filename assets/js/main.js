$('#loading').style.display = 'block';
$('#divide_1, #divide_2').exec(function(i) {
    this.style.display = 'block';
});

/*----------------*/

const isMatch = function(s, p) {
    let m = p.length,
        n = s.length;
    let dp = Array.from(new Array(m + 1), () => new Array(n + 1).fill(false));
    dp[0][0] = true;
    for (let i = 1; i <= m; i++) {
        if (p[i - 1] == '*') {
            dp[i][0] = dp[i - 1][0];
        }
        for (let j = 1; j <= n; j++) {
            if (s[j - 1] == p[i - 1] || p[i - 1] == '?') {
                dp[i][j] = dp[i - 1][j - 1];
            } else if (p[i - 1] == '*') {
                dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
            }
        }
    }
    return dp[m][n];
};

const fuzzyExp = function(filter, input, e) {
    const exp1 = input.includes('?') || input.includes('*');
    const exp2 = input.endsWith('+');
    const exp3 = input.endsWith('-');
    const exp4 = input.includes('~');
    if (exp1) {
        return isMatch(e, input);
    } else if ((exp2 || exp3) && ['difficulty', 'note_count', 'constant'].includes(filter)) {
        if (exp2) {
            return e >= Number(input.substring(0, input.length - 1));
        } else if (exp3) {
            return e <= Number(input.substring(0, input.length - 1));
        }
    } else if (exp4) {
        const [e1, e2] = input.split('~');
        return e >= Math.min(e1, e2) && e <= Math.max(e1, e2);
    } else {
        return e.indexOf(input) > -1;
    }
}

let songsInfo = {};

const search = throttle(function(e) {
    const case_sensitive = $('#case_sensitive').checked;
    const input = case_sensitive ? $('#keyword').value : $('#keyword').value.toLowerCase();

    $('#result, #divide_1').exec(function(i) {
        this.style.display = input ? 'block' : 'none';
    });
    $('.list h2').exec(function(i) {
        input ? this.addClass('hidden') : this.removeClass('hidden');
    });
    $('#egg_1').style.display = input == '114514' ? 'block' : 'none';
    $('#egg_2').style.display = input == (case_sensitive ? 'Graff.J' : 'graff.j') ? 'block' : 'none';

    if (!input) {
        if ($('.song.hidden')) {
            $('.song.hidden').exec(function(i) {
                this.removeClass('hidden');
            });
        }
        return;
    }

    const filter = $('#filters input[type=radio]:checked').id;
    const searchItems = songsInfo[filter];
    let sCounter = 0;
    let cCounter = 0;

    $('.song').exec(function(i) {
        let isMatch = false;
        searchItems[i].forEach(function(e) {
            !case_sensitive ? e = e.toLowerCase() : false;
            if ($('#exact_match').checked ? input === e : fuzzyExp(filter, input, e)) {
                isMatch = true;
                cCounter++;
            }
        });
        if (isMatch) {
            this.removeClass('hidden');
            sCounter++;
        } else {
            this.addClass('hidden');
        }
    });
    $('#result').setText(sCounter + cCounter == 0 ? '搜索无结果，请检查关键词是否正确。' : `搜索到${sCounter}首曲目${['difficulty', 'note_count', 'constant'].includes(filter) ? `，${cCounter}个谱面：` : `：`}`);
}, 200);

$('#keyword').bindEvent('input', search);

$('#clear').bindEvent('click', function(e) {
    $('#keyword').value = '';
    $('#keyword').focus();
    search();
});

$('#search, #search_box').bindEvent('click', function(e) {
    $('#navcb1').checked = false;
});

$('#search_box').bindEvent('mouseover', function(e) {
    $('#filters').addClass('show');
}).bindEvent('mouseout', function(e) {
    $('#filters').removeClass('show');
}).bindEvent('click', function(e) {
    !$('#keyword').value ? $('#keyword').focus() : false;
});

if (['name', 'artist', 'bpm', 'difficulty', 'note_count', 'constant'].includes(cookie.get('filter'))) {
    $(`#${cookie.get('filter')}`).click();
} else {
    cookie.set('filter', 'name', 365);
    $('#name').click();
}

$('#filters input[type=radio]').bindEvent('click', function(e) {
    cookie.set('filter', this.id, 365);
    search();
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
}).bindEvent('click', function() {
    cookie.set(this.id, this.checked ? 'on' : 'off', 365);
    search();
});

$('main, #menu, #items').bindEvent('click', function(e) {
    !$('#keyword').value ? $('#navcb2').checked = false : false;
});

$('#search').bindEvent('click', function(e) {
    $('#navcb2').checked ? $('#search_box').addClass('show') : $('#search_box').removeClass('show');
});

/*----------------*/

window.bindEvent('DOMContentLoaded', async function() {
    await timeout(0);

    if (localStorage.getItem('songData')) {
        try {
            JSON.parse(localStorage.getItem('songData'));
        } catch (e) {
            localStorage.removeItem('songData');
        }
    }

    Ajax.get('/cy2data.json').then(function(response) {
        if (typeof response != 'object') { return; }
        response = JSON.stringify(response);
        if (!localStorage.getItem('songData') || localStorage.getItem('songData') != response) {
            toast('正在更新数据，请等待页面刷新', 2, function() {
                localStorage.setItem('songData', response);
                window.location.reload(true);
            });
        }
    });

    const { version, characters, songs } = JSON.parse(localStorage.getItem('songData'));

    $('#items').insertBefore(createElement({
        tag: 'div',
        id: 'characters',
        classList: 'item',
        innerHTML: '<input type="checkbox" id="t1" class="titlecb" checked /><label for="t1"><a class="title arrow">角色列表</a></label><div class="content" data-id="t1">'
    }), $('#items').children[0]);

    const aFrag = createFrag();

    Object.entries(characters).forEach(function([key, data]) {
        const a = createElement({
            tag: 'a',
            innerText: data.display_name
        });
        a.dataset.scroll = `${key}`;
        aFrag.appendChild(a);
    });

    $('.content[data-id=t1]').appendChild(aFrag);

    refreshNav();

    const getDifficulty = function(difficulty) {
        return (new Map([[-1, 'α'], [-2, ' β'], [-3, 'γ']])).get(difficulty) || difficulty;
    }
    const getConstant = function(constant) {
        return (new Map([[0, '暂无'], [-1, '？？？']])).get(constant) || constant.toFixed(1);
    }
    const createLevel = function({ type, difficulty, version, note_count, constant }) {
        const level = $('#level_template').content.cloneNode(true);
        level.$('.difficulty').addClass(type).setHtml(`${type.toUpperCase()} <span>${getDifficulty(difficulty)}</span>`);
        level.$('.version').addClass(type).$('small').setText(`v${version}`);
        level.$('.note_count').addClass(type).$('span').setText(note_count);
        level.$('.constant').addClass(type).$('span').setText(getConstant(constant));
        return level;
    }

    let counter = 0;
    const lists = createFrag();
    const cList = {};

    songs.forEach(function(song) {
        if (!cList[song.character.id]) {
            cList[song.character.id] = [];
        }
        cList[song.character.id].push(song);
    });

    Object.entries(characters).forEach(function([key, data]) {
        const list = createElement({
            tag: 'div',
            id: key,
            classList: 'list'
        });
        list.appendChild(createElement({
            tag: 'h2',
            classList: 'ul',
            innerText: data.display_name
        }));

        const songs = createElement({
            tag: 'div',
            classList: 'songs'
        });

        cList[key].forEach(function(data) {
            const { title, artist, bpm, charts } = data;
            const song = $('#song_template').content.cloneNode(true).$('.song');
            song.$('.name span').setText(title);
            song.$('.artist span').setText(artist);
            song.$('.bpm span').setText(bpm);
            charts.forEach(function(chart) {
                if (!chart) { return; }
                song.appendChild(createLevel(chart));
            });
            songs.appendChild(song);
            counter += 1;
        });

        list.appendChild(songs);
        lists.append(list);
    });

    await timeout(100);

    $('#loading, #divide_1, #divide_2').exec(function(i) {
        this.style.display = 'none';
    });
    $('#songs').appendChild(lists);
    $('#info').exec(function(i) {
        this.setText(`截至${version}版本，共有${counter}首曲目。`);
        this.style.display = 'block';
    });

    globalData.btMinHeight = $('.list:first-of-type').offsetTop - 50;

    const getBaseInformation = function(type) {
        const temps = [];
        $(`.song .${type} span`).forEach(function(e) {
            temps.push([e.getText()]);
        });
        return temps;
    }
    const getMultiDifficulty = function(type) {
        const temps = [];
        $('.song').exec(function(i) {
            const temp = [];
            this.$('.hard') ? temp.push(this.$(`.${type}.hard span`).getText()) : false;
            this.$('.chaos') ? temp.push(this.$(`.${type}.chaos span`).getText()) : false;
            this.$('.glitch') ? temp.push(this.$(`.${type}.glitch span`).getText()) : false;
            this.$('.crash') ? temp.push(this.$(`.${type}.crash span`).getText()) : false;
            temps.push(temp);
        });
        return temps;
    }
    songsInfo = {
        name: getBaseInformation('name'),
        artist: getBaseInformation('artist'),
        bpm: getBaseInformation('bpm'),
        difficulty: getMultiDifficulty('difficulty'),
        note_count: getMultiDifficulty('note_count'),
        constant: getMultiDifficulty('constant')
    };
});
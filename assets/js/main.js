'use strict';

$('#search').style.display = 'block';
$('#navstyle').remove();

(function(bt) {
    bt.id = 'bt';
    bt.addClass(['fa', 'fa-arrow-up']);
    bt.css('display: block; position: fixed; width: 50px; height: 50px; line-height: 50px; right: 25px; bottom: 50px; color: #000000; background: #FFFFFF; -webkit-border-radius: 50%; border-radius: 50%; -webkit-box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25); box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.25); text-align: center; font-size: 1.125em;');
    bt.bindEvent('click', function(e) {
        scrollTo($('#keyword').value == '' && scrollTop() > $('#graffj').offsetTop + 1 && scrollTop() < $('#alice').offsetTop ? $('#graffj').offsetTop : 0);
    });
    $('main').appendChild(bt);
})(document.createElement('i'));

$('#search_box').bindEvent('mouseover', function(e) {
    $('#filters').addClass('show');
});

$('#search_box').bindEvent('mouseout', function(e) {
    if (!$('#keyword').value) {
        $('#filters').removeClass('show');
    }
});

const search = function() {
    let case_sensitive = $('#case_sensitive').checked;
    let input = case_sensitive ? $('#keyword').value : $('#keyword').value.toLowerCase();

    let result = $('#result');
    var counter = 0;

    result.style.display = input ? 'block' : 'none';
    $('#divide').style.display = input ? 'block' : 'none';
    $('#song_packs').style.display = input ? 'none' : 'block';
    $('.list .ul').exec(function(i) {
        this.style.display = input ? 'none' : 'block';
    });

    $('#egg_1').style.display = input == '114514' ? 'block' : 'none';
    $('#egg_2').style.display = input == (case_sensitive ? 'Graff.J' : 'graff.j') ? 'block' : 'none';

    if (input) {
        let data = '';
        let song_names = $('.song .song_name');
        let artists = $('.song .artist');
        let levels = $('.song .level');

        function getSpecialChart(data) {
            if (this.$('.level_g')) {
                data += this.$('.level_g').innerHTML;
            }
            if (this.$('.level_c')) {
                data += this.$('.level_c').innerHTML;
            }
            return data;
        }

        $('.song').exec(function(i) {
            data = $('#song_name').checked ? song_names[i].innerHTML : $('#artist').checked ? artists[i].innerHTML : $('#level').checked ? levels[i].innerHTML : '';
            data += $('#level').checked ? getSpecialChart.call(this, data) : '';
            data = case_sensitive ? data : data.toLowerCase();

            if (data.indexOf(input) > -1) {
                this.style.display = 'block';
                counter += 1;
            } else {
                this.style.display = 'none';
            }
        });

        result.innerHTML = counter == 0 ? '搜索无结果' : `搜索到 ${counter} 个结果：`;
    } else {
        $('.song').exec(function(i) {
            this.style.display = 'block';
        });
    }
}

$('#keyword').bindEvent('keyup', search);

$('#clear').bindEvent('click', function(e) {
    $('#keyword').value = '';
    $('#keyword').focus();
    search();
});

$('#filters input[type=radio]').bindEvent('click', function(e) {
    cookie.set('filter', this.id, 365);
    search();
});

if (cookie.get('filter')) {
    $(`#${cookie.get('filter')}`).checked = true;
} else {
    cookie.set('filter', 'song_name', 365);
    $('#song_name').checked = true;
}

$('#case_sensitive').checked = cookie.get('case_sensitive') == 'on' ? true : false;

$('#case_sensitive').bindEvent('click', function() {
    cookie.set('case_sensitive', $('#case_sensitive').checked ? 'on' : 'off', 365);
    search();
});

cookie.set('song_name', null, -1);
cookie.set('artist', null, -1);
cookie.set('levels', null, -1);
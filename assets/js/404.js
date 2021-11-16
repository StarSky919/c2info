'use strict';

$('.hitokoto').exec(function() {
    this.style.display = 'block';
});
$('#hitokoto').innerHTML = '<span class="loading md"></span>';

ajax.get('https://v1.hitokoto.cn/?c=a&c=d&c=h&c=i&c=k').then(function(response) {
    $('#hitokoto').innerHTML = `${response.hitokoto}<br />──${response.from_who || ''} 《${response.from}》` || '获取失败';
});
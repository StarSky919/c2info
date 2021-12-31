$('.hitokoto').exec(function() {
    this.style.display = 'block';
});
$('#hitokoto').setHtml('<span class="loading md"></span>');

Ajax.get('https://v1.hitokoto.cn/?c=a&c=d&c=h&c=i&c=k').then(function(response) {
    $('#hitokoto').setText(`${response.hitokoto}\n──${response.from_who || ''} 《${response.from}》` || '获取失败');
});
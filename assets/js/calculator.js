$('#items').insertBefore(createElement({
    tag: 'div',
    classList: 'item',
    innerHTML: '<input type="checkbox" id="t1" class="titlecb" checked /><label for="t1"><a class="title arrow">计算器</a></label><div class="content" data-id="t1">'
}), $('#calculator'));

$('#calculator').remove();

$('.content[data-id=t1]').appendChild(createElement({
    tag: 'a',
    innerText: '小P数量计算'
}).setAttr('href', '#gr'));

$('.content[data-id=t1]').appendChild(createElement({
    tag: 'a',
    innerText: 'ATP计算'
}).setAttr('href', '#atp'));

$('.content[data-id=t1] a').bindEvent('click', closeMenu);

refreshNav();

/*----------------*/

const refreshPage = function() {
    switch (location.hash.slice(1)) {
        case 'gr':
            $('#grContainer').removeClass('hidden');
            $('#atpContainer').addClass('hidden');
            $('#grReset').click();
            break;
        case 'atp':
            $('#grContainer').addClass('hidden');
            $('#atpContainer').removeClass('hidden');
            $('#atpReset').click();
            break;
        default:
            location.hash = 'gr';
            break;
    }
}

window.bindEvent('load', refreshPage);
window.bindEvent('hashchange', refreshPage);
$('#grContainer, #atpContainer').exec(function(e){
    this.style.display = 'flex';
});

/*----------------*/

const result = {
    alert: function() {
        $(`#${location.hash.slice(1)}Result`).setText('请输入正确的数值！');
    },
    grShow: function(gr, perfect) {
        $('#grResult').setText(`您的小P数量为：${gr}${perfect > 2000 ? '（物量过大可能出现误差）' : ''}。`);
    },
    atpShow: function(ctp) {
        $('#atpResult').setText(`您的已通关歌曲平均TP为${ctp}%。`)
    }
}

$('#grCalc').bindEvent('click', function(e) {
    const stp = Number($('#stpInput').value);
    const perfect = Number($('#perfectInput').value);
    const good = Number($('#goodInput').value);
    const bad = Number($('#badInput').value);
    const miss = Number($('#missInput').value);

    if (stp < 0 || perfect < 0 || good < 0 || bad < 0 || miss < 0 || perfect + good + bad + miss == 0 || (stp > 0 && perfect + good + bad + miss == 0)) {
        result.alert();
        return;
    }

    const gr = Math.floor(perfect - ((perfect + good + bad + miss) * stp - 30 * good - 70 * perfect) / 30);

    if (gr < 0 || (stp != 100 && gr == 0 && good + bad + miss == 0)) {
        result.alert();
        return;
    }

    result.grShow(gr, perfect);
});

$('#grReset').bindEvent('click', function(e) {
    $('#grResult').setText('开始计算以查看结果。');
    $('#stpInput').value = '';
    $('#perfectInput').value = '';
    $('#goodInput').value = '';
    $('#badInput').value = '';
    $('#missInput').value = '';
});

$('#atpCalc').bindEvent('click', function(e) {
    const atp = Number($('#atpInput').value);
    const ez = Number($('#ezInput').value);
    const hd = Number($('#hdInput').value);
    const ch = Number($('#chInput').value);
    const gl = Number($('#glInput').value);
    const total = Number($('#totalInput').value);

    if (atp > 100 || ez + hd + ch + gl <= 0 || ez + hd + ch + gl > total || total == 0 || (atp / 100) / ((ez + hd + ch + gl) / total) > 1) {
        result.alert();
        return;
    } else if (ez + hd + ch + gl != 0 && atp == 0) {
        result.alert();
        return;
    } else if (ez + hd + ch + gl == 0 && atp != 0) {
        result.alert();
        return;
    } else if (atp < 0 || ez < 0 || hd < 0 || ch < 0 || gl < 0) {
        result.alert();
        return;
    } else {
        result.atpShow(((atp / 100) / ((ez + hd + ch + gl) / total) * 100).toFixed(2));
        return;
    }
});

$('#atpReset').bindEvent('click', function(e) {
    $('#atpResult').setText('开始计算以查看结果。');
    $('#atpInput').value = '';
    $('#ezInput').value = '';
    $('#hdInput').value = '';
    $('#chInput').value = '';
    $('#glInput').value = '';
    $('#totalInput').value = '';
});
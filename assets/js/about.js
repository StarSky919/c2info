$('#items').insertBefore(createElement({
    tag: 'div',
    classList: 'item',
    innerHTML: '<input type="checkbox" id="t1" class="titlecb" checked /><label for="t1"><a class="title arrow">关于本站</a></label><div class="content" data-id="t1">'
}), $('#about'));

$('#about').remove();

const aFrag = createFrag();

$('article').exec(function(e) {
    const a = createElement({
        tag: 'a',
        innerText: this.$('h3').getText()
    });
    a.dataset.scroll = this.id;
    aFrag.appendChild(a);
});

$('.content[data-id=t1]').appendChild(aFrag);

refreshNav();
$('#items').insertBefore(createElement({
    tag: 'div',
    classList: 'item',
    innerHTML: '<input type="checkbox" id="t1" class="titlecb" checked /><label for="t1"><a class="title arrow">更新日志</a></label><div class="content" data-id="t1">'
}), $('#updates'));

$('#updates').remove();

const aFrag = createFrag();

$('.year').exec(function(e) {
    const yThis = this;
    this.$('article').exec(function(e) {
        const date = `${yThis.dataset.year}/${this.dataset.month}/${this.dataset.day}`;
        const identifier = `d${date.replaceAll('/','-')}`;
        this.id = identifier;
        const a = createElement({
            tag: 'a',
            innerText: date
        });
        a.dataset.scroll = identifier;
        aFrag.appendChild(a);
    });
});

$('.content[data-id=t1]').appendChild(aFrag);

refreshNav();
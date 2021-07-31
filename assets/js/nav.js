try {
    $('main, #items .content a').bindEvent('click', function(e) {
        $('#navcb1').checked = false;
    });
} catch (e) {}

try {
    $('main, #menu, #items').bindEvent('click', function(e) {
        if ($('#keyword') && !$('#keyword').value) {
            $('#navcb2').checked = false;
        }
    });
} catch (e) {}

try {
    $('.title:not([href]):not(.arrow)').bindEvent('click', function(e) {
        $('#navcb1').checked = false;
    });
} catch (e) {}

try {
    let contentHeight = new Map();

    function navInitialize() {
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
} catch (e) {}

try {
    $('#search, #search_box').bindEvent('click', function(e) {
        $('#navcb1').checked = false;
    });
} catch (e) {}
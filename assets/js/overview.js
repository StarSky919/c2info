$('#loading').style.display = 'block';
timeout(100).then(async function() {
    for (let i = 1;; i++) {
        const { status, response } = await Ajax.request({ url: `https://cdn.jsdelivr.net/gh/StarSky919/c2info@latest/assets/images/overview/overview_${i}.jpg`, responseType: 'blob' });
        if (status != 200) { break; }
        const image = (window.URL || window.webkitURL).createObjectURL(response);
        const img = createElement({ tag: 'img' });
        img.src = image;
        img.bindEvent('load', function(e) {
            $('#divide').addClass('hidden');
            $('#loading').addClass('hidden');
            $('#images').appendChild(img);
        });
    }
});
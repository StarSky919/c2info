import '/lib/kana-1.0.7.js';
import {
  $,
  $$,
  Time,
  isNullish,
  isEmpty,
  inRange,
  range,
  staggeredMerge,
  debounce,
  throttle,
  sleep,
  bindOnClick,
  compile,
  createElement,
  clearChildNodes,
  loadJSON
} from '/src/utils.js';
import Datastore from '/src/datastore.js';
import { Dialog, ItemSelectorDialog } from '/src/dialog.js';
import Router from '/src/router.js';

try {
  localStorage.setItem('test', true);
  localStorage.removeItem('test');
  localStorage.removeItem('songData');
} catch (err) {
  Dialog.show('localStorage API发生错误！\n如果您打开了浏览器的无痕（隐私）模式，\n请将它关闭并刷新页面。', '错误');
}

const searchBox = $('search-box');
const searchInput = $('search');
const resultBox = $('result-box');
const resultItemTemplate = $('result-item-template');
const chartList = $('charts');
const chartTemplate = $('chart-template');
const updatesContainer = $('updates');

const router = new Router();
router.route('/', 'loading');
router.route('/charts', 'main');
router.route('/updates', updatesContainer);
router.route('/404', 'not-found');
router.push('/');

const storage = new Datastore('c2i:');

function formatText(source) {
  return source.toHankakuCase().toZenkanaCase().toHiraganaCase().toLowerCase();
}

function isTitleMatched(input, title) {
  const result = [];
  const { length } = input;
  input = formatText(input);
  const _title = formatText(title);
  let i = 0,
    j = 0;
  while (true) {
    i = _title.indexOf(input, j);
    if (i > -1) {
      result.push(i);
      j += i + length;
    } else break;
  }
  return isEmpty(result) ? null : { title, result, inputLength: length, titleLength: title.length };
}

function getSortMethod(sortedby, reverse) {
  return [
    () => reverse ? -1 : 1,
    (a, b) => reverse ? b.constant - a.constant : a.constant - b.constant,
    (a, b) => reverse ? b.note_count - a.note_count : a.note_count - b.note_count,
    (a, b) => {
      if (reverse)[a, b] = [b, a];
      let { bpm: ab } = a;
      let { bpm: bb } = b;
      if (typeof ab === 'string')[, ab] = ab.split(new RegExp('[~\-]'));
      if (typeof bb === 'string')[, bb] = bb.split(new RegExp('[~\-]'));
      return ab - bb;
    },
    (a, b) => {
      if (reverse)[a, b] = [b, a];
      const avs = a.version.split(/.(?=\d)/g).map(n => parseInt(n));
      const bvs = b.version.split(/.(?=\d)/g).map(n => parseInt(n));
      for (const i of range(Math.max(avs.length, bvs.length))) {
        if (avs[i] === bvs[i]) continue;
        return (avs[i] || 0) - (bvs[i] || 0);
      }
      return 0;
    }
  ][sortedby];
}

loadJSON('/assets/c2data.json').then(async c2data_new => {
  const c2data = storage.get('c2data');
  if (!c2data || JSON.stringify(c2data) !== JSON.stringify(c2data_new)) {
    storage.set('c2data', c2data_new);
    const dialog = new Dialog({ cancellable: false })
      .title('提示')
      .content('检测到数据更新，请点击下方按钮刷新页面。');
    dialog.getButton(0).onClick(close => sleep(Time.second * 0.25).then(() => window.location.reload(true)));
    dialog.show();
  }
});

async function main() {
  const { version, characters, songs } = storage.get('c2data');
  const charts = [];
  for (const song of songs) {
    const { difficulties } = song;
    for (const dn of Object.keys(difficulties)) {
      const chart = Object.assign({}, song, difficulties[dn], { dn });
      Reflect.deleteProperty(chart, 'difficulties');
      charts.push(chart);
    }
  }

  $('stats').innerText = `网站数据版本：v${version}\n当前共有${songs.length}首曲目，${songs.filter(song => !!song.difficulties.glitch).length}张GLITCH谱面。`;

  const { message, updates } = await loadJSON('/assets/changelog.json');
  $('message').innerText = message;
  for (const { year, month, day, lines, additional } of updates) {
    updatesContainer.appendChild(createElement('h4', {
      classList: ['ul'],
      innerText: `${year}年${month}月${day}日` + (additional ? '（附加更新）' : '')
    }));
    for (const { text, details, notes } of lines) {
      updatesContainer.appendChild(createElement(notes ? 'small' : 'p', {
        innerText: text || notes
      }, details ? [createElement('div', {
        classList: ['details'],
        innerText: details
      })] : null));
    }
  }

  bindOnClick(chartList, event => {
    const chartBox = event.target;
    if (!chartBox.classList.contains('chart')) return;
    const { songid } = chartBox.dataset;
    if (!songid) return;
    const { id, title, artist, bpm, character, version, images, difficulties } = songs.find(song => song.id === songid);
    const content = [];
    content.push(`ID：${id}`);
    content.push(`曲名：${title}`);
    content.push(`曲师：${artist}`);
    content.push(`BPM：${bpm}`);
    content.push(`角色：${characters.find(c => c.id === character).name}`);
    content.push(`版本：${version}`);
    for (const dn of Object.keys(difficulties)) {
      const { bpm, difficulty, constant, note_count, version } = difficulties[dn];
      content.push('');
      content.push(`${dn.toUpperCase()} ${difficulty}`);
      content.push(`定数：${constant}`);
      content.push(`物量：${note_count}`);
      if (bpm) content.push(`BPM：${bpm}`);
      if (version) content.push(`版本：${version}`);
    }
    const dialog = new Dialog().title('歌曲详情').content(content.join('\n'));
    dialog.button('查看曲绘', close => {
      const path = `https://website-assets.starsky919.xyz/cytus2/${character}`;
      const imgList = createElement('div');
      imgList.appendChild(createElement('div', {
        style: { 'margin-bottom': '0.65rem' },
        innerText: '长按图片可保存'
      }));
      if (!isNullish(images)) {
        for (const img of images) {
          imgList.appendChild(frag.appendChild(createElement('img', { src: `${path}/${img}.png` })));
        }
      } else imgList.appendChild(createElement('img', {
        src: `${path}/${id}.png`,
        onerror() {
          clearChildNodes(imgList);
          imgList.innerText = '加载失败，\n可能是网络原因或暂无该曲目的曲绘文件。';
        }
      }));
      Dialog.show(imgList, id);
      return false;
    });
    dialog.show();
  });

  const searchFn = throttle(event => {
    const input = searchInput.value;
    clearChildNodes(resultBox);
    if (!input) return;
    const results = [];
    for (const i of range(chartList.childNodes.length)) {
      const chartBox = chartList.childNodes[i];
      const { songid, difficulty } = chartBox.dataset;
      if (isNullish(songid) || isNullish(difficulty)) continue;
      const song = songs.find(({ id }) => id === songid);
      const { title, difficulties } = song;
      const data = { node: chartBox };
      if (input === songid) {
        data.priority = 999;
      } else if (data.matchedIndexes = isTitleMatched(input, title)) {
        data.priority = 99;
      }
      if (data.priority) {
        data.song = song;
        data.dn = difficulty.toUpperCase();
        data.chart = difficulties[difficulty];
        results.push(data);
      }
    }
    results.sort((a, b) => b.priority - a.priority);
    resultBox.appendChild(createElement('div', { classList: ['result-item'], innerText: isEmpty(results) ? '搜索无结果。' : `搜索到 ${results.length} 条记录（点击可跳转）：` }));
    const resultFrag = document.createDocumentFragment();
    const sortedby = storage.get('sorted-by', 0);
    const texts = ['角色：', '定数：', '物量：', 'BPM：', '版本：'];
    for (const { node, matchedIndexes, song, dn, chart: { bpm, difficulty, constant, note_count, version } } of results) {
      const [resultItem] = resultItemTemplate.content.cloneNode(true).children;
      const data = [characters.find(c => c.id === song.character).name, constant.toFixed(1), bpm || song.bpm, note_count, version || song.version];
      const item = compile(resultItem, { dn, difficulty, data: `${texts[sortedby]}${data[sortedby]}` });
      if (matchedIndexes) {
        const { title, result, inputLength, titleLength } = matchedIndexes;
        const indexes = [];
        for (const index of result) indexes.push(index + inputLength);
        const finalIndexes = staggeredMerge(result, 0, indexes);
        if (finalIndexes[0] > 0) finalIndexes.unshift(0);
        if (finalIndexes[finalIndexes.length - 1] < titleLength) finalIndexes.push(titleLength);

        const splitChars = [];
        for (const i of range(finalIndexes.length)) {
          const idx = finalIndexes[i];
          const idxNext = finalIndexes[i + 1];
          if (isNullish(idxNext)) break;
          const split = title.slice(idx, idxNext);
          splitChars.push({ split, matched: result.includes(idx) });
        }

        const titleFrag = document.createDocumentFragment();
        for (const { split, matched } of splitChars) {
          titleFrag.appendChild(createElement('span', { classList: [matched ? 'matched' : 'not_matched'], innerText: split }));
        }
        item.$$('.title').appendChild(titleFrag);
      } else item.$$('.title').innerText = node.$$('.title').innerText;
      item.onclick = event => {
        window.scrollTo({
          top: node.offsetTop + node.offsetHeight * 0.5 - window.innerHeight / 2,
          behavior: 'smooth'
        });
      }
      resultFrag.appendChild(item);
    };
    resultBox.appendChild(resultFrag);
  }, Time.second * 0.2);

  searchInput.addEventListener('input', searchFn);

  function renderCharts() {
    clearChildNodes(chartList);
    const sortedby = storage.get('sorted-by', 0);
    const reverse = storage.get('reverse', false);
    const constantFilter = storage.get('constant-filter', []);
    const filter = ({ constant }) => {
      if (isEmpty(constantFilter)) return true;
      return inRange(constant, ...constantFilter);
    }
    for (const chart of charts.filter(filter).sort(getSortMethod(sortedby, reverse))) {
      const { id, title, artist, bpm, character, version, dn, difficulty, constant, note_count } = chart;
      const chartBox = compile(chartTemplate.content.cloneNode(true).children[0], {
        title,
        artist,
        bpm,
        character: characters.find(c => c.id === character).name
      });
      chartBox.dataset.songid = chart.id;
      chartBox.dataset.difficulty = dn;
      chartBox.appendChild(createElement('p', { classList: ['row'] }, [
          createElement('span', {
          classList: ['difficulty', dn],
          innerText: `${dn.toUpperCase()} ${difficulty}`
        }),
          createElement('span', { innerText: `v${version}` })
        ]));
      chartBox.appendChild(createElement('p', { classList: ['row'] }, [
          createElement('span', { innerText: `定数：${constant.toFixed(1)}` }),
          createElement('span', { innerText: `物量：${note_count}` })
        ]));
      chartList.appendChild(chartBox);
    }
    searchFn();
  }

  const delayedRendering = debounce(() => sleep(Time.second * 0.1).then(() => renderCharts()), Time.second * 0.5);

  bindOnClick('sorted-by', (() => {
    const texts = ['角色', '定数', '物量', 'BPM', '版本'];
    const sortedbyDisplay = $$('#sorted-by span');
    let i = storage.get('sorted-by', 0);
    sortedbyDisplay.innerText = texts[i];

    return event => {
      i++;
      if (i > texts.length - 1) i = 0;
      storage.set('sorted-by', i);
      sortedbyDisplay.innerText = texts[i];
      delayedRendering();
    };
  })());

  bindOnClick('ordering', (() => {
    const orderingDisplay = $$('#ordering span');
    let i = storage.get('reverse', false);
    orderingDisplay.innerText = i ? '降序' : '升序';

    return event => {
      i = !i;
      storage.set('reverse', i);
      orderingDisplay.innerText = i ? '降序' : '升序';
      delayedRendering();
    };
  })());

  bindOnClick('constant-filter', event => {
    const dialog = new Dialog()
      .title('筛选定数');
    const container = createElement('div');
    const input = createElement('input', {
      type: 'text',
      placeholder: '输入定数范围',
      style: {
        width: '100%',
        'margin-top': '1rem',
        padding: '0.65rem 1rem',
        color: 'var(--text-color)',
        background: 'var(--background-color-third)',
        'border-radius': 'var(--border-radius)',
        'font-size': '1em',
        'text-align': 'center'
      }
    });
    const constantFilter = storage.get('constant-filter') || [];
    if (!isEmpty(constantFilter)) {
      const [min, max] = constantFilter;
      if (min === max) input.value = min;
      else if (max === 9999) input.value = `${min}+`;
      else if (min === -9999) input.value = `${max}-`;
      else input.value = `${min}~${max}`;
    }
    container.appendChild(createElement('div', {
      innerText: '示例：\n只显示定数14.6：14.6\n定数大于等于15.8：15.8+\n定数小于等于15.0：15.0-\n定数在12.4与13.4之间：12.4~13.4\n所有符号均为英文符号'
    }));
    container.appendChild(input);
    dialog.content(container)
      .button('确定', close => {
        const source = input.value.trim();
        let min = 0,
          max = 0;
        if (/^([0-9]{1,2}|[0-9]{1,2}\.[0-9])$/.test(source)) {
          min = max = Number(source);
        } else if (/^([0-9]{1,2}|[0-9]{1,2}\.[0-9])\+$/.test(source)) {
          min = Number(source.slice(0, -1));
          max = 9999;
        } else if (/^([0-9]{1,2}|[0-9]{1,2}\.[0-9])\-$/.test(source)) {
          min = -9999;
          max = Number(source.slice(0, -1));
        } else if (/^([0-9]{1,2}|[0-9]{1,2}\.[0-9])\~([0-9]{1,2}|[0-9]{1,2}\.[0-9])$/.test(source)) {
          let [a, b] = source.split('~');
          a = Number(a), b = Number(b);
          min = Math.min(a, b);
          max = Math.max(a, b);
        }
        if (!isEmpty(source) && min + max === 0) return Dialog.error('请输入正确的范围！', { cancellable: true }), false;
        storage.set('constant-filter', isEmpty(source) ? [] : [min, max]);
        sleep(Time.second * 0.1).then(() => renderCharts());
      }).show();
  });

  let initialized = false;
  const observer = new IntersectionObserver(entries => {
    if (!initialized) return initialized = true;
    if (!entries[0].isIntersecting) searchBox.classList.add('floating');
    else searchBox.classList.remove('floating');
  });
  observer.observe($('sentinel'));

  renderCharts();
  await sleep(Time.second * 0.1);
  router.push('/charts');
}

main().catch(err => console.error(err));
import '/lib/kana-1.0.7.js';
import {
  $,
  $$,
  Time,
  isString,
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
  getScrollTop,
  loadJSON,
  createTaskRunner,
} from '/src/utils.js';
import Datastore from '/src/datastore.js';
import { Dialog, ItemSelectorDialog } from '/src/dialog.js';
import { getCurrentPath, Router } from '/src/router.js';

try {
  localStorage.setItem('test', true);
  localStorage.removeItem('test');
  localStorage.removeItem('songData');
} catch (err) {
  Dialog.show('localStorage API 发生错误！\n如果您打开了浏览器的无痕（隐私）模式，\n请将它关闭并刷新页面。', '错误');
}

const searchBox = $('search-box');
const searchInput = $('search');
const resultBox = $('result-box');
const resultItemTemplate = $('result-item-template');
const filterInfoBox = $('filter-info-box')
const filterInfo = $('filter-info')
const filteredCount = $('filtered-count')
const chartList = $('charts');
const chartTemplate = $('chart-template');
const songInfoContainer = $('song-info-container');
const updatesContainer = $('updates');
const backToTop = $('bt');

const firstPath = getCurrentPath(false);
const router = new Router();
router.route('/', 'loading');
router.route('/charts', 'main');
router.route('/updates', updatesContainer);
router.route('/404', 'not-found');
router.route('/song', 'song-info');

const storage = new Datastore('c2i:');

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, '0')}`;
}

function parseDate(date) {
  const year = Math.floor(date / 1e4);
  const month = Math.floor(date % 1e4 / 1e2);
  const day = date % 1e2;
  return Time.template('yyyy/MM/dd', new Date(year, month - 1, day));
}

function formatText(source) {
  return source.toHankakuCase().toZenkanaCase().toHiraganaCase().toLowerCase();
}

function isNameMatched(input, name) {
  const result = [];
  const { length } = input;
  input = formatText(input);
  const _name = formatText(name);
  let i = 0,
    j = 0;
  while (true) {
    i = _name.indexOf(input, j);
    if (i > -1) {
      result.push(i);
      j += i + length;
    } else break;
  }
  return isEmpty(result) ? null : { name, result, inputLength: length, nameLength: name.length };
}

loadJSON('/assets/c2data.json').then(async c2data_new => {
  const c2data = storage.get('c2data');
  if (!c2data || JSON.stringify(c2data) !== JSON.stringify(c2data_new)) {
    storage.set('c2data', c2data_new);
    const dialog = new Dialog({ cancellable: false })
      .title('提示')
      .content('检测到数据更新，请点击下方按钮刷新页面。\n如果没有响应请手动刷新。');
    dialog.getButton(0).onClick(close => sleep(Time.second * 0.25).then(() => window.location.reload(true)));
    dialog.show();
  }
});

async function main() {
  const { version, versions, characters, stories, packs, songs, charters } = storage.get('c2data');
  const allCharts = [];
  for (const song of songs) {
    const { charts } = song;
    for (const dn of Object.keys(charts)) {
      const chart = Object.assign({}, song, charts[dn], { dn });
      Reflect.deleteProperty(chart, 'charts');
      allCharts.push(chart);
    }
  }
  
  function getSortMethod(sortedBy, reverse) {
    const sortFn = [
      () => 0,
      (a, b) => a.constant - b.constant,
      (a, b) => a.note_count - b.note_count,
      (a, b) => {
        let { bpm: ab } = a;
        let { bpm: bb } = b;
        if (/[^\.\d]/.test(ab))[, ab] = ab.split(new RegExp('[~-]'));
        if (/[^\.\d]/.test(bb))[, bb] = bb.split(new RegExp('[~-]'));
        return Number(ab) - Number(bb);
      },
      (a, b) => {
        const ad = versions.find(v => v.version === a.version).date;
        const bd = versions.find(v => v.version === b.version).date;
        return ad - bd;
      }
    ][sortedBy];
    return reverse ? (a, b) => sortFn(b, a) : sortFn;
  }
  
  function levelInfoText(type, level, level_plus, constant) {
    let output = `${type.toUpperCase()} ${level}${level_plus ? '+' : ''}`;
    if (constant) output += ` (${constant > 0 ? constant.toFixed(1) : '暂无定数'})`;
    return output;
  }
  
  function buildSourceText(cid, { type, ...props }) {
    switch (type) {
      case 'im': {
        const { titles, locks, story } = stories.im.find(p => p.id === props.id);
        const [title] = titles.slice(-1);
        const locksText = locks.map(({ character, level }) => {
          const { name } = characters.find(c => c.id === character);
          return `${name}达到${level + 1}级`;
        }).join('、') || (story.startsWith('story_ending03') ? '主线剧情3.0结局' : '主线剧情推进');
        return `${locksText}后，阅读iM贴文“${title}”解锁`;
      }
      case 'os': {
        const { name, locks } = stories.os[cid].find(l => l.id === props.id);
        const locksText = locks.map(({ character, level }) => {
          const { name } = characters.find(c => c.id === character);
          return `${name}达到${level + 1}级`;
        }).join('、');
        return `${locksText}后，阅读OS记录“${name}”解锁`;
      }
      case 'oa': {
        const { names, locks } = stories.oa.find(p => p.id === props.id);
        const [name] = names.slice(-1);
        const locksText = locks.map(({ type, ...props }) => {
          if (type === 'level') {
            const { name } = characters.find(c => c.id === cid);
            return `${name}达到${props.level + 1}级`;
          }
          if (type === 'os') {
            const { name } = stories.os[cid].find(l => l.id === props.id);
            return `阅读OS记录“${name}”`;
          }
          if (type === 'story') {
            return '完成特定剧情';
          }
        }).join('、');
        return `${locksText}后，分析OA对象“${name}”解锁`;
      }
      case 'story':
        return '主线剧情解锁';
      case 'capso':
        return 'CAPSO抽奖';
      case 'capsoshop':
        return `CAPSO商店“${packs.find(p => p.id === props.pack).name}”`;
      case 'blackmarket':
        return `黑市曲包“${packs.find(p => p.id === props.pack).name}”`;
    }
  }
  
  $('stats').innerText = `网站数据版本：${version}\n当前共有 ${songs.length} 首曲目，${songs.filter(song => !!song.charts.glitch).length} 张 GLITCH 谱面。`;
  
  loadJSON('/assets/changelog.json').then(async ({ message, updates }) => {
    $('message').innerText = message;
    for (const { year, month, day, lines, additional } of updates) {
      updatesContainer.appendChild(createElement('h4', {
        classList: ['ul'],
        innerText: `${year} 年 ${month} 月 ${day} 日` + (additional ? '（附加更新）' : ''),
      }));
      for (const i of range(lines.length)) {
        const { text, details, notes } = lines[i];
        updatesContainer.appendChild(createElement(notes ? 'small' : 'p', {
          innerText: notes || `${i + 1}. ${text}`,
        }, details ? [createElement('div', {
          classList: ['details'],
          innerText: `• ${details.replace(/\n/g, '\n• ')}`,
        })] : null));
      }
    }
  });
  
  bindOnClick(chartList, event => {
    const chartBox = event.target;
    if (!chartBox.classList.contains('chart')) return;
    const { songid } = chartBox.dataset;
    if (!songid) return;
    clearChildNodes(songInfoContainer);
    const { id, name, artist, bpm, character, version, source, images, charts } = songs.find(song => song.id === songid);
    const result = [];
    result.push(`ID：${id}`);
    result.push(`曲名：${name}`);
    result.push(`曲师：${artist}`);
    result.push(`BPM：${bpm}`);
    result.push(`角色：${characters.find(c => c.id === character).name}`);
    result.push(`版本：${version} (${parseDate(versions.find(v => v.version === version).date)})`);
    if (source) result.push(`来源：${buildSourceText(character, source)}`);
    for (const key of Object.keys(charts)) {
      const { level, level_plus, constant, note_count, page_count, length, version, source, charter } = charts[key];
      result.push(levelInfoText(key, level, level_plus, constant));
      result.push(`- 物量：${note_count}`);
      result.push(`- 时长：${formatTime(length)} (${page_count}页)`);
      if (charter?.length) result.push(`- 谱师：${charter.map(id => charters.find(c => c.id === id).name).join(' & ')}`);
      if (version) result.push(`- 版本：${version} (${parseDate(versions.find(v => v.version === version).date)})`);
      if (source) result.push(`- 来源：${buildSourceText(character, source)}`);
    }
    result.push('*谱面定数来自CN:DC（非官方）');
    result.map(innerText => createElement('p', { innerText }))
      .forEach(el => songInfoContainer.appendChild(el));
    const path = `https://website-assets.starsky919.xyz/cytus2/${character}`;
    const imgList = createElement('div');
    if (!isNullish(images)) {
      for (const img of images) {
        imgList.appendChild(createElement('img', { src: `${path}/${img}.png` }));
      }
    } else imgList.appendChild(createElement('img', {
      src: `${path}/${id}.png`,
      onerror() {
        clearChildNodes(imgList);
        imgList.innerText = '曲绘加载失败，\n可能是网络原因或是暂无该曲目的曲绘文件。';
      },
    }));
    songInfoContainer.appendChild(imgList)
    router.push('song', true);
    /* const content = [];
    content.push(`ID：${id}`);
    content.push(`曲名：${name}`);
    content.push(`曲师：${artist}`);
    content.push(`BPM：${bpm}`);
    content.push(`角色：${characters.find(c => c.id === character).name}`);
    if (pack) content.push(`曲包：${packs.find(p => p.id === pack).name}`);
    content.push(`版本：${version}`);
    for (const dn of Object.keys(charts)) {
      const { bpm, level, level_plus, constant, note_count, version } = charts[dn];
      content.push('');
      content.push(`${dn.toUpperCase()} ${level}${level_plus ? '+' : ''}`);
      content.push(`定数：${constant.toFixed(1)}`);
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
        innerText: '图片可保存',
      }));
      if (!isNullish(images)) {
        for (const img of images) {
          imgList.appendChild(createElement('img', { src: `${path}/${img}.png` }));
        }
      } else imgList.appendChild(createElement('img', {
        src: `${path}/${id}.png`,
        onerror() {
          clearChildNodes(imgList);
          imgList.innerText = '加载失败，\n可能是网络原因或是暂无该曲目的曲绘文件。';
        },
      }));
      Dialog.show(imgList, id);
      return false;
    });
    dialog.show(); */
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
      const { name, charts } = song;
      const data = { node: chartBox };
      if (input === songid) {
        data.priority = 999;
      } else if (data.matchedIndexes = isNameMatched(input, name)) {
        data.priority = 99;
      }
      if (data.priority) {
        data.song = song;
        data.dn = difficulty.toUpperCase();
        data.chart = charts[difficulty];
        results.push(data);
      }
    }
    results.sort((a, b) => b.priority - a.priority);
    resultBox.appendChild(createElement('div', { classList: ['result-item'], innerText: isEmpty(results) ? '搜索无结果。' : `搜索到 ${results.length} 张谱面（点击可跳转）：` }));
    const resultFrag = document.createDocumentFragment();
    const sortedBy = storage.get('sorted-by', 0);
    const texts = ['角色：', '定数：', '物量：', 'BPM：', '版本：'];
    for (const { node, matchedIndexes, song, dn, chart: { bpm, level, level_plus, constant, note_count, version } } of results) {
      const [resultItem] = resultItemTemplate.content.cloneNode(true).children;
      const data = [characters.find(c => c.id === song.character).name, constant ? constant > 0 ? constant.toFixed(1) : '暂无' : 'N/A', note_count, bpm || song.bpm, version || song.version];
      const item = compile(resultItem, { dn, level: `${level}${level_plus ? '+' : ''}`, data: `${texts[sortedBy]}${data[sortedBy]}` });
      if (matchedIndexes) {
        const { name, result, inputLength, nameLength } = matchedIndexes;
        const indexes = [];
        for (const index of result) indexes.push(index + inputLength);
        const finalIndexes = staggeredMerge(result, 0, indexes);
        if (finalIndexes[0] > 0) finalIndexes.unshift(0);
        if (finalIndexes[finalIndexes.length - 1] < nameLength) finalIndexes.push(nameLength);
        
        const splitChars = [];
        for (const i of range(finalIndexes.length)) {
          const idx = finalIndexes[i];
          const idxNext = finalIndexes[i + 1];
          if (isNullish(idxNext)) break;
          const split = name.slice(idx, idxNext);
          splitChars.push({ split, matched: result.includes(idx) });
        }
        
        const nameFrag = document.createDocumentFragment();
        for (const { split, matched } of splitChars) {
          nameFrag.appendChild(createElement('span', { classList: [matched ? 'matched' : 'not_matched'], innerText: split }));
        }
        $$(item, '.name').appendChild(nameFrag);
      } else $$(item, '.name').innerText = $$(node, '.name').innerText;
      item.onclick = event => {
        window.scrollTo({
          top: node.offsetTop + node.offsetHeight * 0.5 - window.innerHeight / 2,
          behavior: 'smooth',
        });
      }
      resultFrag.appendChild(item);
    };
    resultBox.appendChild(resultFrag);
  }, Time.second * 0.2);
  
  searchInput.addEventListener('input', searchFn);
  
  const loadCharts = createTaskRunner(async shouldStop => {
    clearChildNodes(chartList);
    const sortedBy = storage.get('sorted-by', 0);
    const reverse = storage.get('reverse', false);
    const constantFilter = storage.get('constant-filter', []);
    const filter = (function() {
      if (isEmpty(constantFilter)) {
        filterInfoBox.classList.add('hidden');
        return () => true;
      }
      const [min, max] = constantFilter;
      let text;
      if (max > 99) text = `定数 ${min.toFixed(1)} 以上共有`;
      else if (min < 1) text = `定数 ${max.toFixed(1)} 以下共有`;
      else text = `定数 ${min.toFixed(1)} 与 ${max.toFixed(1)} 之间共有`
      filterInfo.innerText = text;
      filterInfoBox.classList.remove('hidden');
      return ({ constant }) => inRange(constant, min, max);
    })();
    const sorted = allCharts.filter(filter).sort(getSortMethod(sortedBy, reverse));
    if (sortedBy === 0 && reverse) sorted.reverse();
    let i = 0;
    for (const chart of sorted) {
      if (shouldStop()) break;
      const { id, name, artist, bpm, character, version, dn, level, level_plus, constant, note_count } = chart;
      const { name: cname, theme_color } = characters.find(c => c.id === character);
      const chartBox = compile(chartTemplate.content.cloneNode(true).children[0], {
        name,
        artist,
        bpm,
        character: cname,
      });
      const chartBoxInner = $$(chartBox, '.inner');
      chartBox.style.setProperty('--character-theme', theme_color);
      chartBox.dataset.songid = chart.id;
      chartBox.dataset.difficulty = dn;
      chartBoxInner.appendChild(createElement('p', { classList: ['row'] }, [
        createElement('span', {
          classList: ['difficulty', dn],
          innerText: `${dn.toUpperCase()} ${level}${level_plus ? '+' : ''}`,
        }),
        createElement('span', { innerText: `v${version}` }),
      ]));
      chartBoxInner.appendChild(createElement('p', { classList: ['row'] }, [
        createElement('span', { innerText: `定数：${constant ? constant > 0 ? constant.toFixed(1) : '暂无' : 'N/A'}` }),
        createElement('span', { innerText: `物量：${note_count}` }),
      ]));
      chartList.appendChild(chartBox);
      if (i++ % 9 === 0) await sleep(100);
      filteredCount.innerText = i;
    }
    searchFn();
    if (!i) filterInfoBox.classList.add('hidden');
  });
  
  bindOnClick('sorted-by', (texts => {
    const sortedByDisplay = $$('#sorted-by span');
    let i = storage.get('sorted-by', 0);
    sortedByDisplay.innerText = texts[i];
    
    return event => {
      i = ++i % texts.length;
      storage.set('sorted-by', i);
      sortedByDisplay.innerText = texts[i];
      loadCharts();
    };
  })(['默认', '定数', '物量', 'BPM', '版本']));
  
  bindOnClick('ordering', (getText => {
    const orderingDisplay = $$('#ordering span');
    let i = storage.get('reverse', false);
    orderingDisplay.innerText = getText(i);
    
    return event => {
      i = !i;
      storage.set('reverse', i);
      orderingDisplay.innerText = getText(i);
      loadCharts();
    };
  })(reverse => reverse ? '降序' : '升序'));
  
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
        'text-align': 'center',
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
      innerText: '示例：\n只显示定数 14.6：14.6\n定数大于等于 15.8：15.8+\n定数小于等于 15.0：15.0-\n定数在 12.4 与 13.4 之间：12.4~13.4\n所有符号均为英文符号'
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
        loadCharts();
      }).show();
  });
  
  bindOnClick(backToTop, event => window.scrollTo({
    top: 0,
    behavior: 'smooth',
  }));
  
  let initialized = false;
  const observer = new IntersectionObserver(entries => {
    if (!initialized) return initialized = true;
    if (!entries[0].isIntersecting) {
      searchBox.classList.add('floating');
      backToTop.classList.add('display');
    } else {
      searchBox.classList.remove('floating');
      backToTop.classList.remove('display');
    }
  });
  observer.observe($('sentinel'));
  
  loadCharts();
  await sleep(Time.second * 0.1);
  router.push(firstPath || '/charts');
}

main().catch(err => console.error(err));
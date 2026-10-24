/* 成人百科索引页 ------------------------------------------- */
(function () {
  'use strict';

  var GATE_KEY = 'crbk-age-ok';
  var $ = function (id) { return document.getElementById(id); };

  /* 把 base 和路径拼成完整网址；路径为空就落到首页。
     base 漏写 https:// 时补上 —— 否则拼出来是相对网址，
     会变成 https://<当前域名>/chengrenbaike.com/ 而全部 404。 */
  function urlFor(path) {
    var base = String(SITE.base || '').trim().replace(/\/+$/, '');
    if (!base) return '/';
    if (!/^https?:\/\//i.test(base)) base = 'https://' + base.replace(/^\/+/, '');
    if (!path) return base + '/';
    return base + '/' + String(path).replace(/^\/+/, '');
  }

  function hostOf(url) {
    try { return new URL(url).hostname; }
    catch (e) { return String(url).replace(/^https?:\/\//, '').replace(/\/.*$/, ''); }
  }

  /* --- 报头、入口、页脚 ---------------------------------- */

  function paintChrome() {
    $('wordmark').textContent = SITE.name || '成人百科';
    $('subline').textContent = SITE.subline || '';

    var home = urlFor('');
    $('door').href = home;
    $('door-host').textContent = hostOf(home);

    document.title = (SITE.name || '成人百科') + '索引 - 分类入口与备用地址';

    $('foot-note').textContent = SITE.deployedOn
      ? '本页是 ' + SITE.deployedOn + ' 上的一份索引，正文都在主站。'
      : '本页只是索引，正文都在主站。';
  }

  /* --- 条目索引 ------------------------------------------ */

  function paintIndex() {
    var nav = $('index');
    var frag = document.createDocumentFragment();

    ENTRIES.forEach(function (row) {
      var name = row[0], path = row[1], note = row[2];

      var a = document.createElement('a');
      a.className = 'entry';
      a.href = urlFor(path);

      var line = document.createElement('span');
      line.className = 'entry-line';

      var n = document.createElement('span');
      n.className = 'entry-name';
      n.textContent = name;

      var leader = document.createElement('span');
      leader.className = 'entry-leader';
      leader.setAttribute('aria-hidden', 'true');

      var go = document.createElement('span');
      go.className = 'entry-go';
      go.textContent = '进入';

      line.appendChild(n);
      line.appendChild(leader);
      line.appendChild(go);
      a.appendChild(line);

      if (note) {
        var p = document.createElement('span');
        p.className = 'entry-note';
        p.textContent = note;
        a.appendChild(p);
      }

      frag.appendChild(a);
    });

    nav.appendChild(frag);
    $('count').textContent = ENTRIES.length + ' 个条目';
  }

  /* --- 备用入口 ------------------------------------------ */

  function paintMirrors() {
    var list = SITE.mirrors || [];
    if (!list.length) return;

    var box = $('mirrors');
    list.forEach(function (row) {
      var a = document.createElement('a');
      a.className = 'mirror';
      a.href = row[1];
      a.rel = 'noopener';
      a.textContent = row[0];
      box.appendChild(a);
    });
    $('mirror-block').hidden = false;
  }

  /* --- 连通性探测 ----------------------------------------
     浏览器不能跨域读 HTML，但可以加载图片并监听成功与否。
     任一张图片加载成功 => 主站可直连。
     全部失败只说明「探测没走通」—— 可能是图片本身不存在，
     所以文案不下「主站已挂」的结论，入口按钮也始终可用。

     注意 state 不是一次性闩锁：6 秒超时先报「没探测到」之后，
     如果慢速网络上图片 8 秒才到，仍然要升级成「可直连」。
     受限网络正是这个指示灯的目标用户，不能给假阴性。       */

  function probe() {
    var dot = $('dot');
    var text = $('status-text');
    var hint = $('status-hint');

    var candidates = ['favicon.ico', 'apple-touch-icon.png', 'logo.png'];
    var pending = candidates.length;
    var state = 'checking';
    var started = Date.now();

    function ok() {
      if (state === 'open') return;
      state = 'open';
      dot.dataset.state = 'open';
      text.textContent = '主站可直连（' + (Date.now() - started) + ' 毫秒）';
      hint.hidden = true;
    }

    function unsure() {
      if (state !== 'checking') return;
      state = 'unsure';
      dot.dataset.state = 'unsure';
      text.textContent = '没探测到主站响应';
      hint.textContent = SITE.mirrors && SITE.mirrors.length
        ? '可能是网络受限，也可能只是探测用的图片不存在。入口照样能点，打不开就换下面的备用入口。'
        : '可能是网络受限，也可能只是探测用的图片不存在。入口照样能点，先试一下。';
      hint.hidden = false;
    }

    candidates.forEach(function (file) {
      var img = new Image();
      img.onload = ok;
      img.onerror = function () { if (--pending === 0) unsure(); };
      img.referrerPolicy = 'no-referrer';
      img.src = urlFor(file) + '?_=' + Date.now();
    });

    setTimeout(unsure, 6000);
  }

  /* --- 数据没加载出来时的兜底 ----------------------------- */

  function paintDataError() {
    $('wordmark').textContent = '成人百科';
    $('subline').textContent = '索引页';
    $('dot').dataset.state = 'unsure';
    $('status-text').textContent = '页面数据没能加载';
    $('status-hint').textContent = '刷新一下通常就好。如果反复失败，说明 data.js 被拦截了。';
    $('status-hint').hidden = false;
    $('door').href = 'https://chengrenbaike.com/';
    $('door-host').textContent = 'chengrenbaike.com';
  }

  /* --- 年龄确认 ------------------------------------------
     #page 在 HTML 里带 hidden，确认通过才撤掉。
     不能只靠那层不透明遮罩盖住 —— 遮罩下面的链接仍在 Tab
     顺序里，访客可以一路 Tab 到「进入主站」然后回车进主站，
     整个年龄确认就被绕过了。aria-modal 只影响读屏器，管不了
     键盘焦点。直接 hidden 比 inert 更保险，老浏览器也生效。 */

  function openPage(withProbe) {
    $('gate').hidden = true;
    var page = $('page');
    page.hidden = false;
    page.dataset.ready = '1';
    document.body.style.overflow = '';
    if (withProbe) { try { probe(); } catch (e) {} }
  }

  function runGate(withProbe) {
    var passed;
    try { passed = localStorage.getItem(GATE_KEY) === '1'; }
    catch (e) { passed = false; }

    if (passed) { openPage(withProbe); return; }

    var gate = $('gate');
    gate.hidden = false;
    document.body.style.overflow = 'hidden';
    $('gate-ok').focus();

    $('gate-ok').addEventListener('click', function () {
      try { localStorage.setItem(GATE_KEY, '1'); } catch (e) {}
      openPage(withProbe);
    });

    $('gate-no').addEventListener('click', function () {
      if (history.length > 1) { history.back(); }
      else { location.replace('about:blank'); }
    });
  }

  /* --- 启动 ----------------------------------------------
     渲染放在 try 里，年龄确认永远要跑：data.js 要是没加载成功，
     paintChrome 会在 SITE 上抛 ReferenceError，一旦没兜住，
     runGate 就永远不会执行 —— 门不会弹，页面直接敞着。       */

  var dataOk = true;
  try {
    paintChrome();
    paintIndex();
    paintMirrors();
  } catch (e) {
    dataOk = false;
    try { paintDataError(); } catch (e2) {}
  }

  runGate(dataOk);
})();

(() => {
  'use strict';
  const DEFAULTS = { babyName: '小橙子', hosts: '谢晓青 邓静', date: '2026-10-11', time: '12:00', venue: '在水一方', address: '四川省成都市郫都区青石路青杠树村6号点21栋' };
  const $ = (selector) => document.querySelector(selector);
  const shareDialog = $('#share-dialog');
  const state = Object.freeze({ ...DEFAULTS });
  let toastTimer;
  let posterUrl = '';
  let generating = false;

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('show');
    toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3600);
  }

  const eventDate = () => new Date(`${state.date}T${state.time}:00+08:00`);
  const weekday = () => new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'Asia/Shanghai' }).format(eventDate());
  const dateLabel = () => { const [y,m,d] = state.date.split('-'); return `${y}年${Number(m)}月${Number(d)}日`; };
  const timeLabel = () => { const hour = Number(state.time.slice(0, 2)); return `${hour < 6 ? '凌晨' : hour < 11 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : '晚上'} ${state.time}`; };
  const isLocal = () => location.protocol === 'file:' || /^(localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(location.hostname);
  const isWeChat = () => /MicroMessenger/i.test(navigator.userAgent);

  function updateShareOptions() {
    const local = isLocal();
    $('#copy-link-label').textContent = '复制 H5 请柬链接';
    $('#copy-link-hint').textContent = local ? '本机预览链接，发布后亲友才能打开' : '发到微信，点开就是完整请柬';
    $('#h5-share-notice').hidden = !local && !isWeChat();
    $('#h5-share-notice').textContent = local
      ? '当前请柬还在本机预览。H5 链接可以复制，但亲友暂时无法打开；发布到公网后，即可通过微信分享。'
      : '点击微信右上角「···」→「发送给朋友」转发请柬。封面是否显示由微信决定；粘贴链接会发送网址。';
    $('#native-share').hidden = local || isWeChat() || typeof navigator.share !== 'function';
    $('#share-description').textContent = '把 H5 请柬链接发到微信，亲友点开就能看完整请柬。';
    $('#manual-link').hidden = true;
  }

  function render() {
    document.querySelectorAll('[data-field]').forEach(el => { el.textContent = state[el.dataset.field]; });
    $('#hero-date').textContent = state.date.replaceAll('-', '.');
    $('#hero-weekday').textContent = weekday();
    $('#hero-time').textContent = state.time;
    const day = document.createElement('span');
    day.textContent = weekday();
    $('#event-date').replaceChildren(document.createTextNode(dateLabel() + ' '), day);
    $('#event-time').textContent = `${timeLabel()} · 期待你的到来`;
    $('.closing-section h2').textContent = `${state.babyName}的百日，因你更圆满`;
    document.title = `${state.babyName}的百日宴 · 小日子`;
    $('meta[name="description"]').content = `${state.babyName}宝宝的百日宴 · ${dateLabel()} ${state.time} · ${state.venue}。小小的你，大大的欢喜。`;
    $('meta[property="og:title"]').content = `${state.babyName}宝宝的百日宴邀请函`;
    $('meta[property="og:description"]').content = `${dateLabel()} ${state.time}，相聚${state.venue}。小小的你，大大的欢喜。`;
    if (posterUrl) { URL.revokeObjectURL(posterUrl); posterUrl = ''; }
    $('#poster-preview').hidden = true;
    $('#download-poster').hidden = true;
    $('#poster-hint').hidden = true;
    $('#generate-poster strong').textContent = '保存邀请海报';
    updateShareOptions();
  }

  function openDialog(dialog) {
    if (!dialog.open) dialog.showModal();
  }
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }));
  function openShareDialog() {
    updateShareOptions();
    prepareH5Share();
    openDialog(shareDialog);
  }
  document.querySelectorAll('.share-trigger').forEach(button => button.addEventListener('click', openShareDialog));

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('图片读取失败'));
      image.src = url;
    });
  }

  function invitationText() {
    return `💌 ${state.babyName}宝宝的百日宴\n\n小小的你，大大的欢喜。\n诚邀您一起见证宝贝的第一个成长里程碑。\n\n时间：${dateLabel()} ${weekday()} ${state.time}\n地点：${state.venue}\n地址：${state.address}\n\n${state.hosts} 诚邀\n你的到来，就是最温暖的礼物。`;
  }

  function shareUrl() {
    const url = new URL(location.href);
    url.searchParams.set('v', '20261005-venue');
    url.hash = '';
    return url.href;
  }

  function prepareH5Share() {
    const url = shareUrl();
    // Share the current published invitation; old edited-link data is no longer used.
    if (!isLocal()) {
      try { history.replaceState(null, '', url); } catch { /* Copying still works if URL replacement is unavailable. */ }
    }
    return url;
  }

  async function copyText(value) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* Older WeChat versions use selection copying. */ }
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
    shareDialog.append(textarea);
    textarea.focus(); textarea.select(); textarea.setSelectionRange(0, value.length);
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('当前浏览器无法自动复制。');
  }
  async function copyH5Link() {
    const url = prepareH5Share();
    try {
      await copyText(url);
      toast(isLocal() ? '本机 H5 链接已复制；发布到公网后，亲友才能打开。' : 'H5 请柬链接已复制，粘贴到微信即可分享。');
    } catch {
      $('#share-link-value').value = url;
      $('#manual-link').hidden = false;
      $('#share-link-value').focus();
      $('#share-link-value').select();
      toast('请长按或全选链接，手动复制到微信。');
    }
  }
  $('#copy-link').addEventListener('click', copyH5Link);
  $('#copy-text').addEventListener('click', async () => {
    try { await copyText(invitationText()); toast('邀请文案已复制，去微信粘贴分享吧。'); }
    catch (error) { toast(error.message); }
  });
  $('#native-share').addEventListener('click', async () => {
    if (isLocal()) { toast('发布到公网后，就能直接分享 H5 请柬。'); return; }
    const url = prepareH5Share();
    try {
      await navigator.share({ title: `${state.babyName}宝宝的百日宴邀请函`, text: `小小的你，大大的欢喜。${dateLabel()}，期待与你在${state.venue}相聚。`, url });
    } catch (error) {
      if (error.name !== 'AbortError') await copyH5Link();
    }
  });

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  $('#calendar-button').addEventListener('click', () => {
    const escape = value => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const icsDate = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const fold = line => {
      const lines = []; let part = ''; let bytes = 0;
      for (const char of line) {
        const length = new TextEncoder().encode(char).length;
        if (bytes + length > 73) { lines.push(part); part = ' '; bytes = 1; }
        part += char; bytes += length;
      }
      lines.push(part); return lines.join('\r\n');
    };
    const start = eventDate();
    const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Little Days//Invitation//ZH', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:${state.date}-${encodeURIComponent(state.babyName)}@little-days.invitation`, `DTSTAMP:${icsDate(new Date())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(new Date(start.getTime() + 150 * 60000))}`, `SUMMARY:${escape(state.babyName + '宝宝的百日宴')}`, `LOCATION:${escape(state.venue + ' · ' + state.address)}`, `DESCRIPTION:${escape(state.hosts + '诚邀，期待与你分享百日之喜。')}`, 'END:VEVENT', 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
    downloadBlob(new Blob([content], { type: 'text/calendar;charset=utf-8' }), `${state.babyName}的百日宴.ics`);
    toast('日历邀请已生成，打开文件即可添加。');
  });

  function canvasText(ctx, text, x, y, size, color, options = {}) {
    const family = options.sans ? '"Microsoft YaHei", sans-serif' : '"Noto Serif SC", "Songti SC", "SimSun", serif';
    ctx.font = `${options.italic ? 'italic ' : ''}${size}px ${family}`;
    ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(text, x, y, options.maxWidth || 860);
  }
  function wrapText(ctx, text, width) {
    const result = []; let line = '';
    for (const char of text) {
      if (ctx.measureText(line + char).width > width && line) { result.push(line); line = ''; }
      line += char;
    }
    if (line) result.push(line);
    return result;
  }

  async function makePoster() {
    if (posterUrl || generating) return;
    generating = true;
    const button = $('#generate-poster');
    button.disabled = true;
    button.querySelector('strong').textContent = '正在准备这份可爱…';
    try {
      await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]);
      const cover = await loadImage('./assets/photos/cover.webp');
      const canvas = document.createElement('canvas');
      canvas.width = 1080; canvas.height = 1560;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f8f7f2'; ctx.fillRect(0, 0, 1080, 1560);
      ctx.fillStyle = '#eaf0f1'; ctx.fillRect(34, 34, 1012, 1492);
      ctx.fillStyle = '#94acb916';
      for (let x = 42; x < 1040; x += 9) for (let y = 42; y < 1518; y += 9) { ctx.beginPath(); ctx.arc(x, y, .7, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = '#fffaf1'; ctx.lineWidth = 2; ctx.strokeRect(55, 55, 970, 1450);
      canvasText(ctx, 'A LITTLE CELEBRATION, A LOT OF LOVE', 540, 108, 20, '#91a5ae', { sans: true });
      canvasText(ctx, '✧', 540, 174, 35, '#b6a783');
      canvasText(ctx, '小 小 的 你', 540, 283, 90, '#486778');
      canvasText(ctx, '大 大 的 欢 喜', 540, 404, 90, '#486778');
      ctx.strokeStyle = '#c6b389'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(597, 426); ctx.quadraticCurveTo(698, 411, 807, 422); ctx.stroke();
      canvasText(ctx, `✦  ${state.babyName}宝宝 · 百日宴  ✦`, 540, 497, 37, '#657e8b');
      canvasText(ctx, '你是这个世界，赠予我们最好的礼物', 540, 548, 24, '#8a9ea6', { sans: true });
      ctx.save();
      ctx.shadowColor = '#60777922'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
      ctx.fillStyle = '#fffdf7'; ctx.fillRect(340, 566, 400, 518);
      ctx.restore();
      ctx.drawImage(cover, 356, 582, 368, 368 * cover.naturalHeight / cover.naturalWidth);
      ctx.strokeStyle = '#cbdce0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(150, 1096); ctx.lineTo(930, 1096); ctx.stroke();
      canvasText(ctx, `${state.date.replaceAll('-', '.')}    ${weekday()}    ${state.time}`, 540, 1152, 31, '#597a8c');
      canvasText(ctx, state.venue, 540, 1212, 34, '#597a8c');
      ctx.font = '23px "Microsoft YaHei", sans-serif';
      let addressLines = wrapText(ctx, state.address, 805);
      let addressSize = 23;
      if (addressLines.length > 3) { addressSize = 18; ctx.font = '18px "Microsoft YaHei", sans-serif'; addressLines = wrapText(ctx, state.address, 805); }
      addressLines.forEach((line, index) => canvasText(ctx, line, 540, 1256 + index * 32, addressSize, '#8da0a7', { sans: true }));
      canvasText(ctx, `${state.hosts} 诚邀`, 540, 1383, 24, '#6e8993');
      canvasText(ctx, '你的到来，就是最温暖的礼物', 540, 1430, 22, '#9aaaac');
      ctx.fillStyle = '#f4f7f3'; ctx.fillRect(34, 1476, 1012, 50);
      ctx.fillStyle = '#a2bdcc55';
      for (let x = 34; x < 1046; x += 32) ctx.fillRect(x, 1476, Math.min(16, 1046 - x), 50);
      for (let y = 1476; y < 1526; y += 32) ctx.fillRect(34, y, 1012, Math.min(16, 1526 - y));
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('海报暂时未能生成，请再试一次。');
      posterUrl = URL.createObjectURL(blob);
      $('#poster-image').src = posterUrl;
      $('#poster-preview').hidden = false;
      $('#download-poster').href = posterUrl;
      $('#download-poster').download = `${state.babyName}的百日宴邀请函.png`;
      $('#download-poster').hidden = false;
      $('#poster-hint').hidden = false;
      $('#share-description').textContent = '这份小小的邀请准备好啦，保存后就能分享至微信。';
      $('#poster-preview').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (error) { toast(error.message || '海报暂时未能生成，请再试一次。'); }
    finally { generating = false; button.disabled = false; button.querySelector('strong').textContent = posterUrl ? '邀请海报已生成' : '保存邀请海报'; }
  }
  $('#poster-button').addEventListener('click', () => { openShareDialog(); makePoster(); });
  $('#generate-poster').addEventListener('click', makePoster);

  let audioContext;
  let masterGain;
  let musicTimer;
  let musicOn = false;
  let autoMusicAllowed = true;
  let musicStartRequest = 0;
  let sequence = 0;
  let nextNoteTime = 0;
  const activeNotes = new Set();
  const beat = 60 / 112;
  const melody = [
    76, 79, 81, 79, 76, 0, 74, 0,
    72, 76, 79, 0, 76, 74, 72, 0,
    77, 81, 84, 83, 81, 0, 79, 0,
    79, 76, 74, 0, 72, 0, 67, 0,
    76, 79, 81, 79, 84, 0, 83, 81,
    79, 76, 77, 81, 79, 0, 76, 0,
    77, 81, 79, 76, 74, 0, 79, 0,
    76, 74, 72, 0, 0, 0, 67, 71
  ];
  const chords = [
    [48, 55, 60, 64, 67], [45, 52, 57, 60, 64],
    [53, 60, 60, 65, 69], [55, 62, 59, 62, 67],
    [48, 55, 60, 64, 67], [45, 52, 57, 60, 64],
    [53, 60, 60, 65, 69], [48, 55, 60, 64, 67]
  ];
  function note(midi, time, duration, volume, type = 'sine') {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type; oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, time + duration);
    oscillator.connect(gain); gain.connect(masterGain);
    activeNotes.add(oscillator);
    oscillator.onended = () => { activeNotes.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(time); oscillator.stop(time + duration + .02);
  }
  function musicStep(step, time) {
    const pitch = melody[step];
    const position = step % 8;
    const chord = chords[Math.floor(step / 8)];
    if (pitch) {
      const duration = melody[(step + 1) % melody.length] ? .38 : .64;
      note(pitch, time, duration, .10);
      note(pitch + 12, time, .18, .018);
    }
    if (position === 0 || position === 4) note(chord[position === 0 ? 0 : 1], time, .28, .055, 'triangle');
    if (position === 2 || position === 6) chord.slice(2).forEach((pitch, index) => note(pitch, time + index * .014, .19, .016, 'triangle'));
  }
  function scheduleMusic() {
    if (!musicOn) return;
    // Schedule against the audio clock so the rhythm stays even when frames vary.
    if (nextNoteTime < audioContext.currentTime) nextNoteTime = audioContext.currentTime + .03;
    while (nextNoteTime < audioContext.currentTime + .12) {
      musicStep(sequence, nextNoteTime);
      sequence = (sequence + 1) % melody.length;
      nextNoteTime += beat / 2;
    }
  }
  function setMusic(on) {
    musicOn = on;
    $('#music-toggle').setAttribute('aria-pressed', String(on));
    $('#music-toggle').setAttribute('aria-label', on ? '暂停轻快音乐' : '播放轻快音乐');
    $('#music-toggle').title = on ? '暂停轻快音乐' : '播放轻快音乐';
    clearInterval(musicTimer);
    if (!audioContext) return;
    const now = audioContext.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    if (on) {
      activeNotes.forEach(oscillator => oscillator.stop(now));
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(1, now + .06);
      sequence = 0; nextNoteTime = now + .06;
      scheduleMusic(); musicTimer = setInterval(scheduleMusic, 25);
    } else {
      masterGain.gain.setTargetAtTime(0, now, .012);
      activeNotes.forEach(oscillator => oscillator.stop(now + .06));
    }
  }
  async function startMusic(automatic = false) {
    if (document.hidden || musicOn || automatic && !autoMusicAllowed) return;
    const request = ++musicStartRequest;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) {
        if (!automatic) toast('当前浏览器暂不支持音乐播放。');
        return;
      }
      if (!audioContext) { audioContext = new Audio(); masterGain = audioContext.createGain(); masterGain.connect(audioContext.destination); }
      // Browsers may leave this promise pending until the first user gesture.
      await audioContext.resume();
      if (request !== musicStartRequest || document.hidden || automatic && !autoMusicAllowed) return;
      if (audioContext.state === 'running') {
        setMusic(true);
        autoMusicAllowed = false;
        removeMusicGestureListeners();
      }
    } catch { if (!automatic && request === musicStartRequest) toast('音乐未能播放，轻触按钮再试一次。'); }
  }
  function startMusicOnGesture(event) {
    if (event.target instanceof Element && event.target.closest('#music-toggle')) return;
    if (event.type === 'keydown' && !['Enter', ' '].includes(event.key)) return;
    startMusic(true);
  }
  function removeMusicGestureListeners() {
    ['pointerup', 'touchend', 'keydown'].forEach(type => document.removeEventListener(type, startMusicOnGesture));
  }
  function startWeChatMusic() {
    if (!autoMusicAllowed || !window.WeixinJSBridge?.invoke) return;
    try {
      window.WeixinJSBridge.invoke('getNetworkType', {}, () => startMusic(true));
    } catch { /* A normal page gesture can still start playback. */ }
  }
  $('#music-toggle').addEventListener('click', () => {
    autoMusicAllowed = false;
    musicStartRequest++;
    removeMusicGestureListeners();
    if (musicOn) setMusic(false);
    else startMusic();
  });
  ['pointerup', 'touchend', 'keydown'].forEach(type => document.addEventListener(type, startMusicOnGesture, { passive: true }));
  document.addEventListener('WeixinJSBridgeReady', startWeChatMusic);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { musicStartRequest++; if (musicOn) setMusic(false); }
    else if (autoMusicAllowed) startMusic(true);
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) document.querySelectorAll('.desktop-nav a').forEach(link => link.classList.toggle('active', link.hash === '#' + entry.target.id));
    }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
    ['invitation', 'memories', 'details'].forEach(id => observer.observe(document.getElementById(id)));
  }
  render();
  startMusic(true);
  startWeChatMusic();
})();

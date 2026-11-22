/* Menu installation only. No order/customer data is accessed. */
(() => {
  'use strict';
  const widget = document.getElementById('menuInstall');
  const button = document.getElementById('menuInstallButton');
  const help = document.getElementById('menuInstallHelp');
  const close = document.getElementById('menuInstallClose');
  const done = document.getElementById('menuInstallDone');
  const text = document.getElementById('menuInstallSteps');
  if (!widget || !button || !help) return;
  const key = '3al7ella.menuInstalled.v1';
  const mode = window.matchMedia('(display-mode: standalone)');
  const standalone = () => mode.matches || navigator.standalone === true;
  let installed = false;
  try { installed = localStorage.getItem(key) === '1'; } catch (_) {}
  let promptEvent = null;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/i.test(navigator.userAgent);
  const hide = () => {
    widget.hidden = true; help.hidden = true;
    document.body.classList.remove('menu-install-visible');
  };
  const markInstalled = () => {
    installed = true;
    try { localStorage.setItem(key, '1'); } catch (_) {}
    hide();
  };
  const show = () => {
    if (installed || standalone()) return;
    widget.hidden = false;
    document.body.classList.add('menu-install-visible');
  };
  const showHelp = () => {
    text.textContent = ios
      ? 'على الآيفون: افتح المنيو في Safari، واضغط مشاركة ↑ ثم «إضافة إلى الشاشة الرئيسية» ثم «إضافة».'
      : android
        ? 'افتح المنيو في Chrome، واضغط قائمة ⋮ ثم «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». لو لسه بتجهز، جرّب الزر بعد لحظات.'
        : 'من قائمة المتصفح اختار «تثبيت ع الحلة» أو «إضافة إلى الشاشة الرئيسية». لو الخيار مش ظاهر، افتح المنيو في Chrome على موبايلك.';
    help.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    close.focus();
  };
  const closeHelp = () => { help.hidden = true; button.setAttribute('aria-expanded', 'false'); button.focus(); };
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); promptEvent = event; show();
  });
  window.addEventListener('appinstalled', markInstalled);
  mode.addEventListener('change', event => { if (event.matches) markInstalled(); });
  window.addEventListener('storage', event => { if (event.key === key && event.newValue === '1') { installed = true; hide(); } });
  close.addEventListener('click', closeHelp);
  done.addEventListener('click', markInstalled);
  help.addEventListener('click', event => { if (event.target === help) closeHelp(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !help.hidden) closeHelp(); });
  button.addEventListener('click', async () => {
    if (!promptEvent) { showHelp(); return; }
    const event = promptEvent; promptEvent = null; button.disabled = true;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === 'accepted') hide();
      // Only appinstalled confirms completion. A cancelled install stays available.
    } catch (_) { showHelp(); }
    finally { button.disabled = false; }
  });
  if (standalone()) markInstalled(); else show();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/menu-sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    });
  }
})();

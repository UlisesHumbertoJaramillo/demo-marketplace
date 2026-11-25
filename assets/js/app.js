/* Router, layout general, navegación por rol y delegación de eventos. */
(function () {
  const A = window.App;
  A.views = A.views || {};
  A.actions = A.actions || {};
  A.live = A.live || {};

  /* ---------- Formularios: borradores en App.ui para sobrevivir re-renders ---------- */
  A.getPath = function (path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), A.ui);
  };
  A.setPath = function (path, val) {
    const keys = path.split('.');
    let o = A.ui;
    keys.slice(0, -1).forEach((k) => { if (o[k] == null) o[k] = {}; o = o[k]; });
    o[keys[keys.length - 1]] = val;
  };
  A.val = (path, def = '') => { const v = A.getPath(path); return v == null ? def : v; };

  /* ---------- Navegación por rol ---------- */
  const NAV = {
    cliente: [
      ['#/', 'Explorar', 'search'],
      ['#/mis-solicitudes', 'Mis solicitudes', 'assignment'],
      ['#/trabajos', 'Trabajos', 'timeline'],
      ['#/perfil', 'Perfil', 'person'],
    ],
    prestador: [
      ['#/', 'Oportunidades', 'work'],
      ['#/mis-postulaciones', 'Mis postulaciones', 'request_quote'],
      ['#/trabajos', 'Trabajos', 'timeline'],
      ['#/perfil', 'Perfil', 'person'],
    ],
    admin: [
      ['#/admin', 'Panel admin', 'admin_panel_settings'],
      ['#/arbitraje', 'Arbitraje', 'gavel'],
      ['#/', 'Explorar', 'search'],
      ['#/perfil', 'Perfil', 'person'],
    ],
    arbitro: [
      ['#/arbitraje', 'Arbitraje', 'gavel'],
      ['#/perfil', 'Perfil', 'person'],
    ],
  };
  const ROL_LABEL = { cliente: 'Cliente', prestador: 'Prestador', admin: 'Administrador', arbitro: 'Árbitro / Soporte' };
  A.ROL_LABEL = ROL_LABEL;

  function parse() {
    const h = (location.hash || '#/').replace(/^#/, '');
    const parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'explorar', params: parts.slice(1), path: '#/' + parts.join('/') };
  }

  const ROUTES = {
    explorar: 'explorar', registro: 'registro', perfil: 'perfil', login: 'login', inicio: 'landing',
    publicar: 'publicar', 'mis-solicitudes': 'misSolicitudes', solicitud: 'solicitud',
    'mis-postulaciones': 'misPostulaciones', trabajos: 'trabajos', trabajo: 'trabajo',
    admin: 'admin', arbitraje: 'arbitraje',
  };
  const ALLOWED = {
    publicar: ['cliente'], 'mis-solicitudes': ['cliente'], 'mis-postulaciones': ['prestador'],
    trabajos: ['cliente', 'prestador'], admin: ['admin'], arbitraje: ['admin', 'arbitro'],
  };

  function demoBar(me) {
    const myId = me ? me.id : '';
    const users = A.state.users.filter((u) => u.estado !== 'suspendido' || u.id === myId);
    const groups = (me ? '' : '<option value="" selected>— Sin sesión —</option>') + ['cliente', 'prestador', 'admin', 'arbitro'].map((r) => `<optgroup label="${ROL_LABEL[r]}">${users.filter((u) => u.rol === r).map((u) =>
      `<option value="${u.id}" ${u.id === myId ? 'selected' : ''}>${A.esc(A.fullName(u))}${u.estado === 'pendiente' ? ' (pendiente)' : ''}</option>`).join('')}</optgroup>`).join('');
    return `<div class="bg-slate-950 text-white text-xs">
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 h-10 flex items-center gap-3">
        <span class="font-head font-bold tracking-widest text-[10px] text-amber-300 hidden sm:inline">DEMO INTERACTIVA</span>
        <label class="flex items-center gap-2 min-w-0"><span class="opacity-70 hidden sm:inline">Ver como</span>
          <select class="bg-slate-800 border border-slate-600 text-white text-xs px-2 py-1 max-w-[170px] sm:max-w-none" data-change="switch-user">${groups}</select></label>
        <a href="#/login" class="underline underline-offset-2 opacity-80 hover:opacity-100 whitespace-nowrap hidden sm:inline">Login</a>
        <a href="#/registro" class="underline underline-offset-2 opacity-80 hover:opacity-100 whitespace-nowrap">+ Registrar<span class="hidden sm:inline"> usuario</span></a>
        <button class="ml-auto opacity-80 hover:opacity-100 flex items-center gap-1 whitespace-nowrap" data-action="reset">${A.icon('restart_alt', '!text-base')} <span class="hidden sm:inline">Reiniciar demo</span></button>
      </div></div>`;
  }

  function header(me, route) {
    const nav = NAV[me.rol] || [];
    // Cliente: lo que le falta pagar de sus trabajos en curso · Prestador: lo que le falta cobrar (etapas sin pagar)
    const pendiente = A.state.solicitudes.filter((s) => s.escrow && (s.clienteId === me.id || (s.asignada && s.asignada.prestadorId === me.id)))
      .reduce((a, s) => { const pp = A.porPagar(s); return a + (me.rol === 'prestador' ? pp.neto : pp.cliente); }, 0);
    const isActive = (href) => {
      const r = '#/' + (route.name === 'explorar' ? '' : route.name);
      if (href === '#/') return route.name === 'explorar';
      return r.startsWith(href) || (href === '#/trabajos' && route.name === 'trabajo') || (href === '#/mis-solicitudes' && route.name === 'solicitud' && me.rol === 'cliente') || (href === '#/mis-postulaciones' && route.name === 'solicitud' && me.rol === 'prestador');
    };
    return `<header class="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-outline-variant/60">
      ${demoBar(me)}
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center gap-4">
        <a href="#/" class="flex items-center gap-2 shrink-0">
          <img src="assets/img/logo.jpg" alt="" class="h-8 w-8 object-contain">
          <div class="leading-none"><div class="font-head font-bold text-primary text-lg tracking-tight">OFICIOSYA</div>
          <div class="font-head text-[9px] tracking-wider text-on-surface-variant hidden md:block">PAGO POR ETAPA & ARBITRAJE</div></div>
        </a>
        <span class="hidden xl:inline-flex items-center gap-1 bg-tertiary text-white font-head text-[10px] font-bold px-2 py-1 tracking-wider">${A.icon('verified_user', '!text-sm')} PAGO POR ETAPA</span>
        <nav class="hidden md:flex items-center gap-1 ml-2">
          ${nav.filter((n) => n[0] !== '#/perfil').map((n) => `<a href="${n[0]}" class="navlink ${isActive(n[0]) ? 'active' : ''}">${n[1]}</a>`).join('')}
        </nav>
        <div class="ml-auto flex items-center gap-3">
          ${me.rol === 'cliente' ? `<a href="#/publicar" class="btn-primary btn-sm hidden md:inline-flex">${A.icon('add_circle')} Nueva publicación</a>` : ''}
          <a href="#/perfil" class="flex items-center gap-2">
            <div class="text-right leading-tight hidden sm:block">
              <div class="font-head text-sm font-semibold">${A.esc(A.fullName(me))}</div>
              <div class="font-head text-[10px] tracking-wide text-on-surface-variant uppercase">${ROL_LABEL[me.rol]}${me.rol === 'cliente' ? ' · ' + A.money(pendiente) + ' por pagar' : me.rol === 'prestador' ? ' · ' + A.money(pendiente) + ' por cobrar' + (A.pendientesDe((x) => x.prestadorId === me.id).length ? ' · reembolso pendiente' : '') : ''}</div>
            </div>
            ${A.avatar(me, 'w-9 h-9', 'rounded-full')}
          </a>
          <button class="hidden md:flex text-on-surface-variant hover:text-red-600" data-action="logout" title="Cerrar sesión">${A.icon('logout')}</button>
        </div>
      </div>
    </header>`;
  }

  function bottomNav(me, route) {
    const nav = NAV[me.rol] || [];
    const items = me.rol === 'cliente' ? [nav[0], ['#/publicar', 'Publicar', 'add_circle'], nav[1], nav[2], nav[3]] : nav;
    return `<nav class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-outline-variant flex">
      ${items.map((n) => {
        const act = ('#/' + (route.name === 'explorar' ? '' : route.name)) === n[0] || (n[0] === '#/trabajos' && route.name === 'trabajo');
        return `<a href="${n[0]}" class="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${act ? 'text-primary-container' : 'text-on-surface-variant'}">
          ${A.icon(n[2], act ? 'ms-fill' : '')}<span class="font-head text-[9px] font-semibold uppercase tracking-wide text-center leading-tight">${n[1]}</span></a>`;
      }).join('')}</nav>`;
  }

  function footer() {
    return `<footer class="border-t border-outline-variant/60 bg-surface-container-low mt-12">
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-8 grid md:grid-cols-3 gap-6 text-xs text-on-surface-variant">
        <div><div class="font-head font-bold text-primary text-base mb-1">OFICIOSYA</div>Marketplace de servicios de oficios con pago por etapa vía Mercado Pago, validación de identidad y arbitraje.</div>
        <div><div class="font-head font-semibold text-on-surface mb-1 uppercase tracking-wide">Protocolo</div>1. El cliente paga cada etapa antes de que empiece.<br>2. El prestador la ejecuta, sube evidencias y el cliente la aprueba.<br>3. Si el cliente no responde en el plazo, la etapa se aprueba sola. La última cierra el trabajo.</div>
        <div class="md:text-right"><a href="#/inicio" class="underline font-semibold text-primary">¿Qué es OficiosYa?</a><br>Demo funcional sin servidor — los datos se guardan solo en este navegador.<br>Pagos, emails y reembolsos son simulados.</div>
      </div></footer>`;
  }

  /* Cabecera para visitantes sin sesión */
  function headerPublic(route) {
    return `<header class="sticky top-0 z-50 bg-surface/95 backdrop-blur border-b border-outline-variant/60">
      ${demoBar(null)}
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center gap-4">
        <a href="#/inicio" class="flex items-center gap-2 shrink-0">
          <img src="assets/img/logo.jpg" alt="" class="h-8 w-8 object-contain">
          <div class="font-head font-bold text-primary text-lg tracking-tight leading-none">OFICIOSYA</div></a>
        <div class="ml-auto flex items-center gap-2">
          <a href="#/login" class="${route.name === 'login' ? 'btn-primary' : 'btn-ghost'} btn-sm">${A.icon('login')} Ingresar</a>
          <a href="#/registro" class="${route.name === 'registro' ? 'btn-primary' : 'btn-ghost'} btn-sm">${A.icon('person_add')} <span class="hidden sm:inline">Crear cuenta</span></a>
        </div></div></header>`;
  }

  A.render = function () {
    A.checkPlazos();
    const me = A.me();
    const route = parse();
    if (!me) {
      // Sin sesión: landing (portada), login y registro
      const body = route.name === 'registro' ? A.views.registro(route.params, null)
        : route.name === 'login' ? A.views.login(route.params, null)
        : A.views.landing(route.params, null);
      document.getElementById('app').innerHTML = headerPublic(route) + `<main>${body}</main>` + footer();
      if (A.after) { const fn = A.after; A.after = null; fn(); }
      return;
    }
    let key = ROUTES[route.name] || 'explorar';
    let body;
    if (ALLOWED[route.name] && !ALLOWED[route.name].includes(me.rol)) {
      body = A.noAccess(`Esta sección es para el rol <b>${ALLOWED[route.name].map((r) => ROL_LABEL[r]).join(' / ')}</b>. Cambiá de usuario en la barra superior.`);
    } else {
      body = A.views[key](route.params, me);
    }
    document.getElementById('app').innerHTML = header(me, route) + `<main class="pb-24 md:pb-0">${body}</main>` + footer() + bottomNav(me, route);
    if (A.after) { const fn = A.after; A.after = null; fn(); }
  };

  A.noAccess = (msg) => `<div class="max-w-xl mx-auto px-4 py-16 text-center">
      <div class="inline-flex w-14 h-14 items-center justify-center bg-surface-container text-primary mb-4">${A.icon('lock', '!text-3xl')}</div>
      <h1 class="text-2xl font-bold mb-2">Acceso restringido</h1><p class="text-on-surface-variant">${msg}</p></div>`;

  A.pageHead = (crumbs, title, right = '') => `<section class="bg-white border-b border-outline-variant/60">
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-5 md:py-7">
        ${crumbs ? `<div class="font-head text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-2 flex flex-wrap gap-x-2 items-center">${crumbs}</div>` : ''}
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="min-w-0">${title}</div>${right ? `<div class="shrink-0">${right}</div>` : ''}
        </div></div></section>`;

  A.go = (hash) => { if (location.hash === hash) A.render(); else location.hash = hash; window.scrollTo(0, 0); };

  /* ---------- Eventos ---------- */
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const act = el.dataset.action;
    if (act === 'modal-bg') { if (ev.target === el) A.closeModal(); return; }
    if (act === 'close-modal') { A.closeModal(); return; }
    if (act === 'zoom') { const b = ev.target.closest('button'); if (b && b !== el) return; A.lightbox(el.dataset.src); return; }
    if (act === 'reset') { if (confirm('¿Reiniciar la demo con los datos de ejemplo? Se pierden los cambios hechos.')) A.reset(); return; }
    if (act === 'sample-photos') {
      const list = A.getPath(el.dataset.target) || [];
      A.setPath(el.dataset.target, list.concat(window.FOTOS_EJEMPLO[el.dataset.set] || []));
      A.rerender(); return;
    }
    if (act === 'remove-photo') {
      const list = A.getPath(el.dataset.target) || [];
      list.splice(Number(el.dataset.idx), 1); A.rerender(); return;
    }
    const fn = A.actions[act];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  });

  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') return; // los maneja 'change'
    if (el.dataset.model) {
      A.setPath(el.dataset.model, el.type === 'checkbox' ? el.checked : el.value);
      if (el.dataset.live && A.live[el.dataset.live]) A.live[el.dataset.live]();
    }
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.dataset.model && (el.type === 'checkbox' || el.type === 'radio' || el.tagName === 'SELECT')) {
      A.setPath(el.dataset.model, el.type === 'checkbox' ? el.checked : el.value);
      if (el.dataset.rerender !== undefined) A.rerender();
      if (el.dataset.live && A.live[el.dataset.live]) A.live[el.dataset.live]();
    }
    if (el.dataset.change === 'switch-user') {
      if (!el.value) return;
      A.state.currentUserId = el.value; A.ui = {}; A.save();
      const me = A.me();
      const home = { cliente: '#/', prestador: '#/', admin: '#/admin', arbitro: '#/arbitraje' }[me.rol];
      const r = parse();
      // si la vista actual es válida para el nuevo rol (p. ej. el mismo trabajo), se mantiene
      const keep = (r.name !== 'login' && r.name !== 'registro') && (r.name === 'trabajo' || r.name === 'solicitud' || r.name === 'explorar' || r.name === 'perfil') ||
                   (ALLOWED[r.name] && ALLOWED[r.name].includes(me.rol));
      A.toast(`Ahora ves la plataforma como <b>${A.esc(A.fullName(me))}</b> (${ROL_LABEL[me.rol]}).`);
      if (keep) A.render(); else A.go(home);
    }
    if (el.dataset.upload) {
      const target = el.dataset.upload;
      A.readImages(el.files).then((imgs) => {
        A.setPath(target, (A.getPath(target) || []).concat(imgs));
        A.rerender();
      });
    }
  });

  /* Re-render conservando el scroll (para cambios dentro de la misma vista) */
  A.rerender = function () {
    const y = window.scrollY;
    A.render();
    window.scrollTo(0, y);
  };

  /* Cambios que modifican datos: guardar + re-render */
  A.commit = function (msg, kind) { A.save(); A.rerender(); if (msg) A.toast(msg, kind); };

  window.addEventListener('hashchange', () => { A.closeModal(); A.render(); window.scrollTo(0, 0); });
  A.render();
})();

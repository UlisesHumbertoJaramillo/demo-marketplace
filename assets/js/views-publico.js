/* Vistas: Explorar solicitudes, Registro con verificación de email, Perfil. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;
  const MSG_KYC = 'Tu cuenta de Mercado Pago no tiene la identidad validada (KYC 6). Validala desde la app de Mercado Pago (DNI, foto y datos personales) y volvé a vincularla.';

  /* =================== EXPLORAR =================== */
  /* Solicitudes que el rol puede ver en el explorador (ver App.visibilidad) */
  const baseVisible = (me) => A.state.solicitudes.filter((s) => A.visibilidad(s, me));

  function visibles(me) {
    const f = A.ui.exp || {};
    const q = (f.q || '').toLowerCase().trim();
    return baseVisible(me).filter((s) => {
      if (f.estado && f.estado !== 'todas' && s.estado !== f.estado) return false;
      if (f.cat && f.cat !== 'Todos' && s.categoria !== f.cat) return false;
      const prest = s.asignada ? A.fullName(A.user(s.asignada.prestadorId)) : '';
      // En las tarjetas resumidas no se busca dentro de la descripción ni del código postal (no se muestran).
      const texto = A.visibilidad(s, me) === 'full' ? s.titulo + ' ' + s.descripcion + ' ' + s.zona + ' ' + s.cp : s.titulo + ' ' + s.zona;
      if (q && !(texto + ' ' + s.categoria + ' ' + prest).toLowerCase().includes(q)) return false;
      return true;
    }).sort((a, b) => {
      if (f.orden === 'calificacion') {
        const k = (s) => (s.resena ? s.resena.estrellas * 10 : -1) + (s.asignada ? (A.user(s.asignada.prestadorId).rating || 0) / 10 : -100);
        return k(b) - k(a);
      }
      return (a.estado === 'abierta' ? -1 : 0) - (b.estado === 'abierta' ? -1 : 0) || b.creada.localeCompare(a.creada);
    });
  }

  function cta(s, me) {
    const involucrado = s.clienteId === me.id || (s.asignada && s.asignada.prestadorId === me.id);
    if (s.estado === 'abierta') {
      if (me.rol === 'prestador') {
        const ya = s.postulaciones.find((p) => p.prestadorId === me.id);
        return `<a href="#/solicitud/${s.id}" class="${ya ? 'btn-ghost' : 'btn-primary'} btn-sm">${ya ? 'Ver mi postulación' : 'Ver pliego y postularse'} ${A.icon('chevron_right')}</a>`;
      }
      if (s.clienteId === me.id) return `<a href="#/solicitud/${s.id}" class="btn-primary btn-sm">Ver postulaciones (${s.postulaciones.length}) ${A.icon('chevron_right')}</a>`;
      return `<a href="#/solicitud/${s.id}" class="btn-ghost btn-sm">Ver detalle</a>`;
    }
    if (involucrado || me.rol === 'admin') return `<a href="#/trabajo/${s.id}" class="btn-ghost btn-sm">${A.icon('timeline')} Ver seguimiento</a>`;
    return `<span class="text-[11px] text-on-surface-variant flex items-center gap-1">${A.icon('lock', '!text-sm')} Visible solo para los involucrados</span>`;
  }

  /* Tarjeta resumida: trabajo terminado de otro cliente / otro prestador. Sin fotos, descripción, CP ni datos del cliente. */
  function resumenCard(s) {
    return `<article class="card fade-in">
      <div class="px-4 md:px-5 pt-4 flex flex-wrap items-center gap-2 justify-between">
        <div class="flex flex-wrap gap-2 items-center">${A.estadoChip(s)}<span class="chip-blue">${esc(s.categoria)}</span></div>
        <span class="text-xs text-on-surface-variant flex items-center gap-1">${A.icon('location_on', '!text-sm')} ${esc(s.zona)}</span>
      </div>
      <h3 class="px-4 md:px-5 pt-2 pb-3 font-head font-bold text-base md:text-lg uppercase leading-tight">${esc(s.titulo)}</h3>
      ${atendida(s)}
      <div class="border-t border-outline-variant/60 px-4 md:px-5 py-2 text-[11px] text-on-surface-variant flex items-center gap-1">${A.icon('lock', '!text-sm')} Trabajo de otro cliente: por privacidad solo se muestra el resultado y la calificación.</div>
    </article>`;
  }

  function card(s, me) {
    if (A.visibilidad(s, me) === 'resumen') return resumenCard(s);
    const cliente = A.user(s.clienteId);
    let box;
    if (s.estado === 'abierta') {
      // el prestador ve montos netos (lo que cobra cada uno); cliente y admin ven el precio final
      const tot = A.presupuestos(s).map((p) => (me.rol === 'prestador' ? A.totalPost(p) : A.precioCliente(p)));
      const nv = A.visitasActivas(s).length;
      const vis = nv ? `<div class="text-[11px] text-secondary font-semibold">${nv} visita${nv > 1 ? 's' : ''} técnica${nv > 1 ? 's' : ''} ofrecida${nv > 1 ? 's' : ''}</div>` : '';
      box = tot.length
        ? `<div class="lbl !mb-0">Rango cotizado</div><div class="money text-xl text-primary">${A.money(Math.min(...tot))}${tot.length > 1 ? ' – ' + A.money(Math.max(...tot)) : ''}</div><div class="text-[11px] text-on-surface-variant">${tot.length} presupuesto${tot.length > 1 ? 's' : ''} recibido${tot.length > 1 ? 's' : ''}</div>${vis}`
        : `<div class="lbl !mb-0">Presupuestos</div><div class="font-head text-sm font-semibold">Sin cotizaciones aún</div><div class="text-[11px] text-on-surface-variant">${nv ? '' : 'Sé el primero en postularte'}</div>${vis}`;
    } else if (s.estado === 'completada') {
      box = me.rol === 'prestador'
        ? `<div class="lbl !mb-0">Cobrado</div><div class="money text-xl text-tertiary">${A.money(s.escrow.liberadoPrestador)}</div><div class="text-[11px] text-on-surface-variant">Trabajo terminado</div>`
        : `<div class="lbl !mb-0">Pagado</div><div class="money text-xl text-tertiary">${A.money(s.escrow.cobrado - (s.escrow.reembolsado || 0))}</div><div class="text-[11px] text-on-surface-variant">Trabajo terminado</div>`;
    } else if (s.estado === 'resuelta' || s.estado === 'cancelada') {
      box = `<div class="lbl !mb-0">Pagado</div><div class="money text-xl">${A.money(s.escrow.cobrado - (s.escrow.reembolsado || 0))}</div><div class="text-[11px] text-on-surface-variant">${s.estado === 'cancelada' ? 'Trabajo rescindido' : 'Resuelto por arbitraje'}</div>`;
    } else {
      const pp = A.porPagar(s);
      box = s.estado === 'en_disputa'
        ? `<div class="lbl !mb-0">En disputa</div><div class="money text-xl text-red-600">${A.money(A.enJuego(s))}</div><div class="text-[11px] text-on-surface-variant">Pago de la etapa en curso</div>`
        : `<div class="lbl !mb-0">${me.rol === 'prestador' ? 'Cobrado por etapas' : 'Pagado por etapas'}</div><div class="money text-xl text-secondary">${A.money(me.rol === 'prestador' ? s.escrow.liberadoPrestador : s.escrow.cobrado)}</div><div class="text-[11px] text-on-surface-variant">${pp.n ? `${pp.n} etapa${pp.n === 1 ? '' : 's'} sin pagar` : 'Todas las etapas pagadas'}</div>`;
    }
    const hechos = (s.hitos || []).filter((h) => h.estado === 'completado').length;
    return `<article class="card fade-in">
      <div class="px-4 md:px-5 pt-4 flex flex-wrap items-center gap-2 justify-between">
        <div class="flex flex-wrap gap-2 items-center">${A.estadoChip(s)}<span class="font-head text-[10px] text-on-surface-variant tracking-wider">REF #${s.id}</span></div>
        ${s.estado !== 'abierta' ? `<span class="font-head text-[11px] text-secondary font-semibold">Hito ${hechos} de ${s.hitos.length}</span>` : `<span class="font-head text-[11px] text-on-surface-variant">${A.icon('schedule', '!text-sm')} Publicada ${s.creada.slice(5, 10).split('-').reverse().join('/')}</span>`}
      </div>
      <div class="p-4 md:p-5 grid md:grid-cols-[1fr_210px] gap-4">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2 mb-2"><span class="chip-blue">${esc(s.categoria)}</span>
            <span class="text-xs text-on-surface-variant flex items-center gap-1">${A.icon('location_on', '!text-sm')} ${esc(s.zona)} (CP ${esc(s.cp)})</span></div>
          <h3 class="font-head font-bold text-lg md:text-xl uppercase leading-tight mb-2">${esc(s.titulo)}</h3>
          <p class="text-sm text-on-surface-variant line-clamp-2">${esc(s.descripcion)}</p>
          <div class="mt-3 grid grid-cols-3 gap-2 bg-surface-container-low border border-outline-variant/60 p-2">
            <div><div class="lbl !mb-0 !text-[9px]">Partes a hacer</div><div class="font-head font-semibold text-sm">${s.tareas.length}</div></div>
            <div><div class="lbl !mb-0 !text-[9px]">${s.estado === 'abierta' ? 'Postulaciones' : 'Etapas'}</div><div class="font-head font-semibold text-sm">${s.estado === 'abierta' ? s.postulaciones.length : s.hitos.length}</div></div>
            <div><div class="lbl !mb-0 !text-[9px]">Fotos</div><div class="font-head font-semibold text-sm">${s.fotos.length}</div></div>
          </div>
        </div>
        <div class="flex flex-row md:flex-col gap-3">
          <div class="relative w-32 md:w-full shrink-0 border border-slate-950/80">
            ${s.fotos[0] ? `<img src="${s.fotos[0]}" alt="" class="w-full h-24 md:h-32 object-cover">` : `<div class="h-24 md:h-32 bg-surface-container flex items-center justify-center">${A.icon('image', '!text-3xl text-outline')}</div>`}
            <span class="absolute bottom-0 left-0 bg-slate-950 text-white font-head text-[9px] font-bold px-1.5 py-0.5">${s.fotos.length} FOTOS</span>
          </div>
          <div class="flex-1 bg-surface-container-low border border-outline-variant/60 p-3">${box}</div>
        </div>
      </div>
      ${s.asignada ? atendida(s) : ''}
      <div class="border-t border-outline-variant/60 px-4 md:px-5 py-3 flex flex-wrap gap-3 items-center justify-between">
        <span class="text-[11px] font-head uppercase tracking-wide text-on-surface-variant flex items-center gap-1">${A.icon('verified', '!text-base text-tertiary')} Cliente con DNI y email verificado · ${esc(cliente.id === me.id ? A.fullName(cliente) + ' (vos)' : A.shortName(cliente))}</span>
        ${cta(s, me)}
      </div>
    </article>`;
  }

  /* Prestador que atendió la solicitud: calificación en este trabajo, general y en este oficio */
  function atendida(s) {
    const u = A.user(s.asignada.prestadorId); const st = A.statsPrestador(u.id); const c = st.porCat[s.categoria];
    const enEsta = s.resena
      ? `<div class="flex items-center gap-1">${A.stars(s.resena.estrellas)}<b class="font-head text-sm">${s.resena.estrellas}/5</b></div>`
      : `<div class="text-xs text-on-surface-variant">${s.estado === 'completada' || s.estado === 'resuelta' ? 'El cliente aún no calificó' : s.estado === 'cancelada' ? 'Trabajo rescindido' : 'Trabajo en curso'}</div>`;
    return `<div class="mx-4 md:mx-5 mb-4 border border-outline-variant bg-surface-container-lowest">
      <div class="px-3 py-2 bg-surface-container-low border-b border-outline-variant/60 font-head text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">${A.icon('engineering', '!text-sm')} Atendida por</div>
      <div class="p-3 grid grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr] gap-3 items-center">
        <div class="col-span-2 md:col-span-1 flex items-center gap-2 min-w-0">${A.avatar(u, 'w-10 h-10', 'rounded-full')}
          <div class="min-w-0"><div class="font-head font-semibold text-sm truncate">${esc(A.fullName(u))}</div><div class="text-[10px] text-primary font-head uppercase truncate">${esc(u.oficio || '')}</div></div></div>
        <div><div class="lbl !mb-0 !text-[9px]">En esta solicitud</div>${enEsta}</div>
        <div><div class="lbl !mb-0 !text-[9px]">Calificación general</div><div class="font-head text-sm"><span class="text-amber-500">★</span> <b>${st.general || '—'}</b> <span class="text-[11px] text-on-surface-variant">· ${st.trabajos || 0} trabajos</span></div></div>
        <div><div class="lbl !mb-0 !text-[9px]">En ${esc(s.categoria)}</div>${c ? `<div class="font-head text-sm"><span class="text-amber-500">★</span> <b>${c.avg}</b> <span class="text-[11px] text-on-surface-variant">· ${c.n} reseña${c.n > 1 ? 's' : ''}</span></div>` : '<div class="text-xs text-on-surface-variant">Sin reseñas en este oficio</div>'}</div>
      </div>
      ${s.resena ? `<div class="px-3 pb-3 text-xs text-on-surface-variant italic line-clamp-2">“${esc(s.resena.comentario)}”${(s.resena.seguimientos || []).length ? ` <span class="not-italic font-semibold text-on-surface">· ${s.resena.seguimientos.length} comentario(s) posterior(es)</span>` : ''}</div>` : ''}
    </div>`;
  }

  /* Ranking de prestadores por oficio según las reseñas de la plataforma */
  function ranking(cat) {
    const filas = [];
    A.state.users.filter((u) => u.rol === 'prestador').forEach((u) => {
      const st = A.statsPrestador(u.id);
      Object.entries(st.porCat).forEach(([c, v]) => filas.push({ u, c, avg: v.avg, n: v.n }));
    });
    const orden = (a, b) => b.avg - a.avg || b.n - a.n;
    let lista; let titulo;
    if (cat && cat !== 'Todos') { lista = filas.filter((f) => f.c === cat).sort(orden).slice(0, 5); titulo = `Mejor valorados en ${esc(cat)}`; }
    else {
      const mejor = {}; filas.sort(orden).forEach((f) => { if (!mejor[f.c]) mejor[f.c] = f; });
      lista = Object.values(mejor).sort(orden); titulo = 'Mejor valorado por oficio';
    }
    return `<div class="card p-5">
      <div class="sec-title mb-1">${A.icon('star', 'text-amber-500 ms-fill')} ${titulo}</div>
      <p class="text-[11px] text-on-surface-variant mb-3">Promedio de las calificaciones de clientes en trabajos cerrados en la plataforma.</p>
      ${lista.length ? `<ol class="space-y-2">${lista.map((f, i) => `<li class="flex items-center gap-2">
          <span class="w-5 text-center font-head font-bold text-xs text-on-surface-variant">${i + 1}</span>${A.avatar(f.u, 'w-8 h-8', 'rounded-full')}
          <div class="flex-1 min-w-0"><div class="text-sm font-semibold truncate">${esc(A.fullName(f.u))}</div><div class="text-[10px] font-head uppercase text-primary">${esc(f.c)} · ${f.n} reseña${f.n > 1 ? 's' : ''}</div></div>
          <div class="font-head font-bold text-sm whitespace-nowrap"><span class="text-amber-500">★</span> ${f.avg}</div></li>`).join('')}</ol>`
        : '<div class="text-xs text-on-surface-variant">Todavía no hay trabajos calificados en este oficio.</div>'}
      <button class="btn-ghost btn-sm w-full mt-3" data-action="exp-orden" data-v="calificacion">${A.icon('star')} Ver trabajos mejor calificados</button>
    </div>`;
  }

  function listHtml(me) {
    const list = visibles(me);
    if (!list.length) return `<div class="card p-10 text-center text-on-surface-variant">No hay solicitudes con esos filtros.</div>`;
    return list.map((s) => card(s, me)).join('');
  }
  A.live.explorar = () => {
    const el = document.getElementById('exp-list'); if (el) el.innerHTML = listHtml(A.me());
    const c = document.getElementById('exp-count'); if (c) c.textContent = visibles(A.me()).length;
  };

  A.views.explorar = function (params, me) {
    const S = A.state.solicitudes;
    const f = (A.ui.exp = A.ui.exp || { q: '', estado: 'todas', cat: 'Todos' });
    const enCurso = S.filter((s) => s.estado === 'en_curso' || s.estado === 'en_disputa').length;
    const kpi = (lbl, val, sub, icon) => `<div class="card p-4"><div class="flex justify-between items-start"><span class="lbl">${lbl}</span>${A.icon(icon, 'text-primary')}</div>
      <div class="money text-2xl md:text-3xl">${val}</div><div class="text-[11px] text-on-surface-variant mt-1">${sub}</div></div>`;
    const VIS = baseVisible(me);
    const count = (e) => VIS.filter((s) => e === 'todas' || s.estado === e).length;
    const countAll = (e) => S.filter((s) => s.estado === e).length;
    const estados = [['todas', 'Todas'], ['abierta', 'Abiertas / cotizando'], ['en_curso', 'En curso'], ['en_disputa', 'En disputa'], ['completada', 'Completadas']];
    const cats = ['Todos'].concat(Object.keys(window.CATEGORIAS));
    const pendiente = me.rol === 'prestador' && me.estado !== 'activo';

    return `<section class="bg-surface-container-low border-b border-outline-variant/60">
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${kpi('Solicitudes abiertas', countAll('abierta'), 'Recibiendo presupuestos en la plataforma', 'folder_open')}
        ${kpi('Trabajos en curso', enCurso, 'Pago por etapa con Mercado Pago', 'timeline')}
        ${kpi('Prestadores verificados', A.state.users.filter((u) => u.rol === 'prestador' && u.estado === 'activo').length, 'DNI/CUIT, email y foto validados', 'engineering')}
        ${kpi('Trabajos completados', countAll('completada'), 'Con todas las etapas aprobadas', 'task_alt')}
      </div>
      <div class="max-w-[1400px] mx-auto px-4 md:px-8 pb-5 space-y-3">
        <div class="flex flex-col md:flex-row gap-2">
          <label class="flex-1 flex items-center gap-2 bg-white border border-slate-400 px-3 focus-within:border-primary-container">
            ${A.icon('search', 'text-outline')}<input class="w-full py-3 outline-none text-sm bg-transparent" placeholder="Buscar por oficio, tarea, zona o código postal (ej. 'cañería', 'Belgrano', '1425')" data-model="exp.q" data-live="explorar" value="${esc(f.q)}"></label>
          ${me.rol === 'cliente' ? `<a href="#/publicar" class="btn-success">${A.icon('add_circle')} Publicar solicitud</a>` : ''}
        </div>
        <div class="scroll-x flex gap-2">${estados.map(([k, t]) => `<button class="chip !text-[11px] !py-1.5 !px-3 ${f.estado === k ? 'bg-primary-container text-white border-primary-container' : 'bg-white border-outline-variant text-on-surface-variant'}" data-action="exp-estado" data-v="${k}">${t} (${count(k)})</button>`).join('')}</div>
        <div class="scroll-x flex gap-2">${cats.map((c) => `<button class="chip !text-[10px] !py-1.5 !px-3 ${f.cat === c ? 'bg-slate-950 text-white border-slate-950' : 'bg-white border-outline-variant text-on-surface-variant'}" data-action="exp-cat" data-v="${c}">${c}</button>`).join('')}</div>
        <div class="flex flex-wrap gap-2 items-center text-xs"><span class="font-head font-semibold uppercase text-on-surface-variant">Ordenar:</span>${[['recientes', 'Más recientes'], ['calificacion', 'Mejor calificados']].map(([k, t]) => `<button class="chip !text-[10px] !py-1 !px-2 ${(f.orden || 'recientes') === k ? 'bg-primary-container text-white border-primary-container' : 'bg-white border-outline-variant text-on-surface-variant'}" data-action="exp-orden" data-v="${k}">${t}</button>`).join('')}</div>
      </div>
    </section>
    <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
      <div class="space-y-4 min-w-0">
        <div class="flex items-center gap-2"><h2 class="font-head font-bold uppercase tracking-wide">${me.rol === 'prestador' ? 'Oportunidades y trabajos' : me.rol === 'cliente' ? 'Mis solicitudes y trabajos realizados' : 'Explorador de trabajos'}</h2>
          <span class="bg-surface-container-high text-primary font-head font-bold text-sm px-2" id="exp-count">${visibles(me).length}</span></div>
        ${pendiente ? `<div class="border border-amber-600 bg-amber-50 p-4 text-sm flex gap-3">${A.icon('hourglass_top', 'text-amber-700')}<div><b>Tu perfil profesional está pendiente de aprobación.</b> Un administrador debe validar tus credenciales de oficio antes de que puedas postularte.</div></div>` : ''}
        ${me.rol === 'cliente' || me.rol === 'prestador' ? `<div class="border border-outline-variant bg-surface-container-low p-3 text-xs flex gap-2">${A.icon('visibility', 'text-primary !text-base')}<span>${me.rol === 'cliente'
          ? 'Ves tus solicitudes completas. De otros clientes solo ves los <b>trabajos terminados</b>: qué prestador los hizo y cómo los calificaron, para que puedas elegir bien.'
          : 'Ves completas las <b>solicitudes abiertas</b> (para cotizar) y tus trabajos. De los trabajos de otros prestadores solo ves el resultado y la calificación.'}</span></div>` : ''}
        <div id="exp-list" class="space-y-4">${listHtml(me)}</div>
      </div>
      <aside class="space-y-4">
        ${ranking(f.cat)}
        ${me.rol === 'cliente' ? `<div class="bg-primary-container text-white p-5 border border-blue-800">
          <div class="font-head font-bold text-lg flex items-center gap-2 mb-2">${A.icon('handyman')} ¿Necesitás una reparación?</div>
          <p class="text-sm opacity-90 mb-4">Publicá tu solicitud con fotos y tareas. Pagás cada etapa antes de que empiece: nunca adelantás más que una etapa, y aprobás cada etapa terminada.</p>
          <a href="#/publicar" class="btn w-full bg-white text-primary border-white hover:bg-blue-50">${A.icon('add')} Publicar nueva solicitud</a></div>` : ''}
        <div class="card p-5">
          <div class="sec-title mb-3">${A.icon('shield')} Pago por etapa con Mercado Pago</div>
          <ol class="space-y-3 text-sm">
            ${[['Pago de la etapa', 'El cliente paga cada etapa antes de que empiece y el pago se acredita en la cuenta de Mercado Pago del prestador.'], ['Ejecución y evidencias', 'El prestador termina la etapa, sube fotos y el cliente la aprueba antes de pagar la siguiente.'], ['Aprobación y cierre', `El cliente aprueba cada etapa; si no responde en ${A.plazoAprob()} días, se aprueba sola. Al aprobar la última, el trabajo se cierra.`]]
              .map((x, i) => `<li class="flex gap-3"><span class="w-6 h-6 shrink-0 bg-surface-container-high text-primary font-head font-bold text-xs flex items-center justify-center">${i + 1}</span><div><div class="font-head font-semibold text-sm uppercase">${x[0]}</div><div class="text-xs text-on-surface-variant">${x[1]}</div></div></li>`).join('')}
          </ol></div>
        <div class="card p-5">
          <div class="sec-title mb-3">${A.icon('badge')} Validación de perfiles</div>
          <ul class="text-xs space-y-2">
            <li class="flex justify-between">Nombre, apellido y DNI/CUIT reales <span class="text-tertiary font-semibold">Obligatorio</span></li>
            <li class="flex justify-between">Email verificado con código <span class="text-tertiary font-semibold">Obligatorio</span></li>
            <li class="flex justify-between">Foto de rostro real <span class="text-tertiary font-semibold">Obligatorio</span></li>
            <li class="flex justify-between">Credencial de oficio (prestadores) <span class="text-primary font-semibold">Aprobación admin</span></li>
          </ul></div>
        <div class="bg-slate-950 text-white p-5">
          <div class="font-head font-bold flex items-center gap-2 mb-1">${A.icon('gavel', 'text-amber-400')} Arbitraje de disputas</div>
          <p class="text-xs opacity-80">Si algo sale mal, cliente o prestador abren una disputa con contra-evidencias fotográficas. Un árbitro decide sobre la etapa en curso: reembolso parcial, total o a favor del prestador.</p></div>
      </aside>
    </div>`;
  };
  A.actions['exp-estado'] = (el) => { A.ui.exp.estado = el.dataset.v; A.rerender(); };
  A.actions['exp-cat'] = (el) => { A.ui.exp.cat = el.dataset.v; A.rerender(); };
  A.actions['exp-orden'] = (el) => { A.ui.exp.orden = el.dataset.v; if (el.dataset.v === 'calificacion' && A.ui.exp.estado === 'abierta') A.ui.exp.estado = 'todas'; A.rerender(); };

  /* =================== REGISTRO =================== */
  function regErrors(r) {
    const e = {};
    if (!r.nombre || r.nombre.trim().length < 2) e.nombre = 'Ingresá tu nombre real.';
    if (!r.apellido || r.apellido.trim().length < 2) e.apellido = 'Ingresá tu apellido real.';
    const dni = (r.dni || '').replace(/\D/g, '');
    if (!(dni.length >= 7 && dni.length <= 8) && dni.length !== 11) e.dni = 'DNI (7-8 dígitos) o CUIT/CUIL (11 dígitos).';
    if (!/^[\d\s+()-]{8,}$/.test(r.tel || '')) e.tel = 'Ingresá un teléfono de contacto.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email || '')) e.email = 'Email inválido.';
    else if (A.state.users.some((u) => u.email.toLowerCase() === r.email.toLowerCase())) e.email = 'Ese email ya está registrado.';
    if (!r.pass || r.pass.length < 6) e.pass = 'Mínimo 6 caracteres.';
    if (r.pass2 !== r.pass) e.pass2 = 'Las contraseñas no coinciden.';
    if (!r.terminos) e.terminos = 'Tenés que aceptar los términos y la política de privacidad.';
    if (!r.foto || !r.foto.length) e.foto = 'La foto de rostro es obligatoria.';
    if (r.rol === 'prestador') {
      const of = oficiosSel(r);
      if (!of.length) e.oficio = 'Elegí al menos un oficio.';
      if (of.some((o) => window.OFICIOS_MATRICULA[o]) && (!r.matricula || r.matricula.trim().length < 3)) e.matricula = 'Este oficio requiere matrícula: indicá el número.';
      if (!r.mpVinculada) e.mp = r.mpSinKyc ? MSG_KYC : 'Vinculá tu cuenta de Mercado Pago: es donde cobrás cada etapa.';
    }
    return e;
  }

  function oficiosSel(r) { return Object.keys(window.CATEGORIAS).filter((c) => r.of && r.of[c]); }

  A.views.registro = function () {
    const r = (A.ui.reg = A.ui.reg || { rol: 'cliente', foto: [], step: 1 });
    const err = r.showErr ? regErrors(r) : {};
    const field = (k, label, ph, type = 'text', extra = '') => `<div><label class="lbl">${label}</label>
      <input type="${type}" class="inp ${err[k] ? 'inp-err' : ''}" placeholder="${ph}" data-model="reg.${k}" value="${esc(r[k] || '')}" ${extra}>
      ${err[k] ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs px-2 py-1 mt-1">${err[k]}</div>` : ''}</div>`;

    const steps = ['Datos y foto', 'Verificar email', 'Listo'];
    const stepper = `<ol class="flex gap-2 mb-6">${steps.map((t, i) => `<li class="flex-1 border-t-4 pt-2 ${r.step > i ? 'border-primary-container' : 'border-outline-variant'}"><span class="font-head text-[10px] font-bold uppercase tracking-wider ${r.step > i ? 'text-primary' : 'text-outline'}">Paso ${i + 1}</span><div class="font-head text-sm font-semibold">${t}</div></li>`).join('')}</ol>`;

    let body;
    if (r.step === 1) {
      body = `<div class="grid grid-cols-2 gap-2 mb-5">
          ${['cliente', 'prestador'].map((rol) => `<label class="cursor-pointer border-2 p-3 ${r.rol === rol ? 'border-primary-container bg-blue-50' : 'border-outline-variant bg-white'}">
            <input type="radio" name="rol" value="${rol}" class="hidden" data-model="reg.rol" data-rerender ${r.rol === rol ? 'checked' : ''}>
            <div class="flex items-center gap-2 font-head font-semibold">${A.icon(rol === 'cliente' ? 'home' : 'engineering')} ${rol === 'cliente' ? 'Soy cliente' : 'Soy prestador'}</div>
            <div class="text-xs text-on-surface-variant mt-1">${rol === 'cliente' ? 'Publico trabajos y pago cada etapa.' : 'Me postulo y cobro cada etapa en mi cuenta de Mercado Pago.'}</div></label>`).join('')}
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          ${field('nombre', 'Nombre', 'Ej. Lucía')}
          ${field('apellido', 'Apellido', 'Ej. Ramírez')}
          ${field('dni', 'DNI / CUIT', 'Ej. 27-33444555-6', 'text', 'inputmode="numeric"')}
          ${field('tel', 'Teléfono de contacto', 'Ej. 11 5555-1234', 'tel')}
          ${field('email', 'Email (se verifica con código)', 'tu@email.com', 'email')}
          ${field('pass', 'Contraseña', 'Mínimo 6 caracteres', 'password')}
          ${field('pass2', 'Repetir contraseña', 'Repetí la contraseña', 'password')}
        </div>
        ${r.rol === 'prestador' ? (() => {
          const of = oficiosSel(r); const reg = of.filter((o) => window.OFICIOS_MATRICULA[o]);
          return `<div class="mt-5 border ${err.oficio ? 'border-2 border-red-500' : 'border-outline-variant'} p-4 space-y-3">
            <div class="font-head font-semibold text-sm uppercase">Oficios que realizás</div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">${Object.keys(window.CATEGORIAS).map((c) => `<label class="flex items-center gap-2 text-sm cursor-pointer border p-2 ${r.of && r.of[c] ? 'border-primary-container bg-blue-50' : 'border-outline-variant'}">
              <input type="checkbox" class="w-4 h-4 accent-[#2563eb]" data-model="reg.of.${c}" data-rerender ${r.of && r.of[c] ? 'checked' : ''}> ${c}${window.OFICIOS_MATRICULA[c] ? ` <span class="text-[10px] font-head font-bold text-amber-700">MATRÍCULA</span>` : ''}</label>`).join('')}</div>
            ${err.oficio ? `<div class="text-red-700 text-xs">${err.oficio}</div>` : ''}
            ${reg.length ? `<div class="bg-amber-50 border border-amber-600 p-3 space-y-3">
                <div class="text-xs flex gap-2">${A.icon('badge', 'text-amber-700 !text-base')}<span><b>${reg.join(' y ')}</b> requiere${reg.length > 1 ? 'n' : ''} profesional matriculado: ${reg.map((o) => window.OFICIOS_MATRICULA[o]).join('; ')}. El administrador valida la matrícula antes de aprobar tu perfil.</span></div>
                ${field('matricula', 'Número de matrícula (obligatorio)', 'Ej. MAT-ENARGAS #98224')}
                <div><label class="lbl">Foto de la matrícula (opcional)</label>
                  <div class="flex flex-wrap gap-2 items-center">
                    <label class="btn-ghost btn-sm cursor-pointer">${A.icon('photo_camera')} Subir foto<input type="file" accept="image/*" class="hidden" data-upload="reg.matFoto"></label>
                    <button type="button" class="btn-ghost btn-sm" data-action="sample-photos" data-target="reg.matFoto" data-set="matricula">${A.icon('image')} Usar foto de ejemplo</button>
                    ${r.matFoto && r.matFoto.length ? `<img src="${r.matFoto[r.matFoto.length - 1]}" class="w-14 h-14 object-cover border border-slate-950 cursor-zoom-in" data-action="zoom" data-src="${r.matFoto[r.matFoto.length - 1]}"><button type="button" class="text-xs underline" data-action="reg-mat-quitar">Quitar</button>` : ''}
                  </div><p class="text-[11px] text-on-surface-variant mt-1">Agiliza la validación. Se ve solo en administración.</p></div>
              </div>`
            : field('matricula', 'Credencial, certificado o experiencia (opcional)', 'Ej. Curso de pintura UOCRA / 10 años de experiencia')}
            <div class="border ${err.mp ? 'border-2 border-red-500' : 'border-[#009ee3]'} bg-sky-50 p-3 space-y-2">
              <div class="text-xs flex gap-2">${A.icon('account_balance_wallet', 'text-[#009ee3] !text-base')}<span><b>Cuenta de Mercado Pago para cobrar (obligatoria).</b> Los clientes pagan cada etapa directo a tu cuenta: OficiosYa procesa cada cobro. La cuenta tiene que estar <b>a tu nombre</b> y con la <b>identidad validada en Mercado Pago (nivel KYC 6)</b>. Si todavía no la validaste, hacelo desde la app de Mercado Pago antes de vincularla.</span></div>
              ${r.mpVinculada ? `<div class="flex flex-wrap items-center gap-2 text-sm"><span class="chip-green">${A.icon('check_circle', '!text-xs')} Cuenta vinculada</span><span class="chip-blue">Identidad validada · KYC 6</span><span class="text-xs">${esc(r.email || 'tu cuenta de Mercado Pago')}</span><button type="button" class="text-xs underline" data-action="reg-mp-quitar">Desvincular</button></div>`
                : `<div class="flex flex-wrap gap-2"><button type="button" class="btn btn-sm bg-[#009ee3] border-[#0089c7] text-white hover:bg-[#0089c7]" data-action="reg-mp">${A.icon('verified_user')} Vincular cuenta de Mercado Pago</button>
                  <button type="button" class="btn-ghost btn-sm" data-action="reg-mp-sinkyc">Demo: probar con una cuenta sin identidad validada</button></div>`}
              ${err.mp || (r.mpSinKyc && !r.mpVinculada) ? `<div class="text-red-700 text-xs">${err.mp || MSG_KYC}</div>` : ''}
              <p class="text-[11px] text-on-surface-variant">Demo: simula la autorización OAuth. En el producto real se abre Mercado Pago para que autorices a OficiosYa a cobrar en tu nombre, y OficiosYa verifica que la cuenta tenga la identidad validada y el mismo DNI/CUIT del registro.</p>
            </div>
          </div>`;
        })() : ''}
        <div class="mt-5 border ${err.foto ? 'border-2 border-red-500' : 'border-outline-variant'} bg-surface-container-low p-4">
          <div class="flex flex-col sm:flex-row gap-4 items-start">
            <div class="w-28 h-28 shrink-0 border border-slate-950 bg-white flex items-center justify-center overflow-hidden">
              ${r.foto && r.foto.length ? `<img src="${r.foto[r.foto.length - 1]}" class="w-full h-full object-cover">` : A.icon('face', '!text-5xl text-outline')}
            </div>
            <div class="flex-1">
              <div class="font-head font-semibold text-sm uppercase mb-1">Foto de rostro real (obligatoria)</div>
              <p class="text-xs text-on-surface-variant mb-3">Clientes y prestadores muestran una foto real de su cara para generar confianza. Formato JPG/PNG.</p>
              <div class="flex flex-wrap gap-2">
                <label class="btn-ghost btn-sm cursor-pointer">${A.icon('photo_camera')} Subir / tomar foto
                  <input type="file" accept="image/*" capture="user" class="hidden" data-upload="reg.foto"></label>
                <button type="button" class="btn-ghost btn-sm" data-action="reg-foto-ejemplo">${A.icon('image')} Usar foto de ejemplo</button>
              </div>
              ${err.foto ? `<div class="text-red-700 text-xs mt-2">${err.foto}</div>` : ''}
            </div>
          </div>
        </div>
        <label class="mt-5 flex gap-2 items-start text-sm cursor-pointer ${err.terminos ? 'text-red-700' : ''}">
          <input type="checkbox" class="w-4 h-4 mt-0.5 accent-[#2563eb]" data-model="reg.terminos" ${r.terminos ? 'checked' : ''}>
          <span>Acepto los términos y condiciones y la política de privacidad. Declaro que mis datos son reales y que no voy a cobrar ni pagar por fuera de la plataforma.</span></label>
        ${err.terminos ? `<div class="text-red-700 text-xs mt-1">${err.terminos}</div>` : ''}
        <div class="mt-6 flex flex-col sm:flex-row gap-2 justify-between items-center">
          <div class="flex flex-col items-center sm:items-start gap-1">
            <a href="#/login" class="text-xs underline text-primary">¿Ya tenés cuenta? Iniciá sesión</a>
            <button type="button" class="text-xs underline text-on-surface-variant" data-action="reg-autocompletar">Autocompletar datos de ejemplo</button></div>
          <button class="btn-primary w-full sm:w-auto" data-action="reg-submit">Crear cuenta y enviar código ${A.icon('arrow_forward')}</button>
        </div>`;
    } else if (r.step === 2) {
      body = `<div class="text-center max-w-md mx-auto">
          <div class="inline-flex w-14 h-14 items-center justify-center bg-blue-50 border border-primary-container text-primary mb-3">${A.icon('mark_email_unread', '!text-3xl')}</div>
          <h2 class="font-head text-xl font-bold mb-1">Verificá tu email</h2>
          <p class="text-sm text-on-surface-variant mb-5">Enviamos un código de 6 dígitos a <b>${esc(r.email)}</b>. Es el canal para activar tu cuenta, recuperar la contraseña y recibir notificaciones.</p>
          <input class="inp text-center font-head text-2xl tracking-[0.5em] ${r.codeErr ? 'inp-err' : ''}" maxlength="6" inputmode="numeric" placeholder="······" data-model="reg.codeIn" value="${esc(r.codeIn || '')}">
          ${r.codeErr ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs px-2 py-1 mt-1">Código incorrecto. Revisá el email.</div>` : ''}
          <button class="btn-primary w-full mt-4" data-action="reg-verify">${A.icon('verified')} Verificar y activar cuenta</button>
          <div class="flex justify-between mt-4 text-xs">
            <button class="underline" data-action="reg-back">Corregir datos</button>
            <button class="underline" data-action="reg-resend">Reenviar código</button>
          </div>
          <div class="mt-6 text-[11px] text-on-surface-variant border border-dashed border-outline-variant p-2">Demo: el email se simula con una notificación en pantalla (arriba a la derecha).</div>
        </div>`;
    } else {
      const u = A.user(r.newId);
      body = `<div class="text-center max-w-md mx-auto">
          ${A.avatar(u, 'w-24 h-24', 'rounded-full mx-auto mb-3')}
          <h2 class="font-head text-xl font-bold">¡Cuenta verificada, ${esc(u.nombre)}!</h2>
          <div class="flex flex-wrap justify-center gap-2 my-3"><span class="chip-green">${A.icon('mail', '!text-xs')} Email verificado</span><span class="chip-green">DNI/CUIT informado</span><span class="chip-blue">Foto de rostro</span></div>
          ${u.rol === 'prestador'
            ? `<p class="text-sm text-on-surface-variant mb-5">Tu perfil profesional quedó <b class="text-amber-700">pendiente de aprobación</b>. Un administrador va a validar ${u.matricula ? `tu credencial (${esc(u.matricula)})` : 'tu perfil'} desde el panel de administración.</p>
               <div class="flex flex-col gap-2"><a href="#/" class="btn-primary">Ver oportunidades</a><button class="btn-ghost" data-action="ver-como" data-id="u-admin">Ver como administrador para aprobarlo</button></div>`
            : `<p class="text-sm text-on-surface-variant mb-5">Ya podés publicar tu primera solicitud.</p><a href="#/publicar" class="btn-primary w-full">${A.icon('add_circle')} Publicar solicitud</a>`}
        </div>`;
    }
    return A.pageHead(`<span>Registro</span>`, `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Crear cuenta verificada</h1>
        <p class="text-sm text-on-surface-variant mt-1">Registro obligatorio con datos reales, verificación de email y foto de rostro.</p>`) +
      `<div class="max-w-3xl mx-auto px-4 md:px-8 py-6"><div class="card card-pad">${stepper}${body}</div></div>`;
  };

  A.actions['reg-mat-quitar'] = () => { A.ui.reg.matFoto = []; A.rerender(); };
  A.actions['reg-mp'] = () => { A.ui.reg.mpVinculada = true; A.ui.reg.mpSinKyc = false; A.rerender(); A.toast('Cuenta de Mercado Pago vinculada (autorización OAuth simulada).', 'ok'); };
  A.actions['reg-mp-quitar'] = () => { A.ui.reg.mpVinculada = false; A.rerender(); };
  A.actions['reg-mp-sinkyc'] = () => {
    A.ui.reg.mpVinculada = false; A.ui.reg.mpSinKyc = true;
    A.rerender(); A.toast('No se pudo vincular: la cuenta de Mercado Pago no tiene la identidad validada.', 'err');
  };
  A.actions['reg-foto-ejemplo'] = () => {
    const r = A.ui.reg; const set = window.FOTOS_EJEMPLO.rostro;
    r.foto = [set[(r.fotoIdx = ((r.fotoIdx || 0) + 1) % set.length)]]; A.rerender();
  };
  A.actions['reg-autocompletar'] = () => {
    const r = A.ui.reg;
    Object.assign(r, r.rol === 'prestador'
      ? { nombre: 'Lucía', apellido: 'Ramírez', dni: '27-33444555-6', tel: '11 5555-1234', email: 'lucia.ramirez' + Math.floor(Math.random() * 900 + 100) + '@mail.com', pass: 'demo1234', pass2: 'demo1234', terminos: true, of: { 'Gas': true, 'Plomería': true }, matricula: 'MAT-ENARGAS #77815', mpVinculada: true }
      : { nombre: 'Lucía', apellido: 'Ramírez', dni: '27-33444555-6', tel: '11 5555-1234', email: 'lucia.ramirez' + Math.floor(Math.random() * 900 + 100) + '@mail.com', pass: 'demo1234', pass2: 'demo1234', terminos: true });
    if (!r.foto.length) r.foto = [window.FOTOS_EJEMPLO.rostro[0]];
    A.rerender();
  };
  function sendCode(r) {
    r.code = String(Math.floor(100000 + Math.random() * 900000));
    A.toast(`<div class="font-head text-[10px] font-bold tracking-wider text-primary mb-1">✉ EMAIL SIMULADO · no-reply@oficiosya.com</div>
      Para: ${esc(r.email)}<br>Tu código de verificación es <b class="font-head text-lg tracking-widest">${r.code}</b>`, 'mail');
  }
  A.actions['reg-submit'] = () => {
    const r = A.ui.reg; r.showErr = true;
    if (Object.keys(regErrors(r)).length) { A.rerender(); A.toast('Revisá los campos marcados.', 'err'); return; }
    r.step = 2; r.codeErr = false; r.codeIn = ''; sendCode(r); A.rerender();
  };
  A.actions['reg-resend'] = () => { sendCode(A.ui.reg); };
  A.actions['reg-back'] = () => { A.ui.reg.step = 1; A.rerender(); };
  A.actions['reg-verify'] = () => {
    const r = A.ui.reg;
    if ((r.codeIn || '').trim() !== r.code) { r.codeErr = true; A.rerender(); return; }
    const id = 'u-' + Date.now();
    A.state.users.push({
      id, rol: r.rol, nombre: r.nombre.trim(), apellido: r.apellido.trim(), dni: r.dni, tel: r.tel, email: r.email.trim(), pass: r.pass,
      emailVerificado: true, aclaraciones: [], foto: r.foto[r.foto.length - 1], estado: r.rol === 'prestador' ? 'pendiente' : 'activo',
      oficio: oficiosSel(r).join(' / '), oficios: oficiosSel(r), matricula: (r.matricula || '').trim(), matriculaFoto: r.matFoto && r.matFoto.length ? r.matFoto[r.matFoto.length - 1] : '',
      matriculaRequerida: oficiosSel(r).some((o) => window.OFICIOS_MATRICULA[o]), rating: null, trabajos: 0, zona: '', reportes: [],
      mpCuenta: r.rol === 'prestador' ? { usuario: r.email.trim(), vinculada: A.now(), kyc: 6 } : null, deuda: 0,
    });
    A.state.currentUserId = id;
    A.ui = { reg: { step: 3, newId: id } };
    A.commit('Cuenta creada y email verificado.', 'ok');
  };
  A.actions['ver-como'] = (el) => {
    A.state.currentUserId = el.dataset.id; A.ui = {}; A.save();
    const me = A.me();
    A.toast(`Ahora ves la plataforma como <b>${esc(A.fullName(me))}</b>.`);
    A.go(el.dataset.go || ({ admin: '#/admin', arbitro: '#/arbitraje' }[me.rol] || '#/'));
  };

  /* =================== LOGIN Y RECUPERACIÓN DE CONTRASEÑA =================== */
  const DEMO_CUENTAS = [['u-martin', 'Cliente'], ['u-roberto', 'Prestador'], ['u-admin', 'Administrador'], ['u-laura', 'Árbitro']];

  A.views.login = function (params, me) {
    const l = (A.ui.login = A.ui.login || { modo: 'ingresar', email: '', pass: '' });
    const errBox = (m) => (m ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs px-2 py-1 mt-1">${m}</div>` : '');
    let body;
    if (l.modo === 'ingresar') {
      body = `<h1 class="font-head text-2xl font-bold">Iniciar sesión</h1>
        <p class="text-sm text-on-surface-variant mt-1 mb-5">Ingresá con el email verificado de tu cuenta.</p>
        ${me ? `<div class="border border-primary-container bg-blue-50 text-sm p-3 mb-4">Ya tenés una sesión abierta como <b>${esc(A.fullName(me))}</b>. Si ingresás con otra cuenta, se reemplaza.</div>` : ''}
        <div class="space-y-4">
          <div><label class="lbl">Email</label><input type="email" class="inp ${l.err ? 'inp-err' : ''}" data-model="login.email" value="${esc(l.email)}" placeholder="tu@email.com" autocomplete="username"></div>
          <div><label class="lbl">Contraseña</label><input type="password" class="inp ${l.err ? 'inp-err' : ''}" data-model="login.pass" value="${esc(l.pass)}" placeholder="••••••" autocomplete="current-password" data-enter="login-submit"></div>
          ${errBox(l.err)}
          <button class="btn-primary w-full" data-action="login-submit">${A.icon('login')} Ingresar</button>
          <div class="flex justify-between text-xs">
            <button class="underline text-on-surface-variant" data-action="login-modo" data-v="recuperar">Olvidé mi contraseña</button>
            <a href="#/registro" class="underline text-primary">Crear cuenta nueva</a>
          </div>
        </div>
        <div class="mt-6 border border-dashed border-outline-variant p-3">
          <div class="font-head text-[10px] font-bold tracking-wider text-on-surface-variant mb-2">DEMO · CUENTAS DE EJEMPLO (contraseña: demo1234)</div>
          <div class="grid grid-cols-2 gap-2">${DEMO_CUENTAS.map(([id, rol]) => { const u = A.user(id); return u ? `<button class="btn-ghost btn-sm !justify-start text-left" data-action="login-fill" data-id="${id}">${A.avatar(u, 'w-6 h-6', 'rounded-full')}<span class="leading-tight"><span class="block">${esc(u.nombre)}</span><span class="block text-[10px] font-normal text-on-surface-variant">${rol}</span></span></button>` : ''; }).join('')}</div>
        </div>`;
    } else if (l.modo === 'recuperar') {
      body = `<h1 class="font-head text-2xl font-bold">Recuperar contraseña</h1>
        <p class="text-sm text-on-surface-variant mt-1 mb-5">Te enviamos un código al email de tu cuenta para crear una contraseña nueva.</p>
        <div class="space-y-4">
          <div><label class="lbl">Email de la cuenta</label><input type="email" class="inp ${l.err ? 'inp-err' : ''}" data-model="login.email" value="${esc(l.email)}" placeholder="tu@email.com"></div>
          ${errBox(l.err)}
          <button class="btn-primary w-full" data-action="rec-enviar">${A.icon('mail')} Enviar código</button>
          <button class="text-xs underline text-on-surface-variant" data-action="login-modo" data-v="ingresar">Volver a iniciar sesión</button>
        </div>`;
    } else {
      body = `<h1 class="font-head text-2xl font-bold">Crear contraseña nueva</h1>
        <p class="text-sm text-on-surface-variant mt-1 mb-5">Ingresá el código de 6 dígitos que enviamos a <b>${esc(l.email)}</b>.</p>
        <div class="space-y-4">
          <div><label class="lbl">Código</label><input class="inp text-center font-head text-xl tracking-[0.4em]" maxlength="6" inputmode="numeric" data-model="login.codeIn" value="${esc(l.codeIn || '')}" placeholder="······"></div>
          <div><label class="lbl">Contraseña nueva</label><input type="password" class="inp" data-model="login.nueva" value="${esc(l.nueva || '')}" placeholder="Mínimo 6 caracteres"></div>
          ${errBox(l.err)}
          <button class="btn-primary w-full" data-action="rec-confirmar">${A.icon('lock_reset')} Guardar contraseña e ingresar</button>
          <div class="flex justify-between text-xs"><button class="underline" data-action="login-modo" data-v="recuperar">Cambiar email</button><button class="underline" data-action="rec-enviar">Reenviar código</button></div>
        </div>`;
    }
    return `<div class="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-14 grid md:grid-cols-2 gap-6 md:gap-10 items-start">
      <div class="card card-pad shadow-hard border-slate-950">${body}</div>
      <div class="space-y-4">
        <div class="bg-primary-container text-white p-6 border border-blue-800">
          <div class="font-head font-bold text-xl mb-2 flex items-center gap-2">${A.icon('handyman')} OficiosYa</div>
          <p class="text-sm opacity-90">Contratá plomeros, electricistas, gasistas, pintores y más pagando por etapas: nunca adelantás más que una etapa y aprobás cada etapa terminada.</p>
        </div>
        <ul class="card p-5 space-y-3 text-sm">
          <li class="flex gap-2">${A.icon('verified_user', 'text-tertiary')} Perfiles con DNI/CUIT, email verificado y foto real.</li>
          <li class="flex gap-2">${A.icon('request_quote', 'text-primary')} Presupuestos por etapas, con materiales y herramientas detalladas.</li>
          <li class="flex gap-2">${A.icon('lock', 'text-primary')} Pago por etapa con Mercado Pago y aprobación de cada etapa.</li>
          <li class="flex gap-2">${A.icon('star', 'text-amber-500')} Calificaciones y comentarios después del pago, incluso meses después.</li>
        </ul>
        <p class="text-[11px] text-on-surface-variant">En el producto real: contraseñas con Argon2/bcrypt y sesión con JWT en cookies HttpOnly.</p>
      </div></div>`;
  };

  function loginOk(u) {
    A.state.currentUserId = u.id; A.ui = {}; A.save();
    A.toast(`Bienvenido/a, <b>${esc(u.nombre)}</b>.`, 'ok');
    A.go({ admin: '#/admin', arbitro: '#/arbitraje' }[u.rol] || '#/');
  }
  A.actions['login-submit'] = () => {
    const l = A.ui.login;
    const u = A.state.users.find((x) => x.email.toLowerCase() === (l.email || '').trim().toLowerCase());
    if (!u || u.pass !== l.pass) { l.err = 'Email o contraseña incorrectos.'; A.rerender(); return; }
    if (u.estado === 'suspendido' || u.estado === 'rechazado') { l.err = 'Tu cuenta está ' + u.estado + '. Comunicate con soporte.'; A.rerender(); return; }
    loginOk(u);
  };
  A.actions['login-fill'] = (el) => { const u = A.user(el.dataset.id); Object.assign(A.ui.login, { email: u.email, pass: u.pass, err: '' }); A.rerender(); };
  A.actions['login-modo'] = (el) => { Object.assign(A.ui.login, { modo: el.dataset.v, err: '' }); A.rerender(); };
  A.actions['rec-enviar'] = () => {
    const l = A.ui.login;
    const u = A.state.users.find((x) => x.email.toLowerCase() === (l.email || '').trim().toLowerCase());
    if (!u) { l.err = 'No hay ninguna cuenta con ese email.'; A.rerender(); return; }
    l.code = String(Math.floor(100000 + Math.random() * 900000)); l.modo = 'codigo'; l.err = ''; l.codeIn = '';
    A.toast(`<div class="font-head text-[10px] font-bold tracking-wider text-primary mb-1">✉ EMAIL SIMULADO · no-reply@oficiosya.com</div>
      Para: ${esc(u.email)}<br>Código para recuperar tu contraseña: <b class="font-head text-lg tracking-widest">${l.code}</b>`, 'mail');
    A.rerender();
  };
  A.actions['rec-confirmar'] = () => {
    const l = A.ui.login;
    if ((l.codeIn || '').trim() !== l.code) { l.err = 'Código incorrecto.'; A.rerender(); return; }
    if (!l.nueva || l.nueva.length < 6) { l.err = 'La contraseña debe tener al menos 6 caracteres.'; A.rerender(); return; }
    const u = A.state.users.find((x) => x.email.toLowerCase() === l.email.trim().toLowerCase());
    u.pass = l.nueva;
    loginOk(u);
  };
  A.actions.logout = () => {
    A.state.currentUserId = null; A.ui = {}; A.save();
    A.toast('Cerraste sesión.');
    A.go('#/login');
  };
  /* Enter en un input con data-enter ejecuta la acción indicada */
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.dataset && ev.target.dataset.enter) { const fn = A.actions[ev.target.dataset.enter]; if (fn) { ev.preventDefault(); fn(ev.target); } }
  });

  /* =================== PERFIL =================== */
  A.views.perfil = function (params, me) {
    const estadoChip = { activo: '<span class="chip-green">Activo</span>', pendiente: '<span class="chip-amber">Pendiente de aprobación</span>', suspendido: '<span class="chip-red">Suspendido</span>' }[me.estado];
    const row = (k, v) => `<div class="flex justify-between gap-4 py-2 border-b border-outline-variant/50 text-sm"><span class="text-on-surface-variant">${k}</span><span class="font-semibold text-right">${v}</span></div>`;
    let extra = '';
    if (me.rol === 'prestador') {
      const acl = me.aclaraciones || [];
      const revs = A.reviews(me.id);
      extra = `<div class="card card-pad">
          <div class="sec-title mb-1">${A.icon('campaign')} Aclaraciones destacadas</div>
          <p class="text-xs text-on-surface-variant mb-3">Se muestran resaltadas en cada presupuesto que envíes, para que el cliente sepa qué trabajos no hacés. Ej.: “No pico paredes”, “No hago electricidad ni gas”.</p>
          <div class="space-y-2 mb-3">${acl.length ? acl.map((a, i) => `<div class="flex items-center gap-2 bg-amber-50 border-l-4 border-amber-500 px-3 py-2 text-sm font-semibold">${A.icon('do_not_disturb_on', 'text-amber-700 !text-base')}<span class="flex-1">${esc(a)}</span><button class="text-on-surface-variant hover:text-red-600" data-action="acl-del" data-i="${i}" title="Quitar">${A.icon('close', '!text-base')}</button></div>`).join('') : '<div class="text-sm text-on-surface-variant">Todavía no cargaste aclaraciones.</div>'}</div>
          <div class="flex gap-2"><input class="inp" data-model="aclNueva" value="${esc(A.ui.aclNueva || '')}" placeholder="Ej. No pico paredes" data-enter="acl-add"><button class="btn-ghost" data-action="acl-add">${A.icon('add')} Agregar</button></div>
        </div>
        <div class="card card-pad">
          <div class="sec-title mb-3">${A.icon('reviews')} Calificaciones recibidas (${revs.length})</div>${(() => { const d = A.statsDisputas(me.id); return d.garantiaSinResolver || d.enContraPrestador ? `<div class="text-xs bg-amber-50 border border-amber-600 p-2 mb-3">${A.icon('shield', '!text-sm')} ${d.garantiaSinResolver ? `${d.garantiaSinResolver} reclamo(s) por garantía sin resolver` : ''}${d.garantiaSinResolver && d.enContraPrestador ? ' · ' : ''}${d.enContraPrestador ? `${d.enContraPrestador} disputa(s) resuelta(s) en contra` : ''}. Se tiene en cuenta en tu reputación.</div>` : ''; })()}
          ${revs.length ? revs.map((s) => `<a href="#/trabajo/${s.id}" class="block border-b border-outline-variant/50 py-3 hover:bg-surface-container-low">
              <div class="flex justify-between gap-2">${A.stars(s.resena.estrellas)}<span class="text-[11px] text-on-surface-variant">${s.resena.fecha.slice(0, 10)}</span></div>
              <div class="text-sm mt-1">“${esc(s.resena.comentario)}”</div>
              <div class="text-[11px] text-on-surface-variant mt-1">${esc(s.titulo)} · ${(s.resena.seguimientos || []).length} comentario(s) posteriores</div></a>`).join('') : '<div class="text-sm text-on-surface-variant">Todavía no recibiste calificaciones.</div>'}
        </div>`;
    }
    return A.pageHead('<span>Mi perfil</span>', `<div class="flex items-center gap-4">${A.avatar(me, 'w-16 h-16 md:w-20 md:h-20', 'rounded-full')}
        <div><h1 class="text-2xl md:text-3xl font-bold tracking-tight">${esc(A.fullName(me))}</h1>
        <div class="flex flex-wrap gap-2 mt-1"><span class="chip-dark">${A.ROL_LABEL[me.rol]}</span>${estadoChip}</div></div></div>`,
        `<button class="btn-danger" data-action="logout">${A.icon('logout')} Cerrar sesión</button>`) +
      `<div class="max-w-3xl mx-auto px-4 md:px-8 py-6 grid gap-4">
        <div class="card card-pad">
          <div class="sec-title mb-3">${A.icon('badge')} Identidad y contacto</div>
          ${row('DNI / CUIT', esc(me.dni))}${row('Teléfono', esc(me.tel || '—'))}${row('Email', esc(me.email) + (me.emailVerificado ? ' <span class="chip-green ml-1">Verificado</span>' : ''))}
          ${row('Foto de rostro', me.foto ? '<span class="chip-blue">Cargada</span>' : '<span class="chip-gray">No requerida (staff)</span>')}
          ${me.rol === 'prestador' ? row('Oficio', esc(me.oficio)) + row('Credencial', esc(me.matricula))
            + row('Cuenta de cobro', me.mpCuenta ? `Mercado Pago · ${esc(me.mpCuenta.usuario)} <span class="chip-green ml-1">Vinculada</span> <span class="chip-blue">KYC 6</span>` : '<span class="chip-red">Sin vincular</span>')
            + (me.deuda ? row('Deuda con OficiosYa', `<span class="text-red-600 font-semibold">${A.money(me.deuda)}</span> · se descuenta hasta el 50% de cada cobro`) : '') + row('Calificación', me.rating ? '★ ' + me.rating + ' · ' + me.trabajos + ' trabajos' : 'Sin trabajos aún') : ''}
          ${me.rol === 'admin' ? row('Permisos', (me.permisos || []).join(', ') || '—') : ''}
        </div>
        ${extra}
        <div class="text-xs text-on-surface-variant border border-dashed border-outline-variant p-3">En el producto real: contraseñas cifradas con Argon2/bcrypt, sesión con JWT en cookies HttpOnly y recuperación de credenciales por email.</div>
      </div>`;
  };
  A.actions['acl-add'] = () => {
    const me = A.me(); const t = (A.ui.aclNueva || '').trim();
    if (t.length < 4) { A.toast('Escribí la aclaración (mín. 4 caracteres).', 'err'); return; }
    me.aclaraciones = (me.aclaraciones || []).concat(t); A.ui.aclNueva = '';
    A.commit('Aclaración agregada. Se mostrará en tus presupuestos.', 'ok');
  };
  A.actions['acl-del'] = (el) => { const me = A.me(); me.aclaraciones.splice(+el.dataset.i, 1); A.commit('Aclaración quitada.'); };
})();

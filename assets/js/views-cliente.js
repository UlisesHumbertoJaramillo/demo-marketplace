/* Vistas del cliente: Publicar solicitud (con instructivo), Mis solicitudes, Panel de la solicitud con postulaciones,
   visitas técnicas y pago por etapa (split de Mercado Pago). */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;
  const MIN = () => window.MIN_DESC_SOLICITUD;

  /* =================== PUBLICAR =================== */
  function pubErrors(p) {
    const e = {};
    if (!p.titulo || p.titulo.trim().length < 8) e.titulo = 'Un título descriptivo (mín. 8 caracteres).';
    if (!p.categoria) e.categoria = 'Elegí la categoría del oficio.';
    if (!p.zona || !p.zona.trim()) e.zona = 'Indicá barrio / zona.';
    if (!/^\w{4,8}$/.test((p.cp || '').trim())) e.cp = 'Código postal (ej. 1425).';
    const n = (p.descripcion || '').trim().length;
    if (n < MIN()) e.descripcion = `El detalle debe tener al menos ${MIN()} caracteres (llevás ${n}). Sumá medidas, materiales, accesos y qué partes hay que hacer.`;
    if (p.fotos.length && !p.fotosOk) e.fotosOk = 'Confirmá que las fotos muestran solo la parte a reparar.';
    return e;
  }
  const errBox = (m) => (m ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs px-2 py-1 mt-1">${m}</div>` : '');

  function instructivo(open) {
    const pasos = [
      ['title', 'Título concreto', 'Qué hay que hacer y dónde. Ej.: “Pérdida en sifón del lavatorio del baño”, no “Arreglar baño”.'],
      ['description', 'Describí la situación', 'Qué pasa, desde cuándo, qué se probó, qué partes hay que hacer y qué resultado esperás.'],
      ['straighten', 'Poné medidas y datos técnicos', 'Metros, m², alturas, diámetro de caños, potencia de equipos, marcas y modelos. Con medidas los presupuestos son más exactos.'],
      ['home_repair_service', 'Accesos y materiales', 'Piso, altura, si hay que mover muebles, horarios posibles y si ya compraste algún material.'],
      ['center_focus_strong', 'Fotos de detalle', 'De cerca y solo de la parte a arreglar. Nada de vistas generales del ambiente, personas ni datos personales.'],
    ];
    return `<div class="card border-primary-container">
      <button class="w-full card-pad flex justify-between items-center text-left" data-action="pub-guia">
        <span class="sec-title text-primary">${A.icon('school')} Instructivo: cómo cargar una buena solicitud</span>${A.icon(open ? 'expand_less' : 'expand_more')}</button>
      ${open ? `<div class="px-4 md:px-6 pb-5 space-y-4">
        <ol class="grid sm:grid-cols-2 gap-3">${pasos.map(([ic, t, d], i) => `<li class="flex gap-3 bg-surface-container-low border border-outline-variant/60 p-3">
          <span class="w-7 h-7 shrink-0 bg-primary-container text-white font-head font-bold text-xs flex items-center justify-center">${i + 1}</span>
          <div><div class="font-head font-semibold text-sm flex items-center gap-1">${A.icon(ic, '!text-base text-primary')} ${t}</div><div class="text-xs text-on-surface-variant">${d}</div></div></li>`).join('')}</ol>
        <div class="grid sm:grid-cols-2 gap-3 text-xs">
          <div class="border-l-4 border-red-500 bg-red-50 p-3"><div class="font-head font-bold text-red-700 uppercase mb-1">${A.icon('close', '!text-sm')} Poco específico</div>“Se rompió el caño de la cocina, necesito que lo arreglen.”</div>
          <div class="border-l-4 border-emerald-600 bg-emerald-50 p-3"><div class="font-head font-bold text-emerald-800 uppercase mb-1">${A.icon('check', '!text-sm')} Específico</div>“Gotea la unión de agua caliente bajo la mesada (caño PVC 1/2", a 40 cm del piso). Tramo dañado de unos 60 cm. Tengo la grifería nueva comprada (FV Arizona).”</div>
        </div>
        <p class="text-[11px] text-on-surface-variant">${A.icon('info', '!text-sm')} El detalle debe tener como mínimo <b>${MIN()} caracteres</b>. Las etapas y pasos del trabajo los propone cada prestador en su presupuesto.</p>
      </div>` : ''}</div>`;
  }

  A.views.publicar = function (params, me) {
    const p = (A.ui.pub = A.ui.pub || { titulo: '', categoria: '', direccion: '', zona: '', cp: '', descripcion: '', medidas: '', tareas: [''], fotos: [], fotosOk: false });
    const guia = A.ui.pubGuia !== false;
    const e = p.showErr ? pubErrors(p) : {};
    const limpieza = p.categoria === window.CAT_HERRAMIENTAS_CLIENTE;
    return A.pageHead(`<a href="#/mis-solicitudes" class="hover:text-primary">Mis solicitudes</a> / <span>Nueva publicación</span>`,
      `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Publicar solicitud de servicio</h1>
       <p class="text-sm text-on-surface-variant mt-1">Contá el problema con el mayor detalle posible. Los prestadores proponen las etapas y cotizan cada una.</p>`,
      `<button class="text-xs underline text-on-surface-variant" data-action="pub-ejemplo">Autocompletar con un ejemplo</button>`) +
    `<div class="max-w-[1100px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_320px] gap-6">
      <div class="space-y-5 min-w-0">
        ${instructivo(guia)}
        <div class="card card-pad space-y-4">
          <div class="sec-title">${A.icon('description')} 1. Detalle de la solicitud</div>
          <div><label class="lbl">Título</label><input class="inp ${e.titulo ? 'inp-err' : ''}" data-model="pub.titulo" value="${esc(p.titulo)}" placeholder="Ej. Pérdida en la unión de agua caliente bajo mesada de cocina">${errBox(e.titulo)}</div>
          <div><label class="lbl">Categoría del oficio</label>
            <select class="inp ${e.categoria ? 'inp-err' : ''}" data-model="pub.categoria" data-rerender><option value="">Seleccionar…</option>${Object.keys(window.CATEGORIAS).map((c) => `<option ${p.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}</select>${errBox(e.categoria)}</div>
          ${p.categoria ? `<div class="text-xs flex gap-2 items-start ${limpieza ? 'bg-amber-50 border border-amber-600' : 'bg-surface-container-low border border-outline-variant/60'} p-2">${A.icon('construction', '!text-base ' + (limpieza ? 'text-amber-700' : 'text-primary'))}
            <span>${limpieza ? '<b>Limpieza de interiores:</b> el prestador puede pedirte que proveas algunos elementos o herramientas (aspiradora, escalera, productos). Lo vas a ver en cada presupuesto.' : 'Las herramientas las aporta el prestador.'}</span></div>` : ''}
          <div class="grid sm:grid-cols-[1fr_1fr_130px] gap-3">
            <div><label class="lbl">Dirección (opcional)</label><input class="inp" data-model="pub.direccion" value="${esc(p.direccion)}" placeholder="Calle y altura"></div>
            <div><label class="lbl">Barrio / zona</label><input class="inp ${e.zona ? 'inp-err' : ''}" data-model="pub.zona" value="${esc(p.zona)}" placeholder="Ej. Palermo, CABA">${errBox(e.zona)}</div>
            <div><label class="lbl">Código postal</label><input class="inp ${e.cp ? 'inp-err' : ''}" data-model="pub.cp" value="${esc(p.cp)}" placeholder="1425">${errBox(e.cp)}</div>
          </div>
          <p class="text-[11px] text-on-surface-variant flex items-center gap-1">${A.icon('info', '!text-sm')} Ubicación por selección manual — no se usa GPS en tiempo real.</p>
        </div>

        <div class="card card-pad space-y-4">
          <div class="sec-title">${A.icon('assignment')} 2. Situación, medidas y partes a hacer</div>
          <div><div class="flex justify-between gap-2 items-end"><label class="lbl">Detalle de la situación (mínimo ${MIN()} caracteres)</label><span class="text-[11px] text-on-surface-variant mb-1" id="pub-desc-count">${A.charCount(p.descripcion, MIN())}</span></div>
            <textarea rows="8" class="inp ${e.descripcion ? 'inp-err' : ''}" data-model="pub.descripcion" data-live="pubdesc" placeholder="¿Qué pasa y desde cuándo? ¿Dónde está exactamente? ¿Qué se probó? ¿Qué partes hay que hacer? ¿Qué materiales hay? ¿Cómo es el acceso?">${esc(p.descripcion)}</textarea>${errBox(e.descripcion)}</div>
          <div><label class="lbl">Medidas y datos técnicos</label><input class="inp" data-model="pub.medidas" value="${esc(p.medidas)}" placeholder="Ej. pared de 3 × 2,6 m; caño de 1/2&quot;; tablero a 1,60 m de altura; aire de 3000 frigorías"></div>
          <div><label class="lbl">Partes o tareas que identificás (opcional)</label>
            <div class="space-y-2">${p.tareas.map((t, i) => `<div class="flex gap-2 items-center">${A.icon('check_box_outline_blank', 'text-outline')}
              <input class="inp" data-model="pub.tareas.${i}" value="${esc(t)}" placeholder="Ej. Cambiar el tramo de caño dañado">
              <button class="btn-ghost btn-sm !px-2" data-action="pub-del-tarea" data-i="${i}" title="Quitar">${A.icon('delete')}</button></div>`).join('')}</div>
            <button class="btn-ghost btn-sm mt-2" data-action="pub-add-tarea">${A.icon('add')} Agregar parte / tarea</button></div>
          <div class="bg-blue-50 border border-primary-container p-3 text-xs flex gap-2">${A.icon('flag', 'text-primary !text-base')}
            <span><b>Etapas del trabajo:</b> no hace falta que las definas. Cada prestador propone sus etapas (ej. diagnóstico, desarme, reparación, prueba) con el monto de cada una en su presupuesto.</span></div>
        </div>

        <div class="card card-pad space-y-3">
          <div class="sec-title">${A.icon('photo_camera')} 3. Fotos de la parte a reparar</div>
          <div class="grid sm:grid-cols-2 gap-2 text-xs">
            <div class="border-l-4 border-emerald-600 bg-emerald-50 p-2"><b class="text-emerald-800">Sí:</b> fotos de cerca de la pérdida, la mancha, la pieza rota o el tablero. Si sirve, poné una cinta métrica o un objeto como referencia.</div>
            <div class="border-l-4 border-red-500 bg-red-50 p-2"><b class="text-red-700">No:</b> vistas generales de la casa o del ambiente, fachadas, personas, documentos ni objetos de valor.</div>
          </div>
          <p class="text-xs text-on-surface-variant">Las fotos son públicas para los prestadores que cotizan. Mostrá solo lo necesario para presupuestar.</p>
          ${A.uploader('pub.fotos', 'solicitud')}
          ${A.gallery(p.fotos, { removable: 'remove-photo" data-target="pub.fotos', empty: 'Todavía no cargaste fotos (recomendado).' })}
          ${p.fotos.length ? `<label class="flex gap-2 items-start text-sm cursor-pointer ${e.fotosOk ? 'text-red-700' : ''}"><input type="checkbox" class="w-4 h-4 mt-0.5 accent-[#2563eb]" data-model="pub.fotosOk" ${p.fotosOk ? 'checked' : ''}>
            Confirmo que las fotos muestran solo la parte a reparar, sin vistas generales ni datos personales.</label>${errBox(e.fotosOk)}` : ''}
        </div>
      </div>

      <aside class="space-y-4 lg:sticky lg:top-36 self-start">
        <div class="card card-pad">
          <div class="sec-title mb-3">${A.icon('checklist')} Resumen</div>
          <ul class="text-sm space-y-2">
            <li class="flex justify-between"><span>Categoría</span><b>${esc(p.categoria || '—')}</b></li>
            <li class="flex justify-between"><span>Detalle</span><b class="${(p.descripcion || '').trim().length >= MIN() ? 'text-tertiary' : 'text-red-600'}">${(p.descripcion || '').trim().length} / ${MIN()}</b></li>
            <li class="flex justify-between"><span>Medidas</span><b>${p.medidas && p.medidas.trim() ? 'Sí' : '—'}</b></li>
            <li class="flex justify-between"><span>Partes / tareas</span><b>${p.tareas.filter((t) => t.trim()).length}</b></li>
            <li class="flex justify-between"><span>Fotos</span><b>${p.fotos.length}</b></li>
          </ul>
          <button class="btn-primary w-full mt-4" data-action="pub-submit">${A.icon('publish')} Publicar solicitud</button>
          <p class="text-[11px] text-on-surface-variant mt-2">Publicar es gratis. Pagás recién al aceptar una visita o un presupuesto, y después cada etapa antes de que empiece.</p>
        </div>
      </aside>
    </div>`;
  };

  A.live.pubdesc = () => { const el = document.getElementById('pub-desc-count'); if (el) el.innerHTML = A.charCount(A.ui.pub.descripcion, MIN()); };
  A.actions['pub-guia'] = () => { A.ui.pubGuia = A.ui.pubGuia === false; A.rerender(); };
  A.actions['pub-add-tarea'] = () => { A.ui.pub.tareas.push(''); A.rerender(); };
  A.actions['pub-del-tarea'] = (el) => { A.ui.pub.tareas.splice(+el.dataset.i, 1); if (!A.ui.pub.tareas.length) A.ui.pub.tareas.push(''); A.rerender(); };
  A.actions['pub-ejemplo'] = () => {
    A.ui.pub = {
      titulo: 'Pérdida de agua en caño del baño y humedad en pared', categoria: 'Plomería', direccion: 'Thames 1500', zona: 'Palermo, CABA', cp: '1414',
      descripcion: 'En el baño principal apareció hace tres semanas una mancha de humedad en la pared del lado de la ducha, a unos 40 cm del piso, y cada día está más grande (hoy mide unos 50 × 30 cm). Cuando se usa el agua caliente de la ducha se escucha un goteo detrás de los azulejos. La llave de paso general cierra bien y con todo cerrado el medidor no se mueve, así que creemos que la pérdida está en la cañería de agua caliente que va a la ducha. La casa tiene unos 30 años y la cañería es de termofusión en algunos tramos y de hierro en otros. Partes a hacer: encontrar el punto exacto de la pérdida, abrir la pared lo mínimo posible, reparar el caño y volver a cerrar. Tengo azulejos de repuesto iguales a los actuales (unos 10). El baño está en planta baja y se puede trabajar de lunes a viernes de 9 a 17 h.',
      medidas: 'Mancha de 50 × 30 cm a 40 cm del piso. Pared de 2,4 × 2,6 m. Caños de 1/2".',
      tareas: ['Detectar el punto exacto de la pérdida', 'Abrir la pared y reparar el caño', 'Cerrar y reponer azulejos'],
      fotos: window.FOTOS_EJEMPLO.solicitud.slice(0, 2), fotosOk: true,
    };
    A.rerender();
  };
  A.actions['pub-submit'] = () => {
    const p = A.ui.pub; p.showErr = true;
    if (Object.keys(pubErrors(p)).length) { A.rerender(); A.toast('Faltan datos de la solicitud.', 'err'); return; }
    const me = A.me();
    const s = {
      id: A.nextId('SOL'), titulo: p.titulo.trim(), categoria: p.categoria, direccion: p.direccion.trim(), zona: p.zona.trim(), cp: p.cp.trim(),
      clienteId: me.id, creada: A.now(), estado: 'abierta', descripcion: p.descripcion.trim(), medidas: (p.medidas || '').trim(),
      tareas: p.tareas.map((t) => t.trim()).filter(Boolean), hitos: [], fotos: p.fotos.slice(), postulaciones: [], compras: [],
    };
    A.state.solicitudes.unshift(s);
    A.ui.pub = null; A.save();
    A.toast(`Solicitud <b>#${s.id}</b> publicada. Los prestadores ya pueden cotizar.`, 'ok');
    A.go('#/solicitud/' + s.id);
  };

  /* =================== MIS SOLICITUDES =================== */
  A.views.misSolicitudes = function (params, me) {
    const mine = A.state.solicitudes.filter((s) => s.clienteId === me.id);
    return A.pageHead('<span>Mis solicitudes</span>', `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Mis solicitudes</h1>`,
      `<a href="#/publicar" class="btn-primary">${A.icon('add_circle')} Nueva publicación</a>`) +
      `<div class="max-w-[1100px] mx-auto px-4 md:px-8 py-6 space-y-3">
        ${!mine.length ? `<div class="card p-10 text-center text-on-surface-variant">Todavía no publicaste solicitudes.</div>` : ''}
        ${mine.map((s) => {
          const href = s.estado === 'abierta' ? '#/solicitud/' + s.id : '#/trabajo/' + s.id;
          const det = s.estado === 'abierta' ? `${A.presupuestos(s).length} presupuesto(s) · ${A.visitasActivas(s).length} visita(s)` : s.escrow ? `${A.money(s.escrow.total)} · ${{ activo: 'pago por etapa', liquidado: 'liquidado', resuelto: 'resuelto por arbitraje', cancelado: 'rescindido' }[s.escrow.estado] || s.escrow.estado}` : '';
          const calif = (s.estado === 'completada' || s.estado === 'resuelta') ? (s.resena ? ' · ' + A.stars(s.resena.estrellas, 'text-xs') : ' · <span class="text-primary font-semibold">Pendiente de calificar</span>') : '';
          return `<a href="${href}" class="card p-4 flex gap-4 items-center hover:border-primary-container">
            ${s.fotos[0] ? `<img src="${s.fotos[0]}" class="w-16 h-16 object-cover border border-slate-950/70 shrink-0">` : `<div class="w-16 h-16 bg-surface-container shrink-0"></div>`}
            <div class="min-w-0 flex-1"><div class="flex flex-wrap gap-2 mb-1">${A.estadoChip(s)}<span class="font-head text-[10px] text-on-surface-variant">#${s.id}</span></div>
              <div class="font-head font-semibold truncate">${esc(s.titulo)}</div>
              <div class="text-xs text-on-surface-variant">${esc(s.categoria)} · ${esc(s.zona)} · ${det}${calif}</div></div>
            ${A.icon('chevron_right', 'text-outline')}</a>`;
        }).join('')}
      </div>`;
  };

  /* =================== DETALLE DE SOLICITUD (por rol) =================== */
  A.views.solicitud = function (params, me) {
    const s = A.sol(params[0]);
    if (!s) return A.noAccess('La solicitud no existe.');
    if (me.rol === 'prestador') {
      // El prestador ve el pliego de las solicitudes abiertas y de los trabajos que tiene asignados.
      if (s.estado !== 'abierta' && !(s.asignada && s.asignada.prestadorId === me.id)) {
        const cotizo = s.postulaciones.some((p) => p.prestadorId === me.id);
        return A.noAccess(cotizo ? 'El cliente eligió otro presupuesto. Por privacidad, el detalle del trabajo solo lo ven el cliente, el prestador asignado y el equipo de arbitraje.'
          : 'Este trabajo fue adjudicado a otro prestador. Por privacidad, el detalle solo lo ven los involucrados y el equipo de arbitraje.');
      }
      return A.views.postular(s, me);
    }
    const readonly = s.clienteId !== me.id;
    if (readonly && me.rol === 'cliente') return A.noAccess('Por privacidad, el detalle de una solicitud (fotos, descripción y presupuestos) solo lo ven su cliente, los prestadores que cotizan y el equipo de arbitraje.');
    return panelSolicitante(s, me, readonly);
  };

  A.solicitudInfo = function (s) {
    return `<div class="card">
        <div class="card-pad">
          <div class="flex justify-between items-center mb-3 gap-2"><div class="sec-title">${A.icon('assignment')} Detalle del cliente</div>
            <span class="font-head text-[10px] text-on-surface-variant whitespace-nowrap">Creada: ${s.creada.slice(0, 10).split('-').reverse().join('/')}</span></div>
          <p class="text-sm leading-relaxed border-l-4 border-primary-container bg-surface-container-low p-3 whitespace-pre-line">${esc(s.descripcion)}</p>
          ${s.medidas ? `<div class="mt-3 flex gap-2 items-start text-sm bg-white border border-outline-variant p-3">${A.icon('straighten', 'text-primary')}<div><div class="lbl !mb-0">Medidas y datos técnicos</div>${esc(s.medidas)}</div></div>` : ''}
          ${s.tareas.length ? `<div class="lbl mt-5">Partes / tareas indicadas por el cliente</div>
          <ul class="grid sm:grid-cols-2 gap-2">${s.tareas.map((t) => `<li class="flex gap-2 items-start bg-surface-container-low border border-outline-variant/60 p-2 text-sm">${A.icon('check_box', 'text-primary !text-lg')} ${esc(t)}</li>`).join('')}</ul>` : ''}
          ${s.hitos.length ? `<div class="flex justify-between mt-5"><span class="lbl">Etapas acordadas (presupuesto aceptado)</span><span class="font-head text-[10px] text-primary font-semibold">${s.hitos.length} etapas</span></div>
          <ol class="space-y-2">${s.hitos.map((h, i) => `<li class="flex gap-3 bg-surface-container-low border border-outline-variant/60 p-3">
            <span class="w-7 h-7 shrink-0 bg-white border border-outline-variant text-primary font-head font-bold text-sm flex items-center justify-center">${i + 1}</span>
            <div><div class="font-head font-semibold">${esc(h.nombre)}</div>${h.desc ? `<div class="text-xs text-on-surface-variant">${esc(h.desc)}</div>` : ''}</div></li>`).join('')}</ol>`
          : `<div class="mt-5 text-xs text-on-surface-variant flex gap-2 items-center">${A.icon('flag', '!text-base text-primary')} Las etapas del trabajo las propone cada prestador en su presupuesto.</div>`}
        </div></div>
      <div class="card card-pad">
        <div class="flex justify-between items-center mb-3"><div class="sec-title">${A.icon('photo_library')} Fotos de la parte a reparar (${s.fotos.length})</div>
          <span class="font-head text-[10px] text-on-surface-variant">Cargadas por el cliente</span></div>
        ${A.gallery(s.fotos, { empty: 'El cliente no cargó fotos.' })}
      </div>`;
  };

  /* Aclaraciones resaltadas del prestador (perfil + presupuesto) */
  A.aclaracionesHtml = function (u, p) {
    const list = (u.aclaraciones || []).concat(p && p.aclaracion ? [p.aclaracion] : []);
    if (!list.length) return '';
    return `<div class="space-y-1">${list.map((a) => `<div class="flex items-center gap-2 bg-amber-50 border-l-4 border-amber-500 px-2 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-900">${A.icon('do_not_disturb_on', '!text-sm text-amber-700')} ${esc(a)}</div>`).join('')}</div>`;
  };

  function prestadorHead(u, total, extra) {
    const revs = A.reviews(u.id);
    return `<div class="flex gap-3 items-start">
          ${A.avatar(u, 'w-14 h-14')}
          <div class="flex-1 min-w-0">
            <div class="flex justify-between gap-2"><div class="font-head font-semibold text-lg leading-tight">${esc(A.fullName(u))}</div><div class="money text-lg whitespace-nowrap">${A.money(total)}</div></div>
            <div class="font-head text-[10px] text-primary uppercase tracking-wide">${esc(u.matricula || '')}${extra || ''}</div>
            <div class="text-xs mt-1">${u.rating ? `<span class="text-amber-600">★</span> <b>${u.rating}</b> · ${u.trabajos} trabajos finalizados` : 'Nuevo en la plataforma'}${revs.length ? ` · ${revs.length} reseña(s)` : ''}${A.statsDisputas(u.id).garantiaSinResolver ? ` · <span class="text-red-700">${A.statsDisputas(u.id).garantiaSinResolver} reclamo(s) por garantía sin resolver</span>` : ''}</div>
          </div>
        </div>`;
  }

  function visitaCard(s, p, readonly) {
    const u = A.user(p.prestadorId);
    const precioV = p.visita ? p.visita.monto : A.alCliente(p.montoVisita, A.comision('visita')); // precio final al cliente
    const est = { enviada: '<span class="chip-blue">Visita ofrecida</span>', visita_pagada: '<span class="chip-amber">Visita pagada</span>', visita_realizada: '<span class="chip-green">Visita realizada</span>', visita_cancelada: '<span class="chip-red">Visita cancelada · reembolsada</span>', visita_reclamada: '<span class="chip-red">No vino · en revisión</span>', rechazada: '<span class="chip-gray">No seleccionada</span>' }[p.estado];
    return `<div class="card border-secondary-container">
      <div class="p-4 space-y-3">
        <div class="flex justify-between items-center gap-2"><span class="chip bg-secondary-container text-white border-secondary-container">${A.icon('directions_walk', '!text-xs')} Visita técnica</span>${est}</div>
        ${prestadorHead(u, precioV, ' · cobra la visita')}
        ${A.aclaracionesHtml(u, null)}
        <div class="bg-surface-container-low border border-outline-variant/60 p-3 text-sm space-y-1">
          <div>${esc(p.detalleVisita)}</div>
          ${p.franja ? `<div class="text-xs text-on-surface-variant">${A.icon('event', '!text-sm')} ${esc(p.franja)}</div>` : ''}
        </div>
        ${A.demoNota(`El prestador cobra ${A.money(p.montoVisita)}; el cliente ve ${A.money(precioV)}. Incluye el costo de Mercado Pago (~${A.money(Math.round(precioV * A.costoMP(p.visita)))}) y la comisión de OficiosYa (${A.pct(A.comision('visita'))}), que no se informan al cliente.`)}
        <div class="text-[11px] text-on-surface-variant flex gap-1 items-start">${A.icon('info', '!text-sm')} <span><b>Son dos pagos separados:</b> primero pagás solo la visita. Después de la visita el prestador puede enviarte un presupuesto, que se paga aparte si lo aceptás.${p.descuentaVisita ? ' <b class="text-tertiary">Si aceptás su presupuesto, te descuenta la visita.</b>' : ''}</span></div>
        ${!readonly && s.estado === 'abierta' && p.estado === 'enviada' ? `<button class="btn w-full bg-secondary-container text-white border-secondary hover:bg-secondary" data-action="aceptar-visita" data-s="${s.id}" data-p="${p.id}">${A.icon('event_available')} Aceptar visita y pagar ${A.money(precioV)}</button>` : ''}
        ${!readonly && (p.estado === 'visita_pagada' || p.estado === 'visita_reclamada') ? A.visitaGestion(s, p, 'cliente') : ''}
        ${readonly && p.estado === 'visita_reclamada' ? '<div class="text-xs bg-red-50 border border-red-500 p-2">El cliente informó que el prestador no vino.</div>' : ''}
        ${p.estado === 'visita_cancelada' ? `<div class="text-xs bg-red-50 border border-red-500 p-2">Visita cancelada el ${esc(p.visita.cancelada)}: el prestador no se presentó. Se reembolsaron ${A.money(precioV)}.${p.visita.reclamo && p.visita.reclamo.motivo ? '<br><b>Motivo:</b> ' + esc(p.visita.reclamo.motivo) : ''}</div>` : ''}
        ${!readonly && ['visita_pagada', 'visita_realizada', 'visita_reclamada'].includes(p.estado) ? A.contactoCard(s, A.me(), p.prestadorId, 'coordinar la visita') : ''}
        ${p.estado === 'visita_realizada' ? `<div class="text-xs bg-emerald-50 border border-emerald-600/40 p-2">${p.visita.clienteAusente ? `Visita considerada realizada el ${esc(p.visita.realizada)}: el cliente no estaba (sin reembolso).` : `Visita realizada el ${esc(p.visita.realizada)}${p.visita.auto ? ' (confirmada automáticamente)' : ''}.`} ${A.presupuestos(s).some((x) => x.prestadorId === p.prestadorId) ? 'El prestador ya envió su presupuesto.' : 'Esperando el presupuesto del prestador (segundo pago).'}</div>` : ''}
      </div></div>`;
  }

  function postCard(s, p, i, readonly) {
    if (p.tipo === 'visita') return visitaCard(s, p, readonly);
    const u = A.user(p.prestadorId);
    const desc = A.descuentoVisita(s, p); const descCli = desc ? A.alCliente(desc) : 0;
    const total = A.precioCliente(p) - descCli; // precio final al cliente (incluye la comisión, sin desglose; menos la visita si se descuenta)
    const open = A.ui.openPost && p.id in A.ui.openPost ? A.ui.openPost[p.id] : i === 0;
    const verificado = u.estado === 'activo';
    return `<div class="card ${i === 0 ? 'border-primary-container' : ''}">
      <div class="p-4">
        <div class="flex justify-between items-center mb-3 gap-2">
          ${i === 0 && A.presupuestos(s).length > 1 ? `<span class="chip bg-tertiary text-white border-tertiary">${A.icon('star', '!text-xs ms-fill')} Mejor puntaje</span>` : `<span class="chip-gray">${esc(u.oficio || 'Prestador')}</span>`}
          <span class="font-head text-[10px] text-on-surface-variant">Postulado ${p.fecha.slice(5).replace('-', '/')}</span></div>
        <div class="mb-3 text-[11px] font-head font-semibold flex items-center gap-1 ${p.origen === 'tras_visita' ? 'text-secondary' : 'text-on-surface-variant'}">${A.icon(p.origen === 'tras_visita' ? 'directions_walk' : 'request_quote', '!text-sm')} ${p.origen === 'tras_visita' ? `PRESUPUESTO TRAS VISITA REALIZADA EL ${esc(p.visitaRealizada || '')}` : 'PRESUPUESTO DIRECTO (SIN VISITA PREVIA)'}</div>
        ${prestadorHead(u, total)}
        <div class="flex flex-wrap gap-1.5 mt-3">${verificado ? '<span class="chip-green">DNI y rostro verificado</span><span class="chip-blue">Credencial aprobada</span>' : '<span class="chip-amber">Perfil en revisión</span>'}</div>
        ${A.aclaracionesHtml(u, p) ? `<div class="mt-3">${A.aclaracionesHtml(u, p)}</div>` : ''}
      </div>
      ${open ? `<div class="mx-4 mb-4 bg-surface-container-low border border-outline-variant/60 p-3 text-sm">
          <div class="lbl">Etapas propuestas por el prestador</div>
          ${p.etapas.map((h, k) => `<div class="py-1 border-b border-outline-variant/40"><div class="flex justify-between gap-3"><span class="text-on-surface-variant">${k + 1}. ${esc(h.nombre)}</span><span class="font-head font-semibold tnum">${A.money(A.alCliente(p.montos[k]))}</span></div>${h.desc ? `<div class="text-[11px] text-on-surface-variant pl-4">${esc(h.desc)}</div>` : ''}</div>`).join('')}
          <div class="flex justify-between py-1.5 font-semibold"><span>Mano de obra</span><span class="font-head tnum">${A.money(p.montos.reduce((a, m) => a + A.alCliente(m), 0))}</span></div>
          ${desc ? `<div class="flex justify-between py-1 text-tertiary font-semibold"><span>Descuento por la visita ya pagada</span><span class="font-head tnum">-${A.money(descCli)}</span></div>` : ''}
          <div class="flex justify-between py-1"><span>Materiales / insumos</span><span class="font-head tnum">${p.incluyeMateriales ? A.money(A.alCliente(p.costoMateriales, A.comision('materiales'))) + ' <span class="text-[10px] font-normal">(estimado)</span>' : 'No incluidos'}</span></div>
          <div class="text-xs text-on-surface-variant">${esc(p.detalleMateriales || (p.incluyeMateriales ? '' : 'Los provee el cliente.'))}</div>
          ${p.incluyeMateriales ? `<div class="text-[11px] text-primary mt-0.5">${A.icon('receipt_long', '!text-sm')} Los compra el prestador: declara el monto real con foto del ticket y pagás cada ticket que apruebes.</div>` : ''}
          <div class="flex justify-between py-1 mt-1"><span>Herramientas</span><span class="${p.aportaHerramientas ? 'text-tertiary' : 'text-amber-700'} font-head text-xs font-bold uppercase">${p.aportaHerramientas ? 'Las aporta el prestador' : 'Las provee el cliente'}</span></div>
          ${p.detalleHerramientas ? `<div class="text-xs text-on-surface-variant">${esc(p.detalleHerramientas)}</div>` : ''}
          ${p.nota ? `<div class="text-xs mt-2 bg-white border border-outline-variant/60 p-2"><b>Nota:</b> ${esc(p.nota)}</div>` : ''}
          <div class="flex justify-between items-end mt-3 bg-white border border-outline-variant p-3">
            <div><div class="font-head text-[10px] font-bold uppercase tracking-wider">Total cotizado</div><div class="text-[10px] text-tertiary font-head">Precio final · se paga por etapa</div></div>
            <div class="money text-2xl text-primary">${A.money(total)} <span class="text-xs">ARS</span></div></div>
          <div class="mt-2">${A.demoNota(`El prestador cotizó ${A.money(A.totalPost(p))} y cobra eso. El cliente ve ${A.money(total)}: se suman la comisión de OficiosYa (${A.pct()} mano de obra, ${A.pct(A.comision('materiales'))} materiales) y el costo de Mercado Pago (${A.pct(A.state.costoMP)}). En cada pago, MP descuenta su costo, OficiosYa cobra su comisión completa (application_fee) y el prestador recibe lo que cotizó. El cliente no ve este desglose.`)}</div>
        </div>` : ''}
      <div class="px-4 pb-4 space-y-2">
        ${!readonly && s.estado === 'abierta' ? `<button class="btn-primary w-full" data-action="aceptar" data-s="${s.id}" data-p="${p.id}">${A.icon('account_balance')} Aceptar y pagar la etapa 1 · ${A.money(A.alCliente(p.montos[0]))}</button>` : ''}
        ${p.estado === 'aceptada' ? '<div class="chip-green w-full justify-center !py-2">Presupuesto aceptado</div>' : ''}
        ${p.estado === 'rechazada' ? '<div class="chip-gray w-full justify-center !py-2">No seleccionado</div>' : ''}
        <button class="btn-ghost w-full btn-sm" data-action="toggle-post" data-p="${p.id}" data-open="${open ? 1 : 0}">${open ? 'Ocultar detalle' : 'Ver detalle de cotización'} ${A.icon(open ? 'expand_less' : 'expand_more')}</button>
      </div>
    </div>`;
  }

  function panelSolicitante(s, me, readonly) {
    const rating = (p) => A.user(p.prestadorId).rating || 0;
    const posts = A.presupuestos(s).sort((a, b) => rating(b) - rating(a)).concat(A.visitasActivas(s));
    const nP = A.presupuestos(s).length; const nV = A.visitasActivas(s).length;
    const head = A.pageHead(
      `<a href="#/${readonly ? '' : 'mis-solicitudes'}" class="hover:text-primary">${readonly ? 'Explorar' : 'Solicitudes'}</a> / <span>Expediente #${s.id}</span> / <span class="text-tertiary">● Pago por etapa</span>`,
      `<div class="flex flex-wrap gap-2 items-center mb-2"><span class="chip-blue">${esc(s.categoria)}</span>
         <span class="text-xs text-on-surface-variant flex items-center gap-1">${A.icon('location_on', '!text-sm')} ${esc(s.zona)} · CP ${esc(s.cp)}</span></div>
       <h1 class="text-2xl md:text-[32px] md:leading-[38px] font-bold tracking-tight max-w-3xl">${esc(s.titulo)}</h1>`,
      s.estado === 'abierta'
        ? `<div class="bg-surface-container border border-outline-variant p-3 flex gap-3 items-center"><span class="bg-tertiary text-white p-2">${A.icon('gavel')}</span>
           <div><div class="lbl !mb-0">Estado</div><div class="font-head font-semibold leading-tight">Recibiendo presupuestos<br>(${nP} presupuesto${nP === 1 ? '' : 's'} · ${nV} visita${nV === 1 ? '' : 's'})</div></div></div>`
        : `<a href="#/trabajo/${s.id}" class="btn-primary">${A.icon('timeline')} Ver seguimiento del trabajo</a>`);

    return head + `<div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_420px] gap-6">
      <div class="space-y-5 min-w-0">
        <div class="bg-surface-container border border-outline-variant p-4 md:p-5 flex gap-4">
          <span class="bg-primary-container text-white w-12 h-12 shrink-0 flex items-center justify-center">${A.icon('lock', '!text-2xl')}</span>
          <div><div class="font-head font-semibold text-lg flex flex-wrap items-center gap-2">Pago por etapa con Mercado Pago <span class="chip bg-tertiary text-white border-tertiary">Riesgo acotado</span></div>
          <p class="text-sm text-on-surface-variant">Pagás <b>cada etapa antes de que empiece</b> y el pago va a la cuenta de Mercado Pago del prestador: nunca adelantás más que una etapa. La aprobás cuando está terminada; si algo sale mal, un árbitro puede ordenar el reembolso de la etapa en curso. Si no respondés en el plazo, la etapa se aprueba sola; al aprobar la última, el trabajo queda cerrado.</p></div>
        </div>
        ${A.solicitudInfo(s)}
        ${readonly && me.rol === 'cliente' ? '' : A.historialHtml(s)}
      </div>
      <aside class="space-y-4">
        <div class="card p-4 flex justify-between items-center"><div><div class="font-head font-semibold uppercase text-sm tracking-wide">Comparativa de cotizaciones</div>
          <div class="text-xs text-on-surface-variant">${nP} presupuesto(s) y ${nV} visita(s) técnica(s)</div></div><span class="chip-gray">Orden: puntaje</span></div>
        ${posts.length ? posts.map((p, i) => postCard(s, p, i, readonly)).join('') : `<div class="card p-8 text-center text-sm text-on-surface-variant">${A.icon('hourglass_empty', '!text-3xl text-outline')}<br>Todavía no hay postulaciones.<br><span class="text-xs">Tip demo: cambiá a <b>Roberto Gómez (Prestador)</b> para cotizar esta solicitud.</span>
          ${!readonly ? `<button class="btn-ghost btn-sm mt-3" data-action="ver-como" data-id="u-roberto" data-go="#/solicitud/${s.id}">Ver como Roberto Gómez</button>` : ''}</div>`}
      </aside>
    </div>`;
  }

  A.actions['toggle-post'] = (el) => {
    A.ui.openPost = A.ui.openPost || {};
    A.ui.openPost[el.dataset.p] = el.dataset.open !== '1';
    A.rerender();
  };

  /* ---------- Checkout Mercado Pago (simulado): presupuesto ---------- */
  A.actions.aceptar = (el) => {
    const s = A.sol(el.dataset.s); const p = s.postulaciones.find((x) => x.id === el.dataset.p);
    const u = A.user(p.prestadorId); const desc = A.descuentoVisita(s, p);
    const total = A.precioCliente(p) - (desc ? A.alCliente(desc) : 0); const e1 = A.alCliente(Math.max(0, p.montos[0] - desc));
    A.checkout({
      intro: 'Aceptás el presupuesto y pagás solo la <b>etapa 1</b>. Cada etapa siguiente se paga antes de que empiece. El pago se acredita en la cuenta de Mercado Pago del prestador.',
      lineas: [['Servicio', '#' + s.id], ['Prestador', esc(A.fullName(u))], [`Etapa 1: ${esc(p.etapas[0].nombre)}`, A.money(e1)],
        [`Resto de la mano de obra (${p.etapas.length - 1} etapa${p.etapas.length === 2 ? '' : 's'}, se paga después)`, A.money(p.montos.reduce((a, m) => a + A.alCliente(m), 0) - (desc ? A.alCliente(desc) : 0) - e1)],
        ...(desc ? [['Descuento por la visita (ya aplicado)', '-' + A.money(A.alCliente(desc))]] : []),
        ['Materiales (estimado, se paga cada ticket)', p.incluyeMateriales ? A.money(A.alCliente(p.costoMateriales, A.comision('materiales'))) : '—'], ['Precio total estimado', A.money(total)]],
      total: e1, action: 'pagar', data: { s: s.id, p: p.id },
    });
  };

  A.actions.pagar = (el) => {
    el.disabled = true; el.innerHTML = 'Procesando pago…';
    setTimeout(() => {
      const s = A.sol(el.dataset.s); const p = s.postulaciones.find((x) => x.id === el.dataset.p);
      A.presupuestos(s).forEach((x) => { x.estado = x.id === p.id ? 'aceptada' : 'rechazada'; });
      A.visitas(s).forEach((x) => { if (x.estado === 'enviada') x.estado = 'rechazada'; });
      s.estado = 'en_curso';
      s.asignada = { postulacionId: p.id, prestadorId: p.prestadorId };
      // Registro de los pagos del trabajo: la tasa y el costo de MP quedan fijos para este trabajo. No hay custodia:
      // cada etapa se cobra con split y se acredita en la cuenta del prestador.
      s.escrow = { tasas: Object.assign({}, A.state.comisiones), mp: A.state.costoMP, estado: 'activo', fecha: A.now(), pagos: [], cobrado: 0, liberadoPrestador: 0, comisionCobrada: 0, costoMPTotal: 0, reembolsado: 0 };
      s.hitos = p.etapas.map((h) => ({ nombre: h.nombre, desc: h.desc || '', estado: 'pendiente', hora: '' }));
      s.evidenciasPost = []; s.compras = [];
      // Descuento de la visita: se descuenta del monto de las primeras etapas
      let resta = A.descuentoVisita(s, p);
      if (resta) s.hitos.forEach((h, i) => { const q = Math.min(resta, Number(p.montos[i]) || 0); if (q) { h.descVisita = -q; resta -= q; } });
      A.recalcTrabajo(s);
      const n1 = A.montoEtapa(s, 0); const e1 = A.precio(s.escrow, n1, 'etapa');
      if (n1 > 0) { const pago = A.cobrar(s, { concepto: 'Pago de etapa 1', ref: 'etapa:0', cliente: e1, neto: n1 }); s.escrow.paymentId = pago.id; }
      s.hitos[0].pagado = true;
      A.hist(s, 'pago', `Presupuesto aceptado${p.origen === 'tras_visita' ? ' (presupuestado después de la visita)' : ' (presupuesto directo)'}. Pago de la etapa 1 (${A.money(e1)}) acreditado al prestador`, p.prestadorId);
      A.closeModal(); A.save();
      A.toast(`Pago aprobado: <b>${A.money(e1)}</b> de la etapa 1, acreditados al prestador.`, 'ok');
      A.go('#/trabajo/' + s.id);
    }, 900);
  };

  /* ---------- Visita técnica: primer pago independiente ---------- */
  A.actions['aceptar-visita'] = (el) => {
    const s = A.sol(el.dataset.s); const p = s.postulaciones.find((x) => x.id === el.dataset.p); const u = A.user(p.prestadorId);
    A.checkout({
      intro: 'Pagás <b>solo la visita técnica</b>. El pago se acredita en la cuenta de Mercado Pago del prestador; si no se presenta, se te reembolsa el 100%. Si después aceptás un presupuesto, es un <b>pago aparte</b>.',
      lineas: [['Servicio', '#' + s.id], ['Prestador', esc(A.fullName(u))], ['Visita técnica / diagnóstico', A.money(A.alCliente(p.montoVisita, A.comision('visita')))], ['Franja propuesta', esc(p.franja || '—')]],
      total: A.alCliente(p.montoVisita, A.comision('visita')), action: 'pagar-visita', data: { s: s.id, p: p.id },
    });
  };
  A.actions['pagar-visita'] = (el) => {
    el.disabled = true; el.innerHTML = 'Procesando pago…';
    setTimeout(() => {
      const s = A.sol(el.dataset.s); const p = s.postulaciones.find((x) => x.id === el.dataset.p);
      p.estado = 'visita_pagada';
      const cliente = A.alCliente(p.montoVisita, A.comision('visita'));
      const pago = A.cobrar(s, { concepto: 'Pago de visita técnica', ref: 'visita', cliente, neto: p.montoVisita, prestadorId: p.prestadorId, mp: A.state.costoMP, guardar: false });
      p.visita = Object.assign(pago, { paymentId: pago.id, monto: cliente, neto: p.montoVisita, tasa: A.comision('visita'), mp: A.state.costoMP });
      A.hist(s, 'visita_pagada', 'Visita aceptada y pagada por el cliente', p.prestadorId);
      A.closeModal();
      A.commit(`Visita pagada (<b>${A.money(p.visita.monto)}</b>). El prestador fue notificado para coordinar.`, 'ok');
    }, 900);
  };
})();

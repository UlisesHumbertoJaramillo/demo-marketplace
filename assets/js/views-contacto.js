/* Componentes compartidos: historial de la solicitud, datos de contacto con advertencias y denuncias con evidencia. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;

  /* =================== HISTORIAL =================== */
  const HIST_ICON = {
    publicada: ['campaign', 'text-primary'], visita: ['directions_walk', 'text-secondary'], visita_pagada: ['payments', 'text-secondary'],
    visita_realizada: ['task_alt', 'text-tertiary'], visita_cancelada: ['event_busy', 'text-red-600'], visita_retirada: ['undo', 'text-outline'],
    presupuesto: ['request_quote', 'text-primary'], pago: ['account_balance', 'text-tertiary'], contacto: ['contact_phone', 'text-on-surface-variant'],
  };
  /* soloPrestador: si se indica, muestra solo los eventos generales y los de ese prestador */
  A.historialHtml = function (s, soloPrestador) {
    const ev = (s.historial || []).filter((h) => !soloPrestador || !h.prestadorId || h.prestadorId === soloPrestador);
    if (!ev.length) return '';
    return `<div class="card card-pad">
      <div class="sec-title mb-3">${A.icon('history')} Historial de la solicitud</div>
      <ol class="relative border-l-2 border-outline-variant ml-2 space-y-3">${ev.map((h) => {
        const [ic, col] = HIST_ICON[h.tipo] || ['circle', 'text-outline'];
        const pr = h.prestadorId ? A.user(h.prestadorId) : null;
        return `<li class="pl-5 relative"><span class="absolute -left-[11px] top-0 w-5 h-5 bg-white border border-outline-variant flex items-center justify-center">${A.icon(ic, '!text-sm ' + col)}</span>
          <div class="text-sm">${esc(h.texto)}${pr ? ` · <b>${esc(A.fullName(pr))}</b>` : ''}</div>
          <div class="text-[11px] text-on-surface-variant font-head">${esc(h.fecha)}</div></li>`;
      }).join('')}</ol></div>`;
  };

  /* =================== DATOS DE CONTACTO =================== */
  const ADVERTENCIAS = [
    ['lock', 'Usá los datos solo para coordinar este trabajo. Está prohibido compartirlos o usarlos para otros fines.'],
    ['money_off', 'Nunca pagues ni cobres por fuera de la plataforma: perdés la protección del pago por etapa y la mediación.'],
    ['task_alt', 'Aprobá cada etapa en la plataforma solo después de revisarla: tu aprobación es la conformidad con el trabajo.'],
    ['schedule', 'Coordiná en horarios razonables. Si podés, que haya otra persona presente durante la visita.'],
    ['report', 'Ante acoso, insultos, amenazas o agresiones, cortá el contacto y hacé la denuncia con evidencia. Si estás en peligro, llamá al 911.'],
  ];

  /* s: solicitud · otroId: la contraparte · motivo: texto corto (ej. "coordinar la visita") */
  A.contactoCard = function (s, me, otroId, motivo) {
    const otro = A.user(otroId); if (!otro) return '';
    const key = s.id + '_' + otroId;
    const visto = (A.ui.contactoVisto || {})[key];
    const den = (A.ui.denuncia || {})[key];
    const esCliente = otro.id === s.clienteId;
    // Si la contraparte me denunció y pidió ocultar sus datos, no se muestran mientras se revisa.
    const bloqueado = (me.reportes || []).some((r) => r.autorId === otroId && r.bloquear && !r.resuelto);
    let cuerpo;
    if (bloqueado) {
      cuerpo = `<p class="text-sm bg-surface-container-low border border-outline-variant p-3">${A.icon('visibility_off', '!text-base')} Los datos de contacto no están disponibles mientras el equipo revisa un reporte. La coordinación sigue por la plataforma.</p>`;
    } else if (!visto) {
      cuerpo = `<p class="text-xs text-on-surface-variant">Ya podés ver los datos de contacto de ${esCliente ? 'el cliente' : 'el prestador'} para ${esc(motivo)}. Antes vas a leer las advertencias de seguridad.</p>
        <button class="btn-primary w-full" data-action="contacto-ver" data-s="${s.id}" data-u="${otroId}">${A.icon('contact_phone')} Ver datos de contacto</button>`;
    } else {
      cuerpo = `<div class="flex items-center gap-3">${A.avatar(otro, 'w-12 h-12', 'rounded-full')}
          <div class="min-w-0"><div class="font-head font-semibold">${esc(A.fullName(otro))}</div><div class="text-[11px] text-on-surface-variant">${esCliente ? 'Cliente' : 'Prestador · ' + esc(otro.matricula || otro.oficio || '')}</div></div></div>
        <div class="text-sm divide-y divide-outline-variant/50 border-y border-outline-variant/50">
          <div class="flex justify-between gap-2 py-2"><span class="text-on-surface-variant">${A.icon('call', '!text-base')} Teléfono</span><a class="font-semibold underline" href="tel:${esc((otro.tel || '').replace(/\s/g, ''))}">${esc(otro.tel || '—')}</a></div>
          <div class="flex justify-between gap-2 py-2"><span class="text-on-surface-variant">${A.icon('mail', '!text-base')} Email</span><a class="font-semibold underline break-all text-right" href="mailto:${esc(otro.email)}">${esc(otro.email)}</a></div>
          ${esCliente ? `<div class="flex justify-between gap-2 py-2"><span class="text-on-surface-variant">${A.icon('location_on', '!text-base')} Dirección</span><span class="font-semibold text-right">${esc([s.direccion, s.zona, 'CP ' + s.cp].filter(Boolean).join(', '))}</span></div>` : ''}
        </div>
        <ul class="text-[11px] text-on-surface-variant space-y-1">${ADVERTENCIAS.slice(0, 3).map(([ic, t]) => `<li class="flex gap-1">${A.icon(ic, '!text-sm')} ${t}</li>`).join('')}</ul>`;
    }
    return `<div class="card border-2 border-slate-950 p-4 md:p-5 space-y-3">
      <div class="flex justify-between items-center gap-2"><div class="sec-title">${A.icon('contact_phone')} Contacto para coordinar</div>${visto ? '<span class="chip-blue">Visible</span>' : '<span class="chip-gray">Oculto</span>'}</div>
      ${cuerpo}
      ${den ? denunciaForm(s, otro, key, den)
        : `<button class="w-full text-xs font-head font-semibold text-red-600 border border-red-300 py-2 hover:bg-red-50 flex items-center justify-center gap-1" data-action="denuncia-open" data-k="${key}">${A.icon('report', '!text-base')} Denunciar acoso o agresión</button>`}
    </div>`;
  };

  function denunciaForm(s, otro, key, d) {
    return `<div class="border-2 border-red-500 bg-red-50/50 p-3 space-y-2">
      <div class="font-head font-bold text-red-700 flex items-center gap-1">${A.icon('report')} Denunciar a ${esc(A.fullName(otro))}</div>
      <p class="text-[11px] text-red-800">La denuncia la revisa el equipo de administración. Puede suspender la cuenta denunciada. <b>Si estás en peligro, llamá al 911.</b></p>
      <div><label class="lbl">Tipo</label><select class="inp" data-model="denuncia.${key}.tipo">${window.TIPOS_DENUNCIA.map((t) => `<option ${d.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label class="lbl">Qué pasó</label><textarea rows="3" class="inp" data-model="denuncia.${key}.texto" placeholder="Contá qué pasó, cuándo y por qué medio (llamada, mensaje, en persona).">${esc(d.texto)}</textarea></div>
      <div><label class="lbl">Evidencia (capturas de mensajes, fotos)</label>${A.uploader('denuncia.' + key + '.fotos', 'denuncia', 'Adjuntar evidencia')}
        ${d.fotos.length ? `<div class="mt-2">${A.gallery(d.fotos, { removable: 'remove-photo" data-target="denuncia.' + key + '.fotos', cols: 'grid-cols-3', label: 'EVIDENCIA' })}</div>` : ''}</div>
      <label class="flex gap-2 items-start text-xs cursor-pointer"><input type="checkbox" class="w-4 h-4 mt-0.5 accent-[#2563eb]" data-model="denuncia.${key}.bloquear" ${d.bloquear ? 'checked' : ''}> Ocultar mis datos de contacto a esta persona mientras se revisa</label>
      <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="denuncia-cancel" data-k="${key}">Cancelar</button>
        <button class="btn-danger btn-sm flex-1 !bg-red-600 !text-white" data-action="denuncia-submit" data-k="${key}" data-s="${s.id}" data-u="${otro.id}">Enviar denuncia</button></div>
    </div>`;
  }

  A.actions['contacto-ver'] = (el) => {
    const s = A.sol(el.dataset.s); const otro = A.user(el.dataset.u);
    A.modal(`<div class="p-5 space-y-3">
      <div class="font-head font-bold text-lg flex items-center gap-2">${A.icon('shield')} Antes de ver los datos de contacto</div>
      <ul class="space-y-2 text-sm">${ADVERTENCIAS.map(([ic, t]) => `<li class="flex gap-2 items-start">${A.icon(ic, 'text-primary !text-lg shrink-0')} <span>${t}</span></li>`).join('')}</ul>
      <p class="text-[11px] text-on-surface-variant">Queda registrado en el historial que viste los datos de ${esc(A.fullName(otro))}.</p>
      <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="close-modal">Cancelar</button>
        <button class="btn-primary flex-1" data-action="contacto-ok" data-s="${s.id}" data-u="${otro.id}">Entiendo, ver datos</button></div></div>`);
  };
  A.actions['contacto-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const me = A.me();
    (A.ui.contactoVisto = A.ui.contactoVisto || {})[s.id + '_' + el.dataset.u] = true;
    A.hist(s, 'contacto', `${A.fullName(me)} vio los datos de contacto de ${A.fullName(A.user(el.dataset.u))}`);
    A.closeModal(); A.commit();
  };
  A.actions['denuncia-open'] = (el) => { (A.ui.denuncia = A.ui.denuncia || {})[el.dataset.k] = { tipo: window.TIPOS_DENUNCIA[0], texto: '', fotos: [], bloquear: true }; A.rerender(); };
  A.actions['denuncia-cancel'] = (el) => { delete A.ui.denuncia[el.dataset.k]; A.rerender(); };
  A.actions['denuncia-submit'] = (el) => {
    const d = A.ui.denuncia[el.dataset.k]; const s = A.sol(el.dataset.s); const otro = A.user(el.dataset.u); const me = A.me();
    if (!d.texto || d.texto.trim().length < 15) { A.toast('Contá qué pasó (mín. 15 caracteres).', 'err'); return; }
    otro.reportes = otro.reportes || [];
    otro.reportes.push({ id: A.nextId('DEN'), tipo: d.tipo, texto: d.texto.trim(), fotos: d.fotos.slice(), autorId: me.id, solicitudId: s.id, fecha: A.now(), resuelto: false, grave: true, bloquear: !!d.bloquear });
    delete A.ui.denuncia[el.dataset.k];
    A.commit('Denuncia enviada al equipo de administración. Te vamos a contactar por email.', 'ok');
  };
})();

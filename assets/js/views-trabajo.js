/* Seguimiento del trabajo: pago por etapa (split de Mercado Pago), aprobación de etapas (con aprobación automática), evidencias y disputas. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;

  function rolEn(s, me) {
    if (s.clienteId === me.id) return 'cliente';
    if (s.asignada && s.asignada.prestadorId === me.id) return 'prestador';
    if (me.rol === 'admin') return 'admin';
    if (me.rol === 'arbitro') return 'arbitro';
    return null;
  }
  /* Parte del prestador en lo que está en juego (lo que recibió por los pagos de etapas sin aprobar) */
  const enJuegoPrest = (s) => A.pagosEnJuego(s).reduce((a, p) => a + Math.round((p.recibe * (p.cliente - p.reembolsado)) / p.cliente), 0);

  /* =================== LISTA EN CURSO =================== */
  A.views.trabajos = function (params, me) {
    const list = A.state.solicitudes.filter((s) => s.estado !== 'abierta' && (s.clienteId === me.id || (s.asignada && s.asignada.prestadorId === me.id)));
    return A.pageHead('<span>Trabajos</span>', `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Trabajos adjudicados</h1>
      <p class="text-sm text-on-surface-variant mt-1">Seguimiento de etapas: pago antes de empezar y aprobación al terminar.</p>`) +
      `<div class="max-w-[1100px] mx-auto px-4 md:px-8 py-6 space-y-3">
        ${!list.length ? `<div class="card p-10 text-center text-on-surface-variant">No tenés trabajos adjudicados todavía.</div>` : ''}
        ${list.map((s) => {
          const done = s.hitos.filter((h) => h.estado === 'completado').length;
          const otro = s.clienteId === me.id ? A.user(s.asignada.prestadorId) : A.user(s.clienteId);
          const cur = s.hitos.find((h) => h.estado !== 'completado');
          const porPagar = s.estado === 'en_curso' && cur && !cur.pagado;
          return `<a href="#/trabajo/${s.id}" class="card p-4 block hover:border-primary-container">
            <div class="flex flex-wrap justify-between gap-2 mb-2"><div class="flex flex-wrap gap-2">${A.estadoChip(s)}<span class="font-head text-[10px] text-on-surface-variant">ORDEN #${s.id}</span></div>
              <span class="money ${s.estado === 'completada' ? 'text-tertiary' : 'text-secondary'}">${s.escrow ? A.money(s.clienteId === me.id ? s.escrow.total : s.escrow.neto) : ''}</span></div>
            <div class="font-head font-semibold text-lg leading-tight">${esc(s.titulo)}</div>
            <div class="text-xs text-on-surface-variant mt-1">${s.clienteId === me.id ? 'Prestador' : 'Cliente'}: ${esc(A.fullName(otro))}</div>
            <div class="mt-3 h-2 bg-surface-container-high"><div class="h-2 ${s.estado === 'en_disputa' ? 'bg-red-500' : s.estado === 'completada' ? 'bg-tertiary' : 'bg-secondary-container'}" style="width:${s.hitos.length ? Math.round((done / s.hitos.length) * 100) : 0}%"></div></div>
            <div class="font-head text-[10px] text-on-surface-variant mt-1 uppercase tracking-wide">${done} de ${s.hitos.length} etapas aprobadas${porPagar ? ` · <span class="text-amber-700">${s.clienteId === me.id ? 'Tenés una etapa por pagar' : 'Etapa esperando el pago del cliente'}</span>` : ''}${(s.estado === 'completada' || s.estado === 'resuelta') && !s.resena && s.clienteId === me.id ? ' · <span class="text-primary">Pendiente de calificar</span>' : ''}${s.ajuste && s.ajuste.estado === 'pendiente' ? ' · <span class="text-amber-700">Ajuste de precio pendiente</span>' : ''}</div></a>`;
        }).join('')}
      </div>`;
  };

  /* =================== DETALLE / SEGUIMIENTO =================== */
  A.views.trabajo = function (params, me) {
    const s = A.sol(params[0]);
    if (!s || !s.escrow) return A.noAccess('Este trabajo todavía no fue adjudicado.');
    const rol = rolEn(s, me);
    if (!rol) return A.noAccess('Solo el cliente, el prestador asignado y el equipo de administración/arbitraje pueden ver este expediente.');
    const pr = A.user(s.asignada.prestadorId); const cl = A.user(s.clienteId);
    const e = s.escrow;
    const done = s.hitos.filter((h) => h.estado === 'completado').length;
    const actual = s.hitos.findIndex((h) => h.estado !== 'completado');
    const t = A.tasa(e, 'etapa');
    const esPrest = rol === 'prestador'; const staff = rol === 'admin' || rol === 'arbitro';
    const vista = (m) => (esPrest ? m : A.precio(e, m, 'etapa')); // prestador: lo que cobra · resto: precio que paga el cliente
    const pp = A.porPagar(s);
    const disputa = s.estado === 'en_disputa';

    const box = disputa
      ? ['Monto en disputa (etapa en curso)', A.money(esPrest ? enJuegoPrest(s) : A.enJuego(s)), 'text-red-600', 'Ese pago ya está en la cuenta del prestador']
      : esPrest
        ? ['Cobrado en tu cuenta de Mercado Pago', A.money(e.liberadoPrestador), 'text-tertiary', pp.n ? `Por cobrar: ${A.money(pp.neto)} (${pp.n} etapa${pp.n === 1 ? '' : 's'} sin pagar)` : 'Todas las etapas están pagadas']
        : ['Pagado hasta ahora', A.money(e.cobrado - (e.reembolsado || 0)), 'text-primary', pp.n ? `Falta pagar: ${A.money(pp.cliente)} (${pp.n} etapa${pp.n === 1 ? '' : 's'})` : 'No hay etapas pendientes de pago'];

    const head = A.pageHead('',
      `<div class="flex flex-wrap gap-2 mb-2"><span class="chip-dark">Orden #${s.id}</span>${A.estadoChip(s)}<span class="font-head text-[10px] text-on-surface-variant self-center">${e.pagos.length} PAGO${e.pagos.length === 1 ? '' : 'S'} CON SPLIT MP</span></div>
       <h1 class="text-2xl md:text-[32px] md:leading-[38px] font-bold tracking-tight">${esc(s.titulo)}</h1>
       <div class="text-sm text-on-surface-variant mt-2 flex flex-wrap gap-x-3">${A.icon('verified', '!text-base text-tertiary')} Prestador: <b class="text-on-surface">${esc(A.fullName(pr))}</b> (${esc(pr.matricula || pr.oficio)}) · Cliente: <b class="text-on-surface">${esc(A.fullName(cl))}</b></div>`,
      `<div class="card p-4 flex gap-3 items-center"><span class="w-11 h-11 bg-surface-container flex items-center justify-center text-primary">${A.icon(disputa ? 'gavel' : 'payments')}</span>
        <div><div class="lbl !mb-0">${box[0]}</div><div class="money text-3xl ${box[2]}">${box[1]} <span class="text-xs">ARS</span></div>
        <div class="text-[10px] font-head font-semibold text-tertiary uppercase tracking-wide">${box[3]}</div></div></div>`);

    /* --- Etapas: el cliente paga cada una antes de que empiece --- */
    const hitos = `<div class="card card-pad">
      <div class="flex flex-wrap gap-2 justify-between items-center mb-2"><div class="sec-title">${A.icon('timeline')} Etapas y pagos</div><span class="font-head text-[10px] font-bold">${done} DE ${s.hitos.length} APROBADAS</span></div>
      <p class="text-xs text-on-surface-variant mb-4">El cliente paga cada etapa <b>antes de que empiece</b> y el pago se acredita en el momento en la cuenta de Mercado Pago del prestador. Cuando el prestador la termina, el cliente la revisa y la aprueba, y paga la siguiente. Si el cliente no la aprueba ni la observa en ${A.plazoAprob()} días, se aprueba automáticamente. Al aprobarse la última, el trabajo queda cerrado.</p>
      <ol class="space-y-2">${s.hitos.map((h, i) => {
        const ok = h.estado === 'completado'; const cur = i === actual && s.estado === 'en_curso'; const ultima = i === s.hitos.length - 1;
        const porAprobar = h.estado === 'por_aprobar'; const pagada = !!h.pagado; const m = A.montoEtapa(s, i);
        const sig = i + 1 < s.hitos.length && !s.hitos[i + 1].pagado;
        return `<li class="flex gap-3 p-3 ${cur ? 'bg-blue-50 border-l-4 border-primary-container' : ''}">
          ${A.icon(ok ? 'check_circle' : cur ? 'radio_button_checked' : 'radio_button_unchecked', (ok ? 'ms-fill text-tertiary' : cur ? 'text-primary-container' : 'text-outline') + ' !text-2xl shrink-0')}
          <div class="flex-1"><div class="flex justify-between gap-2"><div class="font-head font-semibold ${cur ? 'text-primary-container' : ''}">Etapa ${i + 1}: ${esc(h.nombre)}</div>
            ${ok ? `<span class="chip-green !normal-case self-start shrink-0">${h.auto ? 'Aprobada automáticamente · ' : ''}${esc(h.hora)}</span>` : porAprobar ? '<span class="chip-amber self-start shrink-0">Esperando aprobación</span>' : cur && !pagada ? '<span class="chip-amber self-start shrink-0">Por pagar</span>' : cur ? '<span class="chip-blue self-start shrink-0">En ejecución</span>' : ''}</div>
            ${h.desc ? `<div class="text-xs text-on-surface-variant mt-0.5">${esc(h.desc)}</div>` : ''}
            <div class="text-xs mt-1 font-head text-on-surface-variant flex flex-wrap gap-x-3">${esPrest ? 'A cobrar' : 'Precio'}: ${A.money(vista(m))}${h.ajuste ? ` <span class="text-amber-700">(con ajuste de precio)</span>` : ''}${h.descVisita ? ` <span class="text-tertiary">(descontada la visita)</span>` : ''}
              ${pagada ? `<span class="text-tertiary font-semibold">${A.icon('payments', '!text-sm')} ${esPrest ? 'Cobrada en tu cuenta MP' : 'Pagada'}</span>` : ''}</div>
            ${h.observacion && !ok ? `<div class="text-xs mt-1 bg-amber-50 border border-amber-600 p-1.5"><b>Observación del cliente:</b> ${esc(h.observacion)}</div>` : ''}
            ${cur && !pagada && rol === 'cliente' ? `<div class="mt-2 border border-primary-container bg-white p-2 space-y-2">
                <div class="text-xs">Pagá esta etapa para que el prestador la empiece. El pago se acredita en la cuenta de Mercado Pago del prestador.</div>
                <button class="btn-primary btn-sm" data-action="etapa-pagar" data-s="${s.id}" data-i="${i}">${A.icon('account_balance')} Pagar etapa ${i + 1} · ${A.money(vista(m))}</button></div>` : ''}
            ${cur && !pagada && esPrest ? `<div class="text-xs mt-2 text-amber-700">${A.icon('hourglass_top', '!text-sm')} Esperando que el cliente pague esta etapa. No la empieces hasta ver el pago acreditado en tu cuenta.</div>` : ''}
            ${cur && pagada && !porAprobar && esPrest ? `<button class="btn-success btn-sm mt-2" data-action="hito-ok" data-s="${s.id}" data-i="${i}">${A.icon('task_alt')} ${ultima ? 'Marcar etapa final como terminada' : 'Marcar etapa como terminada'}</button>` : ''}
            ${porAprobar && esPrest && s.estado === 'en_curso' ? `<div class="text-xs mt-2 text-amber-700">Esperando que el cliente revise y apruebe esta etapa.${h.terminadaEn ? ` Si no responde, se aprueba automáticamente el <b>${A.fmtFecha(A.venceAprob(h))}</b>.` : ''}</div>` : ''}
            ${porAprobar && rol === 'cliente' && s.estado === 'en_curso' ? `<div class="mt-2 border border-amber-600 bg-amber-50 p-2 space-y-2">
                <div class="text-xs">El prestador terminó esta etapa. Revisala: al aprobarla das tu <b>conformidad</b> con esta etapa (ya está pagada)${sig ? ' y pasás a pagar la siguiente' : ultima ? ' y el trabajo queda cerrado' : ''}. Si algo no está bien, observala.${h.terminadaEn ? ` Si no respondés, se aprueba automáticamente el <b>${A.fmtFecha(A.venceAprob(h))}</b>.` : ''}</div>
                ${A.ui.obsHito === s.id + '_' + i ? `<textarea rows="2" class="inp" data-model="obsTexto" placeholder="Qué falta o qué hay que corregir">${esc(A.ui.obsTexto || '')}</textarea>
                  <div class="flex gap-2"><button class="btn-ghost btn-sm" data-action="hito-obs-no">Volver</button><button class="btn-danger btn-sm" data-action="hito-obs-ok" data-s="${s.id}" data-i="${i}">Enviar observación</button></div>`
                : `<div class="flex flex-wrap gap-2"><button class="btn-success btn-sm" data-action="hito-aprobar" data-s="${s.id}" data-i="${i}">${A.icon('task_alt')} ${sig ? `Aprobar y pagar la etapa ${i + 2}` : ultima ? 'Aprobar etapa final y cerrar el trabajo' : 'Aprobar etapa'}</button>
                  <button class="btn-ghost btn-sm" data-action="hito-obs" data-s="${s.id}" data-i="${i}">Observar</button></div>`}</div>` : ''}
            ${cur && ultima && pagada && !porAprobar ? `<div class="text-xs mt-2 text-primary font-semibold">${A.icon('flag', '!text-sm')} Etapa final: cuando el cliente la apruebe, el trabajo queda cerrado.</div>` : ''}
          </div></li>`;
      }).join('')}</ol></div>`;

    /* --- Evidencias post-trabajo --- */
    const draft = (A.ui.evpost = A.ui.evpost || {}); draft[s.id] = draft[s.id] || [];
    const evid = `<div class="card card-pad">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-2"><div class="sec-title">${A.icon('photo_camera')} Evidencias post-trabajo del prestador</div>
        <span class="chip-gray">${s.evidenciasPost.length} fotos de conformidad</span></div>
      <p class="text-xs text-on-surface-variant mb-3">Fotos del trabajo finalizado subidas desde el celular del prestador. Respaldo en caso de disputa o contracargo.</p>
      ${A.gallery(s.evidenciasPost, { label: 'EVIDENCIA', empty: 'El prestador todavía no subió fotos del trabajo terminado.' })}
      ${esPrest && (s.estado === 'en_curso' || disputa) ? `<div class="mt-4 border-t border-outline-variant/60 pt-4 space-y-3">
        ${A.uploader('evpost.' + s.id, 'post', 'Subir fotos del trabajo')}
        ${draft[s.id].length ? A.gallery(draft[s.id], { removable: 'remove-photo" data-target="evpost.' + s.id, label: 'NUEVA' }) + `<button class="btn-primary btn-sm" data-action="evpost-save" data-s="${s.id}">${A.icon('cloud_upload')} Adjuntar ${draft[s.id].length} foto(s) al expediente</button>` : ''}
      </div>` : ''}</div>`;

    /* --- Pagos del trabajo: cada rol ve sus montos; el desglose del split solo lo ve el staff o el recuadro de demo --- */
    const fila = (k, v, cls = 'font-head tnum', dest = false) => `<div class="flex justify-between py-2 ${dest ? 'bg-surface-container-low px-2' : ''}"><span class="${dest ? 'font-head font-bold uppercase text-xs' : ''}">${k}</span><b class="${cls}">${A.money(v)}</b></div>`;
    const listaPagos = e.pagos.length ? `<div class="border border-outline-variant/60 divide-y divide-outline-variant/50 text-xs mb-3">${e.pagos.map((p) => `<div class="p-2 flex justify-between gap-3">
        <div class="min-w-0"><div class="font-semibold">${esc(p.concepto)}</div><div class="text-on-surface-variant font-head">${esc(p.id)} · ${esc(p.fecha)}${p.reembolsado ? ` · <span class="text-red-600">reembolsado ${A.money(p.reembolsado)}</span>` : ''}</div>
          ${staff ? `<div class="text-on-surface-variant">Prestador ${A.money(p.recibe)} · costo MP ${A.money(p.mpFee)} · application_fee ${A.money(p.fee)}${p.recupero ? ` (incluye recupero de deuda ${A.money(p.recupero)})` : ''}</div>` : ''}
          ${esPrest && p.recupero ? `<div class="text-amber-700">Se descontaron ${A.money(p.recupero)} de tu deuda con OficiosYa</div>` : ''}</div>
        <b class="font-head tnum whitespace-nowrap">${A.money(esPrest ? p.recibe : p.cliente)}</b></div>`).join('')}</div>` : '';
    const estadoPagos = { activo: 'Pago por etapa', liquidado: 'Liquidado', resuelto: 'Resuelto por arbitraje', cancelado: 'Rescindido' }[e.estado] || e.estado;
    const fid = `<div class="card card-pad">
      <div class="flex justify-between items-center mb-3"><div class="sec-title">${A.icon('account_balance_wallet')} Pagos del trabajo</div><span class="chip-gray">${estadoPagos}</span></div>
      ${listaPagos}
      <div class="text-sm divide-y divide-outline-variant/50">
        ${esPrest
          ? fila('Tu presupuesto de mano de obra', e.neto) + fila('Cobrado en tu cuenta de Mercado Pago', e.liberadoPrestador, 'money text-tertiary text-lg', true)
            + (pp.n ? fila(`Por cobrar (${pp.n} etapa${pp.n === 1 ? '' : 's'} sin pagar)`, pp.neto) : '') + (pr.deuda ? fila('Deuda con OficiosYa (se descuenta de tus próximos cobros)', pr.deuda, 'font-head tnum text-red-600') : '')
          : staff
            ? fila('Cobrado a clientes', e.cobrado) + fila('Recibido por el prestador', e.liberadoPrestador) + fila(`Costo de Mercado Pago (${A.pct(A.costoMP(e))} estimado)`, e.costoMPTotal || 0)
              + fila(`Comisión OficiosYa · application_fee (${A.pct(t)} etapas · ${A.pct(A.tasa(e, 'materiales'))} materiales)`, e.comisionCobrada || 0) + (e.reembolsado ? fila('Reembolsado al cliente', e.reembolsado, 'font-head tnum text-red-600') : '')
              + (e.garantia ? fila('Reintegrado con el fondo de garantía', e.garantia, 'font-head tnum text-red-600') : '') + (pp.n ? fila('Falta cobrar al cliente', pp.cliente) : '')
            : fila('Precio del trabajo (mano de obra)', e.total) + fila('Pagado', e.cobrado, 'money text-primary text-lg', true)
              + (e.reembolsado ? fila('Reembolsado', e.reembolsado, 'font-head tnum text-red-600') : '') + (pp.n ? fila(`Falta pagar (${pp.n} etapa${pp.n === 1 ? '' : 's'})`, pp.cliente) : '')}
      </div>
      ${!staff ? `<div class="mt-2">${A.demoNota(`Cada pago es un split: el cliente pagó ${A.money(e.cobrado)}; Mercado Pago descontó ${A.money(e.costoMPTotal || 0)} de costo de procesamiento, el prestador recibió ${A.money(e.liberadoPrestador)} y OficiosYa ${A.money(e.comisionCobrada || 0)} (application_fee: su comisión completa, ${A.pct(t)} en etapas y ${A.pct(A.tasa(e, 'materiales'))} en materiales). El cliente paga la comisión y el costo de MP. Ninguna de las partes ve este desglose.`)}</div>` : ''}
      <p class="text-[11px] text-on-surface-variant mt-2">* Cada pago se crea a nombre del prestador (split 1:1 de Mercado Pago) y se acredita en su cuenta en el momento. OficiosYa no retiene dinero: si hay un reembolso, Mercado Pago lo descuenta de los pagos ya acreditados.</p></div>`;

    return head + `<div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_440px] gap-6">
      <div class="space-y-5 min-w-0">${reclamoCard(s, rol)}${resenaCard(s, rol)}${hitos}${evid}${comprasCard(s, rol)}${fid}${reclamosMPCard(s, rol)}${A.historialHtml(s)}
        <details class="card"><summary class="card-pad cursor-pointer sec-title">${A.icon('description')} Ver pliego original de la solicitud</summary><div class="px-4 md:px-6 pb-6 space-y-4">${A.solicitudInfo(s)}</div></details>
      </div>
      <aside class="space-y-4 lg:sticky lg:top-36 self-start">${cierreCard(s, rol)}${rol === 'cliente' || esPrest ? A.contactoCard(s, me, rol === 'cliente' ? s.asignada.prestadorId : s.clienteId, 'coordinar el trabajo') : ''}${ajusteCard(s, rol)}${disputaCard(s, rol)}</aside>
    </div>`;
  };

  /* --- Tarjeta de cierre y aprobación automática (reemplaza al PIN) --- */
  function cierreCard(s, rol) {
    const e = s.escrow;
    if (s.estado === 'completada') {
      const auto = s.hitos[s.hitos.length - 1].auto;
      return `<div class="card border-2 border-tertiary p-5">
        <div class="sec-title text-tertiary">${A.icon('verified', 'ms-fill')} Trabajo terminado y conforme</div>
        <p class="text-sm mt-2">${auto ? 'La etapa final se aprobó automáticamente porque el cliente no respondió en el plazo. ' : ''}${rol === 'prestador' ? `${auto ? '' : 'El cliente aprobó la etapa final. '}El trabajo quedó cerrado: en total cobraste <b>${A.money(e.liberadoPrestador)}</b>.`
          : rol === 'cliente' ? `${auto ? '' : 'Aprobaste la etapa final. '}El trabajo quedó cerrado: en total pagaste <b>${A.money(e.cobrado - (e.reembolsado || 0))}</b>.`
          : `Cliente pagó ${A.money(e.cobrado)}; prestador recibió ${A.money(e.liberadoPrestador)}; costo MP ${A.money(e.costoMPTotal || 0)}; comisión ${A.money(e.comisionCobrada || 0)}.`}</p></div>`;
    }
    if (s.estado === 'cancelada') {
      const r = s.rescision || {};
      return `<div class="card border-2 border-slate-950 p-5"><div class="sec-title">${A.icon('cancel')} Trabajo rechazado / rescindido</div>
        <p class="text-sm mt-2">Rechazado por el ${esc(r.por || '—')} el ${esc(r.fecha || '')} después de un desacuerdo en el precio. Las etapas pagadas y aprobadas quedaron para el prestador y las etapas sin pagar se cancelaron${e.reembolsado ? `. Se reembolsaron ${A.money(e.reembolsado)} al cliente` : ''}.</p>
        ${r.motivo ? `<p class="text-xs mt-2 bg-surface-container-low p-2 border border-outline-variant/60"><b>Motivo:</b> ${esc(r.motivo)}</p>` : ''}</div>`;
    }
    if (s.estado === 'resuelta') {
      const r = s.disputa.resolucion;
      return `<div class="card border-2 border-slate-950 p-5"><div class="sec-title">${A.icon('gavel')} Caso ${s.disputa.id} resuelto</div>
        <div class="text-sm mt-2"><b>${esc(r.titulo)}</b></div><p class="text-sm text-on-surface-variant mt-1">${esc(r.detalle)}</p>
        ${r.nota ? `<p class="text-xs mt-2 bg-surface-container-low p-2 border border-outline-variant/60"><b>Fundamento:</b> ${esc(r.nota)}</p>` : ''}
        <div class="text-[11px] text-on-surface-variant mt-2">Árbitro: ${esc(A.fullName(A.user(r.arbitroId)))} · ${r.fecha}</div></div>`;
    }
    const disputa = s.estado === 'en_disputa';
    const i = s.hitos.findIndex((h) => h.estado === 'por_aprobar'); const h = s.hitos[i];
    const plazo = A.plazoAprob();
    let body;
    const c = s.correccion;
    if (disputa) body = `<div class="bg-red-50 border border-red-500 text-red-700 text-xs p-2">${A.icon('gavel', '!text-sm')} La aprobación automática queda suspendida mientras dura la disputa.</div>`;
    else if (c && !c.cumplida) {
      body = `<div class="bg-amber-50 border border-amber-600 p-3 text-sm space-y-1"><div class="font-head font-bold">${A.icon('handyman', '!text-base')} Corrección ${s.disputa && s.disputa.resolucion && s.disputa.resolucion.por === 'acuerdo' ? 'acordada' : 'ordenada'}</div>
        <div>El prestador tiene hasta el <b>${A.fmtFecha(A.parseFecha(c.vence))}</b> para corregir la etapa ${c.hito + 1} y marcarla como terminada.</div>
        <div class="text-xs">Si no lo hace, se le reembolsa al cliente el pago de la etapa (${A.money(c.monto)}).</div></div>
        ${rol !== 'arbitro' ? `<button class="btn-ghost btn-sm w-full mt-3" data-action="demo-correccion-vencer" data-s="${s.id}">Demo: simular que venció el plazo de corrección</button>` : ''}`;
    }
    else if (h && h.terminadaEn) {
      body = `<div class="text-sm">La <b>etapa ${i + 1}</b> (“${esc(h.nombre)}”) espera la aprobación del cliente.</div>
        <div class="bg-amber-50 border border-amber-600 p-2 text-xs mt-2">${A.icon('schedule', '!text-sm')} Si ${rol === 'cliente' ? 'no la aprobás ni la observás' : 'el cliente no la aprueba ni la observa'}, se aprueba automáticamente el <b>${A.fmtFecha(A.venceAprob(h))}</b>${i === s.hitos.length - 1 ? ' y el trabajo queda cerrado' : ''}.</div>
        ${rol !== 'arbitro' ? `<button class="btn-ghost btn-sm w-full mt-3" data-action="demo-autoaprob" data-s="${s.id}">Demo: simular que venció el plazo</button>` : ''}`;
    } else {
      body = `<p class="text-sm">Cada etapa terminada la aprueba el cliente. Si no la aprueba ni la observa en <b>${plazo} días</b>, se aprueba automáticamente. Al aprobarse la última, el trabajo queda cerrado.</p>`;
    }
    return `<div class="card border-2 ${disputa ? 'border-red-500' : 'border-primary-container'} p-4 md:p-5">
      <div class="sec-title mb-3">${A.icon('task_alt')} Aprobación de etapas y cierre</div>
      ${body}
      <p class="text-[11px] text-on-surface-variant mt-3">Las aprobaciones quedan registradas con fecha y hora en el historial: son la conformidad del cliente ante un reclamo o un contracargo.</p></div>`;
  }

  /* --- Tarjeta de disputa: mediación entre las partes y, si no hay acuerdo, arbitraje --- */
  const TIPOS_PROP = { corregir: 'Corregir la etapa sin costo', parcial: 'Reembolso parcial', total: 'Reembolso total de la etapa', forzosa: 'Sin reembolso (el pago queda para el prestador)' };
  const textoProp = (p) => (p.tipo === 'corregir' ? `Corregir la etapa en ${p.plazo} días` : p.tipo === 'parcial' ? `Reembolso parcial de ${A.money(p.monto)}` : TIPOS_PROP[p.tipo]);
  function disputaCard(s, rol) {
    if (rol !== 'cliente' && rol !== 'prestador') {
      return s.disputa ? `<a href="#/arbitraje/${s.id}" class="btn-dark w-full">${A.icon('gavel')} Abrir caso ${s.disputa.id} en arbitraje</a>` : '';
    }
    const f = (A.ui.disp = A.ui.disp || {})[s.id];
    if (s.estado === 'en_curso' && !f) {
      return `<div class="card border border-red-300 p-4 md:p-5">
        <div class="font-head font-bold text-red-600 flex items-center gap-2">${A.icon('report')} ¿Problemas con el servicio o desacuerdo?</div>
        <p class="text-xs text-on-surface-variant mt-1">${rol === 'cliente' ? 'Si el trabajo no coincide con lo presupuestado o hay fallas, no apruebes la etapa y abrí una mediación. Primero se busca un acuerdo con el prestador (por ejemplo, que corrija la etapa); si no lo hay, decide un árbitro.' : 'Si hay un desacuerdo con el cliente sobre el trabajo, abrí una mediación con tus evidencias. Si no hay acuerdo, decide un árbitro.'}</p>
        <button class="btn-danger w-full mt-3" data-action="disp-open" data-s="${s.id}">${A.icon('gavel')} Abrir mediación</button></div>`;
    }
    if (f) {
      const motivos = rol === 'cliente'
        ? ['Trabajo incompleto / parcial', 'Trabajo mal hecho / incumplido', 'Mal funcionamiento posterior']
        : ['El cliente observa una etapa terminada sin motivo', 'Desacuerdo sobre el alcance del trabajo'];
      const nueva = s.estado === 'en_curso';
      return `<div class="card border-2 border-red-500 p-4 md:p-5 space-y-3">
        <div class="font-head font-bold text-red-600 flex items-center gap-2">${A.icon('gavel')} ${nueva ? 'Abrir mediación' : 'Agregar contra-evidencias'}</div>
        ${nueva ? `<div><label class="lbl">Motivo</label><select class="inp" data-model="disp.${s.id}.motivo">${motivos.map((m) => `<option ${f.motivo === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>` : ''}
        <div><label class="lbl">Declaración</label><textarea rows="3" class="inp ${f.err ? 'inp-err' : ''}" data-model="disp.${s.id}.declaracion" placeholder="Contá qué pasó con el mayor detalle posible">${esc(f.declaracion || '')}</textarea></div>
        <div><label class="lbl">Contra-evidencias fotográficas</label>${A.uploader('disp.' + s.id + '.fotos', rol === 'cliente' ? 'contra' : 'post')}
          <div class="mt-2">${A.gallery(f.fotos, { removable: 'remove-photo" data-target="disp.' + s.id + '.fotos', label: 'CONTRA', cols: 'grid-cols-3', empty: 'Sin fotos adjuntas.' })}</div></div>
        <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="disp-cancel" data-s="${s.id}">Cancelar</button>
          <button class="btn-danger flex-1 !bg-red-600 !text-white" data-action="disp-submit" data-s="${s.id}">${nueva ? 'Abrir mediación' : 'Adjuntar al caso'}</button></div>
        ${nueva ? `<p class="text-[11px] text-on-surface-variant">Se frena el trabajo y empieza una mediación de ${A.cfg('plazoMediacion', 72)} h entre las partes. Si no hay acuerdo, el caso pasa a un árbitro, que resuelve sobre el pago de la etapa en curso: lo ya aprobado no se discute.</p>` : ''}
      </div>`;
    }
    if (s.disputa) {
      const d = s.disputa; const mio = d[rol]; const otro = d[rol === 'cliente' ? 'prestador' : 'cliente'];
      const abierta = s.estado === 'en_disputa'; const med = abierta && d.fase === 'mediacion';
      const fp = (A.ui.prop = A.ui.prop || {})[s.id];
      const props = (d.propuestas || []).map((p) => {
        const mia = p.por === rol; const pend = p.estado === 'pendiente';
        return `<div class="border ${pend ? 'border-amber-600 bg-amber-50' : 'border-outline-variant/60 bg-surface-container-low'} p-2 text-xs space-y-1">
          <div class="flex justify-between gap-2"><b>${mia ? 'Tu propuesta' : `Propuesta del ${p.por}`}: ${esc(textoProp(p))}</b><span class="${p.estado === 'aceptada' ? 'chip-green' : p.estado === 'pendiente' ? 'chip-amber' : 'chip-gray'}">${p.estado}</span></div>
          ${p.nota ? `<div>${esc(p.nota)}</div>` : ''}<div class="text-on-surface-variant">${esc(p.fecha)}</div>
          ${pend && !mia && med ? `<div class="flex gap-2 pt-1"><button class="btn-ghost btn-sm flex-1" data-action="med-rechazar" data-s="${s.id}" data-p="${p.id}">Rechazar</button><button class="btn-success btn-sm flex-1" data-action="med-aceptar" data-s="${s.id}" data-p="${p.id}">Aceptar acuerdo</button></div>` : ''}
        </div>`;
      }).join('');
      const enJ = A.enJuego(s);
      const form = med && fp ? `<div class="border border-primary-container p-3 space-y-2">
          <div class="font-head text-xs font-bold uppercase">Proponer un acuerdo</div>
          <select class="inp" data-model="prop.${s.id}.tipo" data-rerender>${Object.entries(TIPOS_PROP).map(([k, t]) => `<option value="${k}" ${fp.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
          ${fp.tipo === 'corregir' ? `<label class="flex items-center gap-2 text-sm">Plazo para corregir <input type="number" min="1" max="30" class="inp w-20" data-model="prop.${s.id}.plazo" value="${esc(fp.plazo)}"> días</label>` : ''}
          ${fp.tipo === 'parcial' ? `<label class="flex items-center bg-white border border-slate-400"><span class="px-2 font-head">$</span><input type="number" min="1" max="${enJ - 1}" step="500" class="w-full py-1.5 pr-2 outline-none font-head font-semibold tnum" data-model="prop.${s.id}.monto" value="${esc(fp.monto)}" placeholder="Monto a reembolsar (máx. ${A.money(enJ - 1)})"></label>` : ''}
          <textarea rows="2" class="inp" data-model="prop.${s.id}.nota" placeholder="Detalle de la propuesta (qué se corrige, cuándo, etc.)">${esc(fp.nota || '')}</textarea>
          <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="med-prop-cancel" data-s="${s.id}">Cancelar</button><button class="btn-primary btn-sm flex-1" data-action="med-prop-submit" data-s="${s.id}">Enviar propuesta</button></div></div>` : '';
      return `<div class="card border-2 border-red-500 p-4 md:p-5 space-y-3">
        <div class="flex justify-between items-center"><div class="font-head font-bold text-red-600 flex items-center gap-2">${A.icon('gavel')} Caso ${d.id}</div>
          <span class="${d.resolucion ? 'chip-gray' : med ? 'chip-amber' : 'chip-red'}">${d.resolucion ? 'Resuelto' : med ? 'Mediación' : 'En arbitraje'}</span></div>
        <div class="text-sm"><b>Motivo:</b> ${esc(d.motivo)}</div>
        <div class="text-xs text-on-surface-variant">Abierta por el ${d.abiertaPor} · ${d.fecha}${d.fase === 'arbitraje' ? ` · Árbitro: ${(d.resolucion && d.resolucion.arbitroId) || d.arbitroId ? esc(A.fullName(A.user((d.resolucion && d.resolucion.arbitroId) || d.arbitroId))) : 'pendiente de asignación'}` : ''}</div>
        ${med ? `<div class="bg-amber-50 border border-amber-600 p-2 text-xs">${A.icon('schedule', '!text-sm')} <b>Mediación entre las partes</b> hasta el <b>${A.fmtFecha(A.parseFecha(d.venceMediacion))}</b>. Propongan un acuerdo (por ejemplo, corregir la etapa). Si no hay acuerdo en ese plazo, el caso pasa automáticamente a un árbitro.</div>` : ''}
        ${abierta && d.fase === 'arbitraje' ? `<div class="bg-red-50 border border-red-500 p-2 text-xs">${A.icon('gavel', '!text-sm')} El caso está en manos de un árbitro, que tiene plazo para resolver hasta el <b>${A.fmtFecha(A.parseFecha(d.venceArbitro))}</b>.</div>` : ''}
        ${props ? `<div class="space-y-2">${props}</div>` : ''}
        ${form}
        ${med && !fp ? `<div class="flex flex-col gap-2"><button class="btn-primary btn-sm w-full" data-action="med-prop-open" data-s="${s.id}">${A.icon('send')} Proponer un acuerdo</button>
          <button class="btn-ghost btn-sm w-full" data-action="med-escalar" data-s="${s.id}">${A.icon('gavel')} Pasar el caso a un árbitro ahora</button>
          <button class="text-[11px] underline text-on-surface-variant" data-action="demo-med-vencer" data-s="${s.id}">Demo: simular que venció la mediación</button></div>` : ''}
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="bg-surface-container-low border border-outline-variant/60 p-2"><div class="lbl !mb-0">Tu descargo</div>${mio.declaracion ? 'Presentado' : '<span class="text-red-600 font-semibold">Pendiente</span>'} · ${mio.fotos.length} fotos</div>
          <div class="bg-surface-container-low border border-outline-variant/60 p-2"><div class="lbl !mb-0">Contraparte</div>${otro.declaracion ? 'Presentado' : 'Pendiente'} · ${otro.fotos.length} fotos</div>
        </div>
        ${abierta ? `<button class="btn-ghost w-full" data-action="disp-open" data-s="${s.id}">${A.icon('add_photo_alternate')} ${mio.declaracion ? 'Agregar más contra-evidencias' : 'Presentar descargo y contra-evidencias'}</button>` : ''}
        ${s.estado === 'en_curso' ? `<button class="btn-danger w-full btn-sm" data-action="disp-open" data-s="${s.id}">${A.icon('gavel')} Abrir una nueva mediación</button>` : ''}
      </div>`;
    }
    return '';
  }

  /* --- Reclamo por garantía (después del cierre): mediación para que el prestador corrija --- */
  function reclamoCard(s, rol) {
    if (s.estado !== 'completada' || !s.cerradaEn) return '';
    const r = s.reclamo; const plazo = A.cfg('plazoReclamo', 90); const dias = A.diasDesde(s.cerradaEn);
    const enPlazo = dias <= plazo;
    const ultimoPago = s.escrow.pagos.length ? s.escrow.pagos[s.escrow.pagos.length - 1] : null;
    const reembolsable = ultimoPago && A.diasDesde(ultimoPago.fecha) <= 180;
    const maxReemb = s.escrow.pagos.filter((p) => p.ref === 'ajuste' || (p.ref || '').indexOf('etapa:') === 0).reduce((a, p) => a + p.cliente - p.reembolsado, 0);
    const box = (inner, color = 'border-amber-600') => `<div class="card border-2 ${color} p-4 md:p-5 space-y-3"><div class="font-head font-bold flex items-center gap-2">${A.icon('shield', 'text-amber-700')} Reclamo por garantía</div>${inner}</div>`;
    if (!r) {
      if (rol !== 'cliente') return '';
      if (!enPlazo) return `<div class="card p-4 text-xs text-on-surface-variant">${A.icon('shield', '!text-base')} El plazo para reclamos por garantía (${plazo} días desde el cierre) ya venció.</div>`;
      const f = (A.ui.rec = A.ui.rec || {})[s.id];
      if (!f) return box(`<p class="text-xs text-on-surface-variant">¿Apareció una falla después de terminado el trabajo? Tenés <b>${plazo - dias} días</b> más para reclamar. Primero se busca que el prestador lo corrija; un reembolso solo se hace si los dos están de acuerdo.</p>
        <button class="btn-ghost w-full" data-action="rec-open" data-s="${s.id}">${A.icon('report')} Iniciar reclamo por garantía</button>`, 'border-outline-variant');
      return box(`<textarea rows="3" class="inp" data-model="rec.${s.id}.texto" placeholder="Qué falla apareció y desde cuándo">${esc(f.texto)}</textarea>
        ${A.uploader('rec.' + s.id + '.fotos', 'resena', 'Adjuntar fotos')}${f.fotos.length ? A.gallery(f.fotos, { removable: 'remove-photo" data-target="rec.' + s.id + '.fotos', cols: 'grid-cols-4', label: 'FOTO' }) : ''}
        <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="rec-cancel" data-s="${s.id}">Cancelar</button><button class="btn-primary flex-1" data-action="rec-submit" data-s="${s.id}">Enviar reclamo</button></div>`);
    }
    const est = { abierto: ['chip-amber', 'Esperando respuesta del prestador'], en_correccion: ['chip-blue', 'El prestador va a corregirlo'], oferta: ['chip-blue', 'Reembolso ofrecido'], rechazado: ['chip-red', 'Rechazado por el prestador'], resuelto: ['chip-green', 'Resuelto'], reembolsado: ['chip-green', 'Resuelto con reembolso'], no_resuelto: ['chip-red', 'Sin resolver'] }[r.estado];
    const fo = (A.ui.recOf = A.ui.recOf || {})[s.id];
    let acciones = '';
    if (rol === 'prestador' && r.estado === 'abierto') {
      acciones = fo ? `<div class="space-y-2">${fo.modo === 'reembolso' ? `<label class="flex items-center bg-white border border-slate-400"><span class="px-2 font-head">$</span><input type="number" min="1" max="${maxReemb}" step="500" class="w-full py-1.5 pr-2 outline-none font-head font-semibold tnum" data-model="recOf.${s.id}.monto" value="${esc(fo.monto)}" placeholder="Monto a reembolsar"></label>` : ''}
          <textarea rows="2" class="inp" data-model="recOf.${s.id}.texto" placeholder="${fo.modo === 'corregir' ? 'Cuándo pasás a corregirlo' : fo.modo === 'reembolso' ? 'Motivo del reembolso' : 'Por qué no corresponde la garantía'}">${esc(fo.texto)}</textarea>
          <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="rec-of-cancel" data-s="${s.id}">Volver</button><button class="btn-primary btn-sm flex-1" data-action="rec-responder" data-s="${s.id}">Enviar respuesta</button></div></div>`
        : `<div class="flex flex-col gap-2"><button class="btn-success btn-sm" data-action="rec-modo" data-s="${s.id}" data-v="corregir">${A.icon('handyman')} Acepto corregirlo</button>
          ${reembolsable ? `<button class="btn-ghost btn-sm" data-action="rec-modo" data-s="${s.id}" data-v="reembolso">${A.icon('undo')} Ofrecer un reembolso</button>` : '<div class="text-[11px] text-on-surface-variant">No se puede ofrecer reembolso: pasaron más de 180 días desde el último pago (límite de Mercado Pago).</div>'}
          <button class="btn-ghost btn-sm" data-action="rec-modo" data-s="${s.id}" data-v="rechazar">Rechazar el reclamo</button></div>`;
    }
    if (rol === 'cliente' && r.estado === 'en_correccion') acciones = `<div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="rec-cerrar" data-s="${s.id}" data-v="no_resuelto">No quedó resuelto</button><button class="btn-success btn-sm flex-1" data-action="rec-cerrar" data-s="${s.id}" data-v="resuelto">Quedó resuelto</button></div>`;
    if (rol === 'cliente' && r.estado === 'oferta') acciones = `<div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="rec-cerrar" data-s="${s.id}" data-v="no_resuelto">Rechazar</button><button class="btn-success btn-sm flex-1" data-action="rec-aceptar-oferta" data-s="${s.id}">Aceptar reembolso de ${A.money(r.oferta)}</button></div>`;
    if (rol === 'cliente' && r.estado === 'rechazado') acciones = `<button class="btn-ghost btn-sm w-full" data-action="rec-cerrar" data-s="${s.id}" data-v="no_resuelto">Cerrar como no resuelto</button>`;
    return box(`<div class="flex justify-between gap-2 items-center"><span class="text-xs text-on-surface-variant">${esc(r.fecha)}</span><span class="${est[0]}">${est[1]}</span></div>
      <p class="text-sm bg-surface-container-low border-l-4 border-amber-500 p-2">${esc(r.texto)}</p>
      ${r.fotos.length ? A.gallery(r.fotos, { cols: 'grid-cols-4', label: 'FOTO' }) : ''}
      ${(r.respuestas || []).map((x) => `<div class="text-xs border border-outline-variant/60 p-2"><b>${x.autor === 'prestador' ? 'Prestador' : 'Cliente'}:</b> ${esc(x.texto)} <span class="text-on-surface-variant">· ${esc(x.fecha)}</span></div>`).join('')}
      ${r.estado === 'no_resuelto' ? '<div class="text-xs text-red-700">Quedó registrado en la reputación del prestador como reclamo de garantía sin resolver.</div>' : ''}
      ${acciones}`, r.estado === 'no_resuelto' ? 'border-red-500' : 'border-amber-600');
  }

  /* --- Reclamos y contracargos en Mercado Pago: el fallo de OficiosYa no obliga a Mercado Pago --- */
  function reclamosMPCard(s, rol) {
    const staff = rol === 'admin' || rol === 'arbitro';
    const list = s.reclamosMP || [];
    if (!list.length && !(staff && s.escrow.pagos.length)) return '';
    const est = { en_revision: ['chip-amber', 'En revisión de Mercado Pago'], a_favor_cliente: ['chip-red', 'Mercado Pago falló a favor del cliente'], a_favor_prestador: ['chip-green', 'Mercado Pago falló a favor del prestador'] };
    return `<div class="card p-4 md:p-5 space-y-3">
      <div class="sec-title">${A.icon('report')} Reclamos en Mercado Pago</div>
      <p class="text-xs text-on-surface-variant">Al pagar, el cliente acepta resolver los reclamos primero con la mediación de OficiosYa. Si igual reclama en Mercado Pago o desconoce el pago con su banco (contracargo), Mercado Pago decide por su cuenta y puede descontarle el monto al prestador. OficiosYa envía el expediente como evidencia.</p>
      ${list.map((r) => `<div class="border border-outline-variant/60 p-2 text-xs space-y-1">
        <div class="flex justify-between gap-2"><b>${r.tipo} · pago ${esc(r.pagoId)} · ${A.money(r.monto)}</b><span class="${est[r.estado][0]}">${est[r.estado][1]}</span></div>
        <div class="text-on-surface-variant">${esc(r.fecha)} · evidencia enviada: aprobaciones de etapas, fotos e historial</div>
        ${r.contraFallo ? '<div class="text-red-700 font-semibold">Contradice la resolución de OficiosYa, que había sido a favor del prestador.</div>' : ''}
        ${staff && r.estado === 'en_revision' ? `<div class="flex gap-2 pt-1"><button class="btn-ghost btn-sm flex-1" data-action="mprec-fallo" data-s="${s.id}" data-r="${r.id}" data-v="a_favor_prestador">Demo: falla a favor del prestador</button><button class="btn-danger btn-sm flex-1" data-action="mprec-fallo" data-s="${s.id}" data-r="${r.id}" data-v="a_favor_cliente">Demo: falla a favor del cliente</button></div>` : ''}
      </div>`).join('')}
      ${staff ? `<div class="flex flex-wrap gap-2"><button class="btn-ghost btn-sm" data-action="mprec-nuevo" data-s="${s.id}" data-t="Reclamo">Demo: el cliente reclamó en Mercado Pago</button><button class="btn-ghost btn-sm" data-action="mprec-nuevo" data-s="${s.id}" data-t="Contracargo">Demo: contracargo del banco</button></div>` : ''}
    </div>`;
  }


  /* =================== COMPRAS DE MATERIALES (monto + foto del ticket; el cliente paga cada ticket aprobado) =================== */
  function comprasCard(s, rol) {
    const p = A.postAceptada(s); const e = s.escrow;
    const est = p.incluyeMateriales ? Number(p.costoMateriales) || 0 : 0;
    const compras = s.compras || [];
    const sum = (f) => compras.filter(f).reduce((a, c) => a + c.monto, 0);
    const declarado = sum(() => true); const pagado = sum((c) => c.estado === 'pagada');
    const activo = s.estado === 'en_curso';
    if (!compras.length && !p.incluyeMateriales && !(rol === 'prestador' && activo)) return '';
    const chip = { pendiente: '<span class="chip-amber">Pendiente de aprobación</span>', aprobada: '<span class="chip-blue">Aprobada · falta pagar</span>', pagada: '<span class="chip-green">Pagada al prestador</span>', observada: '<span class="chip-red">Observada</span>' };
    const f = ((A.ui.compra = A.ui.compra || {})[s.id] = A.ui.compra[s.id] || { detalle: '', monto: '', foto: [] });
    return `<div class="card card-pad">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-2"><div class="sec-title">${A.icon('receipt_long')} Compras de materiales e insumos</div><span class="chip-gray">${compras.length} ticket(s)</span></div>
      <p class="text-xs text-on-surface-variant mb-3">El prestador compra los materiales, declara el monto real y adjunta la foto del ticket. Cuando el cliente lo aprueba, <b>paga ese ticket</b> y el pago se acredita al prestador en el momento, para que no financie los materiales. Se paga el monto del ticket más los cargos del servicio y del medio de pago.</p>
      <div class="grid grid-cols-3 gap-2 mb-3 text-center">
        <div class="bg-surface-container-low border border-outline-variant/60 p-2"><div class="lbl !mb-0 !text-[9px]">Estimado en presupuesto</div><div class="money">${A.money(est)}</div></div>
        <div class="bg-surface-container-low border border-outline-variant/60 p-2"><div class="lbl !mb-0 !text-[9px]">Declarado con ticket</div><div class="money">${A.money(declarado)}</div></div>
        <div class="bg-surface-container-low border border-outline-variant/60 p-2"><div class="lbl !mb-0 !text-[9px]">Pagado al prestador</div><div class="money text-tertiary">${A.money(pagado)}</div></div>
      </div>
      ${compras.length ? `<div class="divide-y divide-outline-variant/50 border-y border-outline-variant/50">${compras.map((c) => `<div class="py-3 flex gap-3 items-start">
          <button class="w-16 h-16 shrink-0 border border-slate-950/70 bg-white overflow-hidden" data-action="zoom" data-src="${c.foto}" title="Ver ticket"><img src="${c.foto}" alt="Ticket" class="w-full h-full object-cover"></button>
          <div class="flex-1 min-w-0"><div class="flex justify-between gap-2"><span class="text-sm font-semibold">${esc(c.detalle)}</span><span class="money whitespace-nowrap">${A.money(c.monto)}</span></div>
            <div class="flex flex-wrap gap-2 items-center mt-1">${chip[c.estado] || ''}<span class="text-[11px] text-on-surface-variant">${esc(c.fecha)}</span></div>
            ${rol === 'cliente' && activo && c.estado === 'pendiente' ? `<div class="flex gap-2 mt-2"><button class="btn-success btn-sm" data-action="compra-estado" data-s="${s.id}" data-c="${c.id}" data-v="aprobada">${A.icon('check')} Aprobar y pagar</button><button class="btn-ghost btn-sm" data-action="compra-estado" data-s="${s.id}" data-c="${c.id}" data-v="observada">Observar</button></div>` : ''}
            ${rol === 'cliente' && activo && c.estado === 'aprobada' ? `<button class="btn-primary btn-sm mt-2" data-action="compra-pagar" data-s="${s.id}" data-c="${c.id}">${A.icon('account_balance')} Pagar ticket · ${A.money(A.precio(e, c.monto, 'materiales'))}</button>` : ''}
            ${rol === 'prestador' && c.estado === 'aprobada' ? '<div class="text-[11px] text-amber-700 mt-1">Aprobada: esperando que el cliente la pague.</div>' : ''}
          </div></div>`).join('')}</div>` : ''}
      ${rol === 'prestador' && activo ? `<div class="mt-4 border-t border-outline-variant/60 pt-4 space-y-3">
        <div class="font-head text-xs font-bold uppercase">Declarar una compra</div>
        <div class="grid sm:grid-cols-[1fr_140px] gap-2">
          <input class="inp" data-model="compra.${s.id}.detalle" value="${esc(f.detalle)}" placeholder="Qué compraste (ej. 25 m de cable 4 mm)">
          <label class="flex items-center bg-white border border-slate-400"><span class="px-2 font-head">$</span><input type="number" min="0" step="100" class="w-full py-2 pr-2 outline-none font-head font-semibold text-right tnum" data-model="compra.${s.id}.monto" value="${esc(f.monto)}" placeholder="Monto"></label>
        </div>
        ${A.uploader('compra.' + s.id + '.foto', 'ticket', 'Foto del ticket (obligatoria)')}
        ${f.foto.length ? A.gallery(f.foto, { removable: 'remove-photo" data-target="compra.' + s.id + '.foto', label: 'TICKET', cols: 'grid-cols-3' }) : ''}
        <button class="btn-primary btn-sm" data-action="compra-add" data-s="${s.id}">${A.icon('add')} Declarar compra</button>
      </div>` : ''}
    </div>`;
  }

  /* =================== AJUSTE DE PRECIO TRAS LA ACEPTACIÓN + RESCISIÓN =================== */
  function ajusteCard(s, rol) {
    if (rol !== 'cliente' && rol !== 'prestador') {
      return s.ajuste && s.ajuste.estado !== 'descartado' ? `<div class="card p-4 text-xs">${A.icon('price_change', '!text-base')} Ajuste de precio: ${A.money(s.ajuste.actual)} → ${A.money(s.ajuste.propuesto)} · <b>${s.ajuste.estado.replace('_', ' ')}</b></div>` : '';
    }
    if (s.estado !== 'en_curso') return '';
    const a = s.ajuste; const otro = rol === 'cliente' ? 'el prestador' : 'el cliente';
    const esP = rol === 'prestador'; const actualRol = esP ? s.escrow.neto : s.escrow.total;
    const va = a ? (esP ? a.actualNeto ?? a.actual : a.actual) : 0; const vp = a ? (esP ? a.propuestoNeto ?? a.propuesto : a.propuesto) : 0;
    const f = (A.ui.ajuste = A.ui.ajuste || {})[s.id];
    const box = (inner, color = 'border-amber-600') => `<div class="card border-2 ${color} p-4 md:p-5 space-y-3"><div class="font-head font-bold flex items-center gap-2">${A.icon('price_change', 'text-amber-700')} Ajuste de precio del presupuesto</div>${inner}</div>`;
    if (f) {
      return box(`<p class="text-xs text-on-surface-variant">Proponé un nuevo total. Si ${otro} acepta, la diferencia se aplica a las etapas que faltan pagar. Si ya están todas pagadas, se cobra o se reembolsa la diferencia en el momento. Si lo rechaza, cualquiera de los dos puede rechazar el trabajo.</p>
        <div class="flex justify-between text-sm"><span>${esP ? 'Tu total actual a cobrar' : 'Total actual del trabajo'}</span><b class="money">${A.money(actualRol)}</b></div>
        <div><label class="lbl">${esP ? 'Nuevo total que cobrarías' : 'Nuevo total del trabajo'}</label><label class="flex items-center bg-white border border-slate-400"><span class="px-2 font-head">$</span><input type="number" min="1" step="500" class="w-full py-2 pr-2 outline-none font-head font-semibold tnum" data-model="ajuste.${s.id}.monto" value="${esc(f.monto)}"></label></div>
        <div><label class="lbl">Motivo</label><textarea rows="3" class="inp" data-model="ajuste.${s.id}.motivo" placeholder="Ej. Al desarmar apareció un segundo tramo dañado que no estaba a la vista.">${esc(f.motivo)}</textarea></div>
        <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="aj-cancel" data-s="${s.id}">Cancelar</button><button class="btn-primary flex-1" data-action="aj-submit" data-s="${s.id}">Enviar propuesta</button></div>`);
    }
    if (a && a.estado === 'pendiente') {
      const mio = a.por === rol;
      return box(`<div class="text-sm">${mio ? 'Propusiste' : `${a.por === 'cliente' ? 'El cliente' : 'El prestador'} propone`} cambiar el total de <b>${A.money(va)}</b> a <b>${A.money(vp)}</b> (${vp > va ? '+' : ''}${A.money(vp - va)}).</div>
        <p class="text-xs bg-surface-container-low border border-outline-variant/60 p-2"><b>Motivo:</b> ${esc(a.motivo)}</p>
        ${mio ? `<div class="text-xs text-on-surface-variant">Esperando la respuesta de ${otro}.</div>`
          : `<div class="flex gap-2"><button class="btn-ghost flex-1" data-action="aj-rechazar" data-s="${s.id}">Rechazar</button><button class="btn-success flex-1" data-action="aj-aceptar" data-s="${s.id}">Aceptar ajuste</button></div>`}`);
    }
    if (a && a.estado === 'pago_pendiente') {
      return box(`<div class="text-sm">Ajuste aceptado: el total pasa a <b>${A.money(vp)}</b>. Como todas las etapas ya están pagadas, la diferencia se paga ahora.</div>
        ${rol === 'cliente' ? `<button class="btn-primary w-full" data-action="aj-pagar" data-s="${s.id}">${A.icon('account_balance')} Pagar diferencia de ${A.money(a.difCliente)}</button>` : `<div class="text-xs text-on-surface-variant">Esperando que el cliente pague la diferencia (cobrás ${A.money(a.difNeto)}).</div>`}`);
    }
    if (a && a.estado === 'rechazado') {
      return box(`<div class="text-sm">El ajuste a <b>${A.money(vp)}</b> fue <b class="text-red-600">rechazado</b> por ${a.respondio === 'cliente' ? 'el cliente' : 'el prestador'}.</div>
        <p class="text-xs text-on-surface-variant">Pueden seguir con el precio original o cualquiera de los dos puede rechazar el trabajo. Si hay una etapa pagada en curso, la rescisión puede pasar a arbitraje.</p>
        <div class="flex flex-col gap-2"><button class="btn-ghost w-full" data-action="aj-descartar" data-s="${s.id}">Continuar con el precio original (${A.money(actualRol)})</button>
        <button class="btn-danger w-full" data-action="rescindir" data-s="${s.id}">${A.icon('cancel')} Rechazar el trabajo</button></div>`, 'border-red-500');
    }
    const ultimo = a && a.estado === 'aceptado' ? `<div class="text-[11px] text-tertiary">Último ajuste aceptado: ${A.money(va)} → ${A.money(vp)}.</div>` : '';
    return `<div class="card p-4 md:p-5 space-y-2">
      <div class="font-head font-bold flex items-center gap-2">${A.icon('price_change', 'text-amber-700')} ¿Desacuerdo con el precio?</div>
      <p class="text-xs text-on-surface-variant">Después de aceptado el presupuesto, cualquiera de las partes puede proponer un ajuste de precio. Si no hay acuerdo, se puede rechazar el trabajo.</p>
      ${ultimo}
      <button class="btn-ghost w-full" data-action="aj-open" data-s="${s.id}">${A.icon('edit')} Proponer ajuste de precio</button></div>`;
  }

  /* =================== CALIFICACIÓN Y COMENTARIOS POST-PAGO =================== */
  function resenaCard(s, rol) {
    if (s.estado !== 'completada' && s.estado !== 'resuelta') return '';
    const r = s.resena; const pr = A.user(s.asignada.prestadorId); const cl = A.user(s.clienteId);
    if (!r) {
      if (rol !== 'cliente') return `<div class="card card-pad text-sm text-on-surface-variant">${A.icon('star', 'text-outline')} El cliente todavía no calificó este servicio.</div>`;
      const f = ((A.ui.res = A.ui.res || {})[s.id] = A.ui.res[s.id] || { estrellas: 0, comentario: '' });
      return `<div class="card border-2 border-amber-500 card-pad space-y-3">
        <div class="sec-title">${A.icon('star', 'text-amber-500 ms-fill')} Calificá el servicio de ${esc(pr.nombre)}</div>
        <p class="text-xs text-on-surface-variant">El trabajo ya se cerró. Tu opinión ayuda a otros clientes. Después vas a poder sumar comentarios en cualquier momento (por ejemplo, si al mes aparece un problema).</p>
        <div class="flex gap-1">${[1, 2, 3, 4, 5].map((n) => `<button class="text-4xl leading-none ${n <= f.estrellas ? 'text-amber-500' : 'text-slate-300'} hover:text-amber-400" data-action="res-star" data-s="${s.id}" data-v="${n}" aria-label="${n} estrellas">★</button>`).join('')}</div>
        <textarea rows="3" class="inp" data-model="res.${s.id}.comentario" placeholder="¿Cómo fue el trabajo, la puntualidad y la limpieza?">${esc(f.comentario)}</textarea>
        <button class="btn-primary" data-action="res-submit" data-s="${s.id}">${A.icon('send')} Publicar calificación</button></div>`;
    }
    const g = ((A.ui.seg = A.ui.seg || {})[s.id] = A.ui.seg[s.id] || { texto: '', fotos: [] });
    const puede = rol === 'cliente' || rol === 'prestador';
    return `<div class="card card-pad space-y-3">
      <div class="flex flex-wrap justify-between items-center gap-2"><div class="sec-title">${A.icon('reviews')} Calificación del servicio</div><span class="text-[11px] text-on-surface-variant">${esc(r.fecha)}</span></div>
      <div class="flex items-center gap-3">${A.stars(r.estrellas, 'text-2xl')}<span class="font-head font-bold">${r.estrellas}/5</span></div>
      <p class="text-sm bg-surface-container-low border-l-4 border-amber-500 p-3">“${esc(r.comentario)}”<br><span class="text-[11px] text-on-surface-variant">— ${esc(A.fullName(cl))}</span></p>
      <div class="lbl !mt-4">Comentarios posteriores (${(r.seguimientos || []).length})</div>
      ${(r.seguimientos || []).length ? `<ol class="space-y-2">${r.seguimientos.map((c) => `<li class="border ${c.autor === 'cliente' ? 'border-outline-variant bg-white' : 'border-primary-container/40 bg-blue-50 ml-4 md:ml-8'} p-3">
          <div class="flex justify-between gap-2 text-[11px] font-head"><b class="uppercase">${c.autor === 'cliente' ? esc(A.fullName(cl)) + ' (cliente)' : esc(A.fullName(pr)) + ' (prestador)'}</b><span class="text-on-surface-variant">${esc(c.fecha)}</span></div>
          <div class="text-sm mt-1 whitespace-pre-line">${esc(c.texto)}</div>
          ${c.fotos && c.fotos.length ? `<div class="mt-2">${A.gallery(c.fotos, { cols: 'grid-cols-4', label: 'FOTO' })}</div>` : ''}</li>`).join('')}</ol>`
        : '<div class="text-xs text-on-surface-variant">Sin comentarios posteriores.</div>'}
      ${puede ? `<div class="border-t border-outline-variant/60 pt-3 space-y-2">
        <label class="lbl">${rol === 'cliente' ? 'Agregar un comentario posterior (ej. “a un mes, se brotó la pintura”)' : 'Responder al cliente'}</label>
        <textarea rows="2" class="inp" data-model="seg.${s.id}.texto" placeholder="${rol === 'cliente' ? 'Contá cómo sigue el trabajo con el paso del tiempo' : 'Ej. Paso el jueves a revisarlo, está cubierto por la garantía'}">${esc(g.texto)}</textarea>
        ${rol === 'cliente' ? A.uploader('seg.' + s.id + '.fotos', 'resena', 'Adjuntar fotos') + (g.fotos.length ? A.gallery(g.fotos, { removable: 'remove-photo" data-target="seg.' + s.id + '.fotos', cols: 'grid-cols-4', label: 'NUEVA' }) : '') : ''}
        <button class="btn-ghost btn-sm" data-action="seg-submit" data-s="${s.id}">${A.icon('add_comment')} Publicar comentario</button></div>` : ''}
    </div>`;
  }

  /* ---------- Acciones: compras ---------- */
  A.actions['compra-add'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.compra[s.id];
    if (!f.detalle || f.detalle.trim().length < 3) { A.toast('Indicá qué compraste.', 'err'); return; }
    if (!(Number(f.monto) > 0)) { A.toast('Declará el monto de la compra.', 'err'); return; }
    if (!f.foto.length) { A.toast('Adjuntá la foto del ticket: es obligatoria.', 'err'); return; }
    s.compras = s.compras || [];
    s.compras.push({ id: A.nextId('C'), detalle: f.detalle.trim(), monto: Number(f.monto), foto: f.foto[f.foto.length - 1], fecha: A.now(), estado: 'pendiente' });
    A.ui.compra[s.id] = { detalle: '', monto: '', foto: [] };
    A.commit('Compra declarada con ticket. El cliente fue notificado para aprobarla y pagarla.', 'ok');
  };
  A.actions['compra-estado'] = (el) => {
    const s = A.sol(el.dataset.s); const c = s.compras.find((x) => x.id === el.dataset.c); c.estado = el.dataset.v;
    if (c.estado !== 'aprobada') { A.commit('Compra observada. El prestador fue notificado.', 'info'); return; }
    A.save(); A.rerender();
    A.actions['compra-pagar'](el);
  };
  A.actions['compra-pagar'] = (el) => {
    const s = A.sol(el.dataset.s); const c = s.compras.find((x) => x.id === el.dataset.c);
    const precio = A.precio(s.escrow, c.monto, 'materiales');
    A.checkout({ intro: 'Pagás el <b>ticket de materiales</b> que aprobaste. El pago se acredita en el momento en la cuenta de Mercado Pago del prestador.',
      lineas: [['Servicio', '#' + s.id], [esc(c.detalle), A.money(c.monto)], ['Cargos del servicio y del medio de pago', A.money(precio - c.monto)]],
      total: precio, action: 'compra-pagar-ok', data: { s: s.id, c: c.id } });
  };
  A.actions['compra-pagar-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const c = s.compras.find((x) => x.id === el.dataset.c);
    if (c.estado === 'pagada') { A.closeModal(); return; }
    const precio = A.precio(s.escrow, c.monto, 'materiales');
    A.cobrar(s, { concepto: `Pago de materiales (ticket ${c.id})`, ref: 'compra:' + c.id, cliente: precio, neto: c.monto });
    c.estado = 'pagada';
    A.hist(s, 'pago', `Ticket ${c.id} aprobado y pagado por el cliente (${A.money(c.monto)} al prestador)`, s.asignada.prestadorId);
    A.closeModal(); A.commit(`Ticket pagado. Se acreditaron <b>${A.money(c.monto)}</b> al prestador.`, 'ok');
  };

  /* ---------- Acciones: ajuste de precio ---------- */
  const rolDe = (s) => (s.clienteId === A.me().id ? 'cliente' : 'prestador');
  const pagosManoObra = (s) => s.escrow.pagos.filter((p) => p.ref === 'ajuste' || (p.ref || '').indexOf('etapa:') === 0);
  A.actions['aj-open'] = (el) => { const s = A.sol(el.dataset.s); (A.ui.ajuste = A.ui.ajuste || {})[s.id] = { monto: String(rolDe(s) === 'prestador' ? s.escrow.neto : s.escrow.total), motivo: '' }; A.rerender(); };
  A.actions['aj-cancel'] = (el) => { delete A.ui.ajuste[el.dataset.s]; A.rerender(); };
  A.actions['aj-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.ajuste[s.id]; const m = Number(f.monto); const e = s.escrow;
    const rol = rolDe(s);
    // El prestador propone lo que cobraría; el cliente, el total que pagaría. La diferencia se convierte con la tasa del trabajo.
    let propuestoNeto, propuesto;
    if (rol === 'prestador') { const dn = m - e.neto; propuestoNeto = m; propuesto = e.total + A.precio(e, dn, 'etapa'); }
    else { const dg = m - e.total; const dn = A.netoDesde(e, dg, 'etapa'); propuesto = m; propuestoNeto = e.neto + dn; }
    if (!(m > 0) || propuesto === e.total) { A.toast('Indicá un total distinto del actual.', 'err'); return; }
    const aprobado = s.hitos.reduce((a, h, i) => a + (h.estado === 'completado' ? A.montoEtapa(s, i) : 0), 0);
    if (propuestoNeto < aprobado) { A.toast('El nuevo total no puede ser menor a lo de las etapas ya aprobadas.', 'err'); return; }
    if (!f.motivo || f.motivo.trim().length < 10) { A.toast('Explicá el motivo (mín. 10 caracteres).', 'err'); return; }
    s.ajuste = { id: A.nextId('AJ'), por: rol, actual: e.total, propuesto, actualNeto: e.neto, propuestoNeto, motivo: f.motivo.trim(), estado: 'pendiente', fecha: A.now() };
    delete A.ui.ajuste[s.id];
    A.commit('Propuesta de ajuste enviada. La contraparte fue notificada por email.', 'ok');
  };
  A.actions['aj-aceptar'] = (el) => {
    const s = A.sol(el.dataset.s); const a = s.ajuste; const e = s.escrow; const rol = rolDe(s);
    a.respondio = rol;
    // La diferencia se aplica a las etapas que faltan pagar (un aumento, a la última; una rebaja, desde la última hacia atrás)
    let resto = a.propuestoNeto - e.neto;
    const sinPagar = s.hitos.map((h, i) => i).filter((i) => !s.hitos[i].pagado);
    if (sinPagar.length && resto > 0) { const i = sinPagar[sinPagar.length - 1]; s.hitos[i].ajuste = (s.hitos[i].ajuste || 0) + resto; resto = 0; }
    if (sinPagar.length && resto < 0) {
      sinPagar.slice().reverse().forEach((i) => { if (!resto) return; const q = Math.min(A.montoEtapa(s, i), -resto); s.hitos[i].ajuste = (s.hitos[i].ajuste || 0) - q; resto += q; });
    }
    if (resto > 0) {
      a.difNeto = resto; a.difCliente = A.precio(e, resto, 'ajuste'); a.estado = 'pago_pendiente'; A.recalcTrabajo(s); A.save();
      if (rol === 'cliente') A.actions['aj-pagar'](el); else A.commit('Ajuste aceptado. Como las etapas ya están pagadas, el cliente debe pagar la diferencia.', 'ok');
      return;
    }
    let msg;
    if (resto < 0) {
      const monto = A.precio(e, -resto, 'etapa');
      const r = A.reembolsar(s, pagosManoObra(s), monto, 'Reembolso parcial por ajuste de precio');
      e.extraNeto = (e.extraNeto || 0) + resto; e.extraCliente = (e.extraCliente || 0) - r.total;
      msg = rol === 'prestador' ? `Ajuste aceptado. Se reembolsaron ${A.money(r.total)} al cliente (Mercado Pago los descuenta de tu cuenta).` : `Ajuste aceptado. Se te reembolsaron ${A.money(r.total)}.`;
    } else {
      msg = rol === 'prestador' ? `Ajuste aceptado. Tu nuevo total a cobrar es ${A.money(a.propuestoNeto)}: se aplica a las etapas que faltan pagar.` : 'Ajuste aceptado: se aplica a las etapas que faltan pagar.';
    }
    a.estado = 'aceptado'; A.recalcTrabajo(s);
    A.hist(s, 'pago', `Ajuste de precio aceptado: ${A.money(a.actual)} → ${A.money(a.propuesto)}`, s.asignada.prestadorId);
    A.commit(msg, 'ok');
  };
  A.actions['aj-pagar'] = (el) => {
    const s = A.sol(el.dataset.s); const a = s.ajuste;
    A.rerender();
    A.checkout({ intro: 'Pagás la <b>diferencia por el ajuste de precio</b> aceptado. Se acredita en la cuenta de Mercado Pago del prestador.',
      lineas: [['Servicio', '#' + s.id], ['Total anterior', A.money(a.actual)], ['Nuevo total', A.money(a.propuesto)]], total: a.difCliente, action: 'aj-pagar-ok', data: { s: s.id } });
  };
  A.actions['aj-pagar-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const e = s.escrow; const a = s.ajuste;
    if (a.estado !== 'pago_pendiente') { A.closeModal(); return; }
    A.cobrar(s, { concepto: 'Pago de diferencia por ajuste de precio', ref: 'ajuste', cliente: a.difCliente, neto: a.difNeto });
    e.extraNeto = (e.extraNeto || 0) + a.difNeto; e.extraCliente = (e.extraCliente || 0) + a.difCliente; A.recalcTrabajo(s); a.estado = 'aceptado';
    A.hist(s, 'pago', `Ajuste de precio pagado: ${A.money(a.actual)} → ${A.money(a.propuesto)}`, s.asignada.prestadorId);
    A.closeModal(); A.commit(`Diferencia pagada (${A.money(a.difCliente)}). Nuevo total del trabajo: ${A.money(e.total)}.`, 'ok');
  };
  A.actions['aj-rechazar'] = (el) => { const s = A.sol(el.dataset.s); s.ajuste.estado = 'rechazado'; s.ajuste.respondio = rolDe(s); A.commit('Rechazaste el ajuste de precio.', 'info'); };
  A.actions['aj-descartar'] = (el) => { const s = A.sol(el.dataset.s); s.ajuste.estado = 'descartado'; A.commit('Se continúa con el precio original.', 'ok'); };
  /* Rescisión: si hay una etapa pagada en curso, el prestador que rescinde la reembolsa; si rescinde el cliente (o hay una etapa
     terminada sin aprobar) decide un árbitro. Sin etapa pagada en curso, se cancelan las etapas sin pagar y no hay movimientos. */
  const planRescision = (s, rol) => {
    const hechos = s.hitos.filter((h) => h.estado === 'por_aprobar').length; const enJ = A.enJuego(s);
    if (hechos || (enJ && rol === 'cliente')) return 'arbitraje';
    return enJ ? 'reembolso' : 'cancelar';
  };
  A.actions.rescindir = (el) => {
    const s = A.sol(el.dataset.s); const rol = rolDe(s); const plan = planRescision(s, rol); const enJ = A.enJuego(s);
    const txt = {
      arbitraje: `Hay una etapa <b>pagada en curso${s.hitos.some((h) => h.estado === 'por_aprobar') ? ' o terminada sin aprobar' : ''}</b>. La rescisión pasa a <b>mediación</b> (y, si no hay acuerdo, a un árbitro) para definir si se reembolsa el pago de esa etapa (${A.money(enJ)}).`,
      reembolso: `Se le reembolsa al cliente el pago de la etapa en curso (${A.money(enJ)}): Mercado Pago lo descuenta de tu cuenta. Las etapas sin pagar se cancelan.`,
      cancelar: 'No hay ninguna etapa pagada en curso: las etapas sin pagar se cancelan y no hay movimientos de dinero. Lo pagado por etapas aprobadas y materiales queda para el prestador.',
    }[plan];
    A.modal(`<div class="p-5 space-y-3">
      <div class="font-head font-bold text-lg flex items-center gap-2 text-red-600">${A.icon('cancel')} Rechazar el trabajo</div>
      <p class="text-sm">${txt}</p>
      <div><label class="lbl">Motivo</label><textarea rows="2" class="inp" data-model="resc.motivo" placeholder="Ej. No hubo acuerdo sobre el nuevo precio.">${esc(A.val('resc.motivo'))}</textarea></div>
      <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="close-modal">Volver</button><button class="btn-danger flex-1 !bg-red-600 !text-white" data-action="rescindir-ok" data-s="${s.id}">Confirmar rechazo</button></div></div>`);
  };
  A.actions['rescindir-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const e = s.escrow; const rol = rolDe(s); const plan = planRescision(s, rol);
    const motivo = (A.val('resc.motivo') || 'Rechazo del trabajo tras desacuerdo de precio.').trim();
    s.ajuste.estado = 'rescindido'; s.rescision = { por: rol, fecha: A.now(), motivo };
    A.closeModal(); A.ui.resc = {};
    if (plan === 'arbitraje') {
      A.abrirDisputa(s, { abiertaPor: rol, motivo: 'Rescisión tras desacuerdo de precio', cliente: rol === 'cliente' ? motivo : '', prestador: rol === 'prestador' ? motivo : '' });
      A.commit(`Trabajo rechazado con una etapa en curso: se abrió el caso <b>${s.disputa.id}</b> (mediación y, si no hay acuerdo, arbitraje).`, 'info');
      return;
    }
    let msg = 'Trabajo rechazado. Las etapas sin pagar se cancelaron.';
    if (plan === 'reembolso') { const r = A.reembolsar(s, A.pagosEnJuego(s), A.enJuego(s), 'Reembolso de la etapa en curso por rescisión'); msg = `Trabajo rechazado. Se reembolsaron ${A.money(r.total)} al cliente.`; }
    s.estado = 'cancelada'; e.estado = 'cancelado';
    A.hist(s, 'contacto', `Trabajo rescindido por el ${rol}`);
    A.commit(msg, 'info');
  };

  /* ---------- Acciones: mediación ---------- */
  A.actions['med-prop-open'] = (el) => { (A.ui.prop = A.ui.prop || {})[el.dataset.s] = { tipo: 'corregir', plazo: String(A.cfg('plazoCorreccion', 5)), monto: '', nota: '' }; A.rerender(); };
  A.actions['med-prop-cancel'] = (el) => { delete A.ui.prop[el.dataset.s]; A.rerender(); };
  A.actions['med-prop-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.prop[s.id]; const enJ = A.enJuego(s);
    const p = { id: A.nextId('PR'), por: rolDe(s), tipo: f.tipo, plazo: Number(f.plazo) || 0, monto: Number(f.monto) || 0, nota: (f.nota || '').trim(), estado: 'pendiente', fecha: A.now() };
    if (p.tipo === 'corregir' && !(p.plazo >= 1 && p.plazo <= 30)) { A.toast('Indicá un plazo de 1 a 30 días.', 'err'); return; }
    if (p.tipo === 'parcial' && !(p.monto > 0 && p.monto < enJ)) { A.toast(`El reembolso parcial tiene que ser mayor a 0 y menor a ${A.money(enJ)}.`, 'err'); return; }
    s.disputa.propuestas.forEach((x) => { if (x.estado === 'pendiente' && x.por === p.por) x.estado = 'reemplazada'; });
    s.disputa.propuestas.push(p); delete A.ui.prop[s.id];
    A.hist(s, 'contacto', `Propuesta de acuerdo del ${p.por}: ${textoProp(p)}`);
    A.commit('Propuesta enviada. La otra parte fue notificada por email.', 'ok');
  };
  A.actions['med-rechazar'] = (el) => {
    const s = A.sol(el.dataset.s); const p = s.disputa.propuestas.find((x) => x.id === el.dataset.p); p.estado = 'rechazada';
    A.hist(s, 'contacto', `Propuesta rechazada: ${textoProp(p)}`);
    A.commit('Rechazaste la propuesta. Pueden proponer otra o esperar al árbitro.', 'info');
  };
  A.actions['med-aceptar'] = (el) => {
    const s = A.sol(el.dataset.s); const p = s.disputa.propuestas.find((x) => x.id === el.dataset.p);
    const plan = A.planResolucion(s, p.tipo, { monto: p.monto, plazo: p.plazo, nota: p.nota });
    p.estado = 'aceptada';
    A.ejecutarResolucion(s, plan, 'acuerdo', false);
    A.commit(`Acuerdo aceptado: <b>${plan.titulo}</b>.`, 'ok');
  };
  A.actions['med-escalar'] = (el) => { const s = A.sol(el.dataset.s); A.escalarArbitraje(s, `lo pidió el ${rolDe(s)}`); A.commit('El caso pasó a un árbitro.', 'info'); };
  A.actions['demo-med-vencer'] = (el) => {
    const s = A.sol(el.dataset.s); s.disputa.venceMediacion = A.fmtISO(new Date(Date.now() - 60000)); A.checkPlazos();
    A.commit('Venció la mediación sin acuerdo: el caso pasó a un árbitro.', 'info');
  };
  A.actions['demo-correccion-vencer'] = (el) => {
    const s = A.sol(el.dataset.s); s.correccion.vence = A.fmtISO(new Date(Date.now() - 60000)); A.checkPlazos();
    A.commit('Venció el plazo de corrección: se reembolsó la etapa al cliente.', 'info');
  };

  /* ---------- Acciones: reclamo por garantía ---------- */
  A.actions['rec-open'] = (el) => { (A.ui.rec = A.ui.rec || {})[el.dataset.s] = { texto: '', fotos: [] }; A.rerender(); };
  A.actions['rec-cancel'] = (el) => { delete A.ui.rec[el.dataset.s]; A.rerender(); };
  A.actions['rec-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.rec[s.id];
    if (!f.texto || f.texto.trim().length < 10) { A.toast('Contá qué falla apareció (mín. 10 caracteres).', 'err'); return; }
    s.reclamo = { id: A.nextId('GAR'), fecha: A.now(), texto: f.texto.trim(), fotos: f.fotos.slice(), estado: 'abierto', respuestas: [] };
    delete A.ui.rec[s.id];
    A.hist(s, 'contacto', 'Reclamo por garantía iniciado por el cliente', s.asignada.prestadorId);
    A.commit('Reclamo enviado. El prestador fue notificado por email.', 'ok');
  };
  A.actions['rec-modo'] = (el) => { (A.ui.recOf = A.ui.recOf || {})[el.dataset.s] = { modo: el.dataset.v, texto: '', monto: '' }; A.rerender(); };
  A.actions['rec-of-cancel'] = (el) => { delete A.ui.recOf[el.dataset.s]; A.rerender(); };
  A.actions['rec-responder'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.recOf[s.id]; const r = s.reclamo;
    if (!f.texto || f.texto.trim().length < 5) { A.toast('Escribí tu respuesta.', 'err'); return; }
    if (f.modo === 'reembolso' && !(Number(f.monto) > 0)) { A.toast('Indicá el monto del reembolso.', 'err'); return; }
    r.respuestas.push({ autor: 'prestador', texto: f.texto.trim(), fecha: A.now() });
    r.estado = { corregir: 'en_correccion', reembolso: 'oferta', rechazar: 'rechazado' }[f.modo];
    if (f.modo === 'reembolso') r.oferta = Number(f.monto);
    delete A.ui.recOf[s.id];
    A.hist(s, 'contacto', `Respuesta del prestador al reclamo por garantía: ${{ corregir: 'acepta corregirlo', reembolso: `ofrece un reembolso de ${A.money(r.oferta)}`, rechazar: 'lo rechaza' }[f.modo]}`, s.asignada.prestadorId);
    A.commit('Respuesta enviada. El cliente fue notificado.', 'ok');
  };
  A.actions['rec-aceptar-oferta'] = (el) => {
    const s = A.sol(el.dataset.s); const r = s.reclamo;
    const res = A.reembolsar(s, pagosManoObra(s), r.oferta, 'Reembolso acordado por reclamo de garantía', false);
    r.estado = 'reembolsado'; r.respuestas.push({ autor: 'cliente', texto: `Acepto el reembolso de ${A.money(res.total)}.`, fecha: A.now() });
    A.hist(s, 'pago', `Reclamo por garantía resuelto con un reembolso acordado de ${A.money(res.total)}`, s.asignada.prestadorId);
    A.commit(`Se te reembolsaron ${A.money(res.total)}.`, 'ok');
  };
  A.actions['rec-cerrar'] = (el) => {
    const s = A.sol(el.dataset.s); const r = s.reclamo; r.estado = el.dataset.v;
    A.hist(s, 'contacto', `Reclamo por garantía cerrado: ${r.estado === 'resuelto' ? 'resuelto' : 'sin resolver (impacta en la reputación del prestador)'}`, s.asignada.prestadorId);
    A.commit(r.estado === 'resuelto' ? 'Reclamo cerrado como resuelto.' : 'Reclamo cerrado sin resolver. Quedó registrado en la reputación del prestador.', 'info');
  };

  /* ---------- Acciones: reclamos en Mercado Pago (demo) ---------- */
  A.actions['mprec-nuevo'] = (el) => {
    const s = A.sol(el.dataset.s);
    const p = s.escrow.pagos.slice().reverse().find((x) => x.cliente - x.reembolsado > 0);
    if (!p) { A.toast('No hay pagos sin reembolsar.', 'err'); return; }
    (s.reclamosMP = s.reclamosMP || []).push({ id: A.nextId('MPR'), tipo: el.dataset.t, pagoId: p.id, monto: p.cliente - p.reembolsado, fecha: A.now(), estado: 'en_revision' });
    A.mov(`${el.dataset.t} en Mercado Pago`, s.id, p.cliente - p.reembolsado, `Notificación de Mercado Pago sobre el pago ${p.id} → OficiosYa envía el expediente como evidencia`);
    A.hist(s, 'contacto', `${el.dataset.t} del cliente en Mercado Pago sobre el pago ${p.id}: se envió el expediente como evidencia`);
    A.commit(`${el.dataset.t} registrado. Se envió el expediente a Mercado Pago.`, 'info');
  };
  A.actions['mprec-fallo'] = (el) => {
    const s = A.sol(el.dataset.s); const r = s.reclamosMP.find((x) => x.id === el.dataset.r); r.estado = el.dataset.v;
    if (r.estado === 'a_favor_cliente') {
      const p = s.escrow.pagos.find((x) => x.id === r.pagoId);
      A.reembolsar(s, [p], r.monto, `Devolución ordenada por Mercado Pago (${r.tipo.toLowerCase()})`, false);
      const res = s.disputa && s.disputa.resolucion; r.contraFallo = !!(res && res.tipo === 'forzosa');
    }
    A.hist(s, 'contacto', `Mercado Pago resolvió el ${r.tipo.toLowerCase()} ${r.estado === 'a_favor_cliente' ? 'a favor del cliente: se le descontó el monto al prestador' : 'a favor del prestador'}`);
    A.commit('Resultado de Mercado Pago registrado.', 'info');
  };

  /* ---------- Acciones: calificación ---------- */
  A.actions['res-star'] = (el) => { A.ui.res[el.dataset.s].estrellas = +el.dataset.v; A.rerender(); };
  A.actions['res-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const f = A.ui.res[s.id];
    if (!f.estrellas) { A.toast('Elegí de 1 a 5 estrellas.', 'err'); return; }
    if (!f.comentario || f.comentario.trim().length < 5) { A.toast('Escribí un comentario breve.', 'err'); return; }
    s.resena = { estrellas: f.estrellas, comentario: f.comentario.trim(), fecha: A.now(), seguimientos: [] };
    const pr = A.user(s.asignada.prestadorId);
    const n = pr.trabajos || 0; pr.rating = Math.round((((pr.rating || f.estrellas) * n + f.estrellas) / (n + 1)) * 100) / 100; pr.trabajos = n + 1;
    delete A.ui.res[s.id];
    A.commit('¡Gracias! Tu calificación fue publicada.', 'ok');
  };
  A.actions['seg-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const g = A.ui.seg[s.id];
    if (!g.texto || g.texto.trim().length < 5) { A.toast('Escribí el comentario.', 'err'); return; }
    s.resena.seguimientos.push({ autor: rolDe(s), fecha: A.now(), texto: g.texto.trim(), fotos: g.fotos.slice() });
    A.ui.seg[s.id] = { texto: '', fotos: [] };
    A.commit('Comentario publicado. La otra parte fue notificada por email.', 'ok');
  };

  /* =================== ACCIONES =================== */

  /* Pago de una etapa antes de que empiece (split: se acredita en la cuenta MP del prestador) */
  A.actions['etapa-pagar'] = (el) => {
    const s = A.sol(el.dataset.s); const i = +el.dataset.i; const h = s.hitos[i];
    const precio = A.precio(s.escrow, A.montoEtapa(s, i), 'etapa');
    A.checkout({ intro: `Pagás la <b>etapa ${i + 1}</b> antes de que empiece. El pago se acredita en el momento en la cuenta de Mercado Pago del prestador.`,
      lineas: [['Servicio', '#' + s.id], ['Prestador', esc(A.fullName(A.user(s.asignada.prestadorId)))], [`Etapa ${i + 1}: ${esc(h.nombre)}`, A.money(precio)]],
      total: precio, action: 'etapa-pagar-ok', data: { s: s.id, i } });
  };
  A.actions['etapa-pagar-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const i = +el.dataset.i; const h = s.hitos[i];
    if (h.pagado) { A.closeModal(); return; }
    const neto = A.montoEtapa(s, i); const precio = A.precio(s.escrow, neto, 'etapa');
    if (neto > 0) A.cobrar(s, { concepto: `Pago de etapa ${i + 1}`, ref: 'etapa:' + i, cliente: precio, neto });
    h.pagado = true;
    A.hist(s, 'pago', `Etapa ${i + 1} (“${h.nombre}”) pagada por el cliente: se acreditó en la cuenta del prestador`, s.asignada.prestadorId);
    A.closeModal(); A.commit(`Pagaste la etapa ${i + 1} (${A.money(precio)}). El prestador ya puede empezarla.`, 'ok');
  };
  A.actions['hito-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const h = s.hitos[+el.dataset.i];
    h.estado = 'por_aprobar'; h.hora = A.shortNow(); h.observacion = ''; h.terminadaEn = A.now();
    if (s.correccion && !s.correccion.cumplida && s.correccion.hito === +el.dataset.i) { s.correccion.cumplida = true; A.hist(s, 'contacto', 'El prestador terminó la corrección en el plazo', s.asignada.prestadorId); }
    A.commit(`Etapa “${esc(h.nombre)}” terminada. El cliente fue notificado: si no la aprueba ni la observa en ${A.plazoAprob()} días, se aprueba automáticamente.`, 'ok');
  };
  A.actions['hito-aprobar'] = (el) => {
    const s = A.sol(el.dataset.s); const i = +el.dataset.i; const h = s.hitos[i];
    A.aprobarEtapa(s, i, false);
    if (s.estado === 'completada') { A.commit('Etapa final aprobada: el trabajo quedó cerrado.', 'ok'); return; }
    const sig = s.hitos[i + 1];
    if (sig && !sig.pagado) {
      A.commit('Etapa aprobada. Ahora pagá la etapa siguiente para que el prestador la empiece.', 'ok');
      A.actions['etapa-pagar']({ dataset: { s: s.id, i: String(i + 1) } });
    } else A.commit('Etapa aprobada.', 'ok');
  };
  A.actions['hito-obs'] = (el) => { A.ui.obsHito = el.dataset.s + '_' + el.dataset.i; A.ui.obsTexto = ''; A.rerender(); };
  A.actions['hito-obs-no'] = () => { A.ui.obsHito = null; A.rerender(); };
  A.actions['hito-obs-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const h = s.hitos[+el.dataset.i];
    if (!A.ui.obsTexto || A.ui.obsTexto.trim().length < 5) { A.toast('Escribí qué falta corregir.', 'err'); return; }
    h.estado = 'pendiente'; h.observacion = A.ui.obsTexto.trim(); h.terminadaEn = null; A.ui.obsHito = null;
    A.commit('Etapa observada. El prestador fue notificado y la etapa vuelve a "en ejecución".', 'info');
  };

  A.actions['evpost-save'] = (el) => {
    const s = A.sol(el.dataset.s);
    s.evidenciasPost = s.evidenciasPost.concat(A.ui.evpost[s.id]); A.ui.evpost[s.id] = [];
    A.commit('Evidencias post-trabajo adjuntadas al expediente.', 'ok');
  };

  /* Demo: simula que venció el plazo de aprobación de la etapa que espera aprobación */
  A.actions['demo-autoaprob'] = (el) => {
    const s = A.sol(el.dataset.s); const h = s.hitos.find((x) => x.estado === 'por_aprobar'); if (!h) return;
    h.terminadaEn = A.fmtISO(new Date(Date.now() - (A.plazoAprob() + 1) * 86400000));
    const n = A.checkAutoAprobacion();
    A.commit(n ? `Venció el plazo: la etapa “${esc(h.nombre)}” se aprobó automáticamente${s.estado === 'completada' ? ' y el trabajo quedó cerrado' : ''}.` : 'No había etapas para aprobar.', 'info');
  };

  A.actions['disp-open'] = (el) => {
    const s = A.sol(el.dataset.s); const me = A.me();
    const rol = s.clienteId === me.id ? 'cliente' : 'prestador';
    A.ui.disp = A.ui.disp || {};
    A.ui.disp[s.id] = { motivo: rol === 'cliente' ? 'Trabajo incompleto / parcial' : 'El cliente observa una etapa terminada sin motivo', declaracion: '', fotos: [] };
    A.rerender();
  };
  A.actions['disp-cancel'] = (el) => { delete A.ui.disp[el.dataset.s]; A.rerender(); };
  A.actions['disp-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const me = A.me(); const f = A.ui.disp[s.id];
    const rol = s.clienteId === me.id ? 'cliente' : 'prestador';
    if (!f.declaracion || f.declaracion.trim().length < 10) { f.err = true; A.rerender(); A.toast('Escribí una declaración (mín. 10 caracteres).', 'err'); return; }
    if (s.estado === 'en_curso') A.abrirDisputa(s, { abiertaPor: rol, motivo: f.motivo });
    const side = s.disputa[rol];
    side.declaracion = side.declaracion ? side.declaracion + '\n\n[' + A.shortNow() + '] ' + f.declaracion.trim() : f.declaracion.trim();
    side.fotos = side.fotos.concat(f.fotos);
    delete A.ui.disp[s.id];
    A.commit(`Caso <b>${s.disputa.id}</b> actualizado. ${s.disputa.fase === 'mediacion' ? 'La otra parte fue notificada: pueden proponer un acuerdo.' : 'El equipo de arbitraje fue notificado.'}`, 'ok');
  };
})();

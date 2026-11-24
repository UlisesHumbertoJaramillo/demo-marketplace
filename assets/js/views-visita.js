/* Visitas técnicas: confirmación (con confirmación automática), reprogramación, reclamo de "no vino" con descargo,
   mediación entre las partes y arbitraje. Lo usan la tarjeta de visita del cliente, el panel del prestador y el arbitraje. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {};
  const esc = A.esc;
  const TIPOS = { reembolso: 'Reembolsar la visita (el prestador no fue)', sin_reembolso: 'Sin reembolso (el cliente no estaba)', reprogramar: 'Reprogramar la visita' };
  const textoProp = (x) => (x.tipo === 'reprogramar' ? `Reprogramar: ${x.franja}` : TIPOS[x.tipo]);
  const vis = (s, pid) => s.postulaciones.find((x) => x.id === pid);
  const fecha = (f) => A.fmtFecha(A.parseFecha(f));

  /* Gestión de una visita pagada (estados visita_pagada y visita_reclamada). rol: 'cliente' | 'prestador' */
  A.visitaGestion = function (s, p, rol) {
    const v = p.visita; const otro = rol === 'cliente' ? 'el prestador' : 'el cliente';
    const ui = (A.ui.vis = A.ui.vis || {}); const f = ui[p.id] || {};
    let html = '';
    if (p.estado === 'visita_pagada') {
      const rp = v.reprog;
      html += `<div class="text-sm">${A.icon('event', '!text-sm')} Franja acordada: <b>${esc(p.franja || 'a convenir')}</b></div>`;
      // Reprogramación
      if (rp && rp.estado === 'pendiente') {
        html += rp.por === rol
          ? `<div class="text-xs bg-surface-container-low border border-outline-variant/60 p-2">Propusiste reprogramar para <b>${esc(rp.franja)}</b>. Esperando la respuesta de ${otro}.</div>`
          : `<div class="text-xs bg-amber-50 border border-amber-600 p-2 space-y-2"><div>${rp.por === 'cliente' ? 'El cliente' : 'El prestador'} propone reprogramar para <b>${esc(rp.franja)}</b>.</div>
              <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-reprog-resp" data-s="${s.id}" data-p="${p.id}" data-v="no">Rechazar</button><button class="btn-success btn-sm flex-1" data-action="vis-reprog-resp" data-s="${s.id}" data-p="${p.id}" data-v="si">Aceptar nueva fecha</button></div></div>`;
      } else if (f.modo === 'reprog') {
        html += `<div class="space-y-2"><input class="inp" data-model="vis.${p.id}.franja" value="${esc(f.franja || '')}" placeholder="Nueva fecha y horario (ej. jueves 20/11 de 14 a 18 h)">
          <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-cancel" data-p="${p.id}">Volver</button><button class="btn-primary btn-sm flex-1" data-action="vis-reprog" data-s="${s.id}" data-p="${p.id}">Proponer nueva fecha</button></div></div>`;
      }
      // Visita realizada: la marca el prestador; el cliente la confirma o se confirma sola
      if (v.marcadaEn) {
        const vence = fecha(A.fmtISO(new Date(A.parseFecha(v.marcadaEn).getTime() + A.plazoVisita() * 3600000)));
        html += `<div class="text-xs bg-emerald-50 border border-emerald-600/40 p-2">${A.icon('task_alt', '!text-sm text-tertiary')} El prestador marcó la visita como realizada el ${fecha(v.marcadaEn)}. ${rol === 'cliente' ? 'Si no respondés' : 'Si el cliente no responde'}, se confirma automáticamente el <b>${vence}</b> y se habilita el presupuesto.</div>`;
      }
      if (f.modo !== 'reprog' && f.modo !== 'novino') {
        if (rol === 'prestador') {
          html += !v.marcadaEn ? `<button class="btn-success btn-sm w-full" data-action="vis-marcar" data-s="${s.id}" data-p="${p.id}">${A.icon('task_alt')} Marcar visita como realizada</button>` : '';
        } else {
          html += `<button class="btn-success w-full" data-action="visita-ok" data-s="${s.id}" data-p="${p.id}">${A.icon('task_alt')} Confirmar que la visita se realizó</button>
            <button class="btn-danger w-full btn-sm" data-action="vis-novino" data-p="${p.id}">${A.icon('event_busy')} El prestador no vino</button>`;
        }
        if (!(rp && rp.estado === 'pendiente') && !v.marcadaEn) html += `<button class="btn-ghost btn-sm w-full" data-action="vis-reprog-open" data-p="${p.id}">${A.icon('event')} Proponer otra fecha</button>`;
        if (v.marcadaEn) html += `<button class="text-[11px] underline text-on-surface-variant w-full" data-action="vis-demo-confirmar" data-s="${s.id}" data-p="${p.id}">Demo: simular que pasaron ${A.plazoVisita()} h sin respuesta</button>`;
      }
      if (f.modo === 'novino') {
        html += `<div class="border-2 border-red-500 p-3 space-y-2">
          <div class="font-head font-bold text-red-700 text-sm">${A.icon('event_busy', '!text-base')} El prestador no vino</div>
          <p class="text-xs">El prestador tiene <b>${A.plazoVisita()} h</b> para responder. Si lo acepta o no responde, se te reembolsa el 100% (${A.money(v.monto)}). Si dice que fue y no había nadie, se abre una mediación.</p>
          <textarea rows="2" class="inp" data-model="vis.${p.id}.motivo" placeholder="Ej. Lo esperé el lunes de 9 a 13 h y no vino ni avisó.">${esc(f.motivo || '')}</textarea>
          <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-cancel" data-p="${p.id}">Volver</button><button class="btn-danger btn-sm flex-1 !bg-red-600 !text-white" data-action="vis-novino-ok" data-s="${s.id}" data-p="${p.id}">Informar</button></div></div>`;
      }
      return `<div class="space-y-2">${html}</div>`;
    }
    if (p.estado === 'visita_reclamada') {
      const r = v.reclamo; const d = v.disputa;
      html += `<div class="text-xs bg-red-50 border border-red-500 p-2"><b>El cliente informó que el prestador no vino</b> (${esc(r.fecha)})${r.motivo ? `: “${esc(r.motivo)}”` : ''}.</div>`;
      if (r.estado === 'pendiente') {
        if (rol === 'prestador') {
          html += f.modo === 'descargo'
            ? `<div class="space-y-2"><textarea rows="2" class="inp" data-model="vis.${p.id}.descargo" placeholder="Ej. Fui el lunes a las 10 h, toqué timbre y llamé dos veces: no había nadie.">${esc(f.descargo || '')}</textarea>
                <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-cancel" data-p="${p.id}">Volver</button><button class="btn-primary btn-sm flex-1" data-action="vis-descargo" data-s="${s.id}" data-p="${p.id}">Enviar descargo</button></div></div>`
            : `<p class="text-xs">Tenés hasta el <b>${fecha(r.vence)}</b> para responder. Si no respondés, se reembolsa la visita.</p>
               <div class="flex flex-col gap-2"><button class="btn-ghost btn-sm" data-action="vis-acepto" data-s="${s.id}" data-p="${p.id}">Es cierto, no pude ir (reembolsar)</button>
               <button class="btn-primary btn-sm" data-action="vis-modo" data-p="${p.id}" data-v="descargo">Fui y no había nadie</button></div>`;
        } else html += `<p class="text-xs">El prestador tiene hasta el <b>${fecha(r.vence)}</b> para responder. Si lo acepta o no responde, se te reembolsa el 100%.</p>`;
        html += `<button class="text-[11px] underline text-on-surface-variant w-full" data-action="vis-demo-vencer" data-s="${s.id}" data-p="${p.id}">Demo: simular que el prestador no respondió en ${A.plazoVisita()} h</button>`;
      } else if (d && !d.resolucion) {
        html += `<div class="text-xs border border-outline-variant/60 p-2"><b>Descargo del prestador:</b> ${esc(r.descargo || '')}</div>`;
        if (d.fase === 'mediacion') {
          html += `<div class="bg-amber-50 border border-amber-600 p-2 text-xs">${A.icon('schedule', '!text-sm')} <b>Mediación</b> hasta el <b>${fecha(d.venceMediacion)}</b>. Propongan un acuerdo; si no lo hay, decide un árbitro.</div>`;
          html += (d.propuestas || []).map((x) => `<div class="border ${x.estado === 'pendiente' ? 'border-amber-600 bg-amber-50' : 'border-outline-variant/60'} p-2 text-xs space-y-1">
              <div class="flex justify-between gap-2"><b>${x.por === rol ? 'Tu propuesta' : `Propuesta del ${x.por}`}: ${esc(textoProp(x))}</b><span class="chip-gray">${x.estado}</span></div>
              ${x.estado === 'pendiente' && x.por !== rol ? `<div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-prop-resp" data-s="${s.id}" data-p="${p.id}" data-x="${x.id}" data-v="no">Rechazar</button><button class="btn-success btn-sm flex-1" data-action="vis-prop-resp" data-s="${s.id}" data-p="${p.id}" data-x="${x.id}" data-v="si">Aceptar acuerdo</button></div>` : ''}</div>`).join('');
          html += f.modo === 'prop'
            ? `<div class="border border-primary-container p-2 space-y-2"><select class="inp" data-model="vis.${p.id}.tipo" data-rerender>${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${f.tipo === k ? 'selected' : ''}>${t}</option>`).join('')}</select>
                ${f.tipo === 'reprogramar' ? `<input class="inp" data-model="vis.${p.id}.franja" value="${esc(f.franja || '')}" placeholder="Nueva fecha y horario">` : ''}
                <div class="flex gap-2"><button class="btn-ghost btn-sm flex-1" data-action="vis-cancel" data-p="${p.id}">Volver</button><button class="btn-primary btn-sm flex-1" data-action="vis-prop" data-s="${s.id}" data-p="${p.id}">Enviar propuesta</button></div></div>`
            : `<div class="flex flex-col gap-2"><button class="btn-primary btn-sm" data-action="vis-modo" data-p="${p.id}" data-v="prop">${A.icon('send')} Proponer un acuerdo</button>
                <button class="btn-ghost btn-sm" data-action="vis-escalar" data-s="${s.id}" data-p="${p.id}">${A.icon('gavel')} Pasar a un árbitro ahora</button>
                <button class="text-[11px] underline text-on-surface-variant" data-action="vis-demo-med" data-s="${s.id}" data-p="${p.id}">Demo: simular que venció la mediación</button></div>`;
        } else {
          html += `<div class="bg-red-50 border border-red-500 p-2 text-xs">${A.icon('gavel', '!text-sm')} Un árbitro resuelve antes del <b>${fecha(d.venceArbitro)}</b>: reembolso, sin reembolso o reprogramar.</div>`;
        }
      }
      return `<div class="space-y-2">${html}</div>`;
    }
    return '';
  };

  /* Sección del centro de arbitraje con las visitas en disputa */
  A.visitasArbitrajeHtml = function (me) {
    const casos = [];
    A.state.solicitudes.forEach((s) => A.visitas(s).forEach((p) => { if (p.visita && p.visita.disputa) casos.push({ s, p }); }));
    if (!casos.length) return '';
    const ui = (A.ui.varb = A.ui.varb || {});
    return `<div class="card p-4 md:p-5 space-y-3">
      <div class="sec-title">${A.icon('directions_walk')} Visitas técnicas en disputa (${casos.length})</div>
      <p class="text-xs text-on-surface-variant">Reclamos de "el prestador no vino" que el prestador negó. Resoluciones: reembolsar la visita, sin reembolso (el cliente no estaba) o reprogramarla.</p>
      ${casos.map(({ s, p }) => {
        const d = p.visita.disputa; const r = p.visita.reclamo; const k = s.id + '_' + p.id; const f = (ui[k] = ui[k] || { franja: '', sinSaldo: false });
        const abierta = !d.resolucion; const puede = abierta && d.fase === 'arbitraje' && (me.rol === 'admin' || me.rol === 'arbitro');
        return `<div class="border border-outline-variant p-3 space-y-2 text-sm">
          <div class="flex flex-wrap justify-between gap-2"><b>${esc(s.titulo)}</b><span class="${!abierta ? 'chip-gray' : d.fase === 'mediacion' ? 'chip-amber' : 'chip-red'}">${!abierta ? 'Resuelta: ' + esc(TIPOS[d.resolucion.tipo]) : d.fase === 'mediacion' ? 'Mediación hasta ' + fecha(d.venceMediacion) : 'Resolver antes del ' + fecha(d.venceArbitro)}</span></div>
          <div class="text-xs">Cliente: ${esc(A.fullName(A.user(s.clienteId)))} · Prestador: ${esc(A.fullName(A.user(p.prestadorId)))} · Visita ${A.money(p.visita.monto)} · Franja: ${esc(p.franja || '—')}</div>
          <div class="text-xs bg-red-50 border border-red-500/50 p-2"><b>Cliente:</b> ${esc(r.motivo || 'El prestador no vino.')}</div>
          <div class="text-xs bg-blue-50 border border-primary-container/40 p-2"><b>Prestador:</b> ${esc(r.descargo || '')}</div>
          ${(d.propuestas || []).length ? `<div class="text-xs text-on-surface-variant">Propuestas: ${d.propuestas.map((x) => `${x.por} → ${esc(textoProp(x))} (${x.estado})`).join(' · ')}</div>` : ''}
          ${abierta && d.fase === 'mediacion' && (me.rol === 'admin' || me.rol === 'arbitro') ? `<button class="btn-dark btn-sm" data-action="vis-escalar" data-s="${s.id}" data-p="${p.id}">Pasar a arbitraje ahora</button>` : ''}
          ${puede ? `<label class="flex items-center gap-2 text-xs"><input type="checkbox" data-action="varb-sinsaldo" data-k="${k}" ${f.sinSaldo ? 'checked' : ''}> Demo: el prestador no tiene saldo en Mercado Pago</label>
            <div class="flex flex-wrap gap-2 items-center">
              <button class="btn-danger btn-sm !bg-red-600 !text-white" data-action="varb-resolver" data-s="${s.id}" data-p="${p.id}" data-k="${k}" data-v="reembolso">Reembolsar la visita</button>
              <button class="btn-success btn-sm" data-action="varb-resolver" data-s="${s.id}" data-p="${p.id}" data-k="${k}" data-v="sin_reembolso">Sin reembolso (cliente ausente)</button>
              <input class="inp !w-56 !py-1 text-xs" data-model="varb.${k}.franja" value="${esc(f.franja)}" placeholder="Nueva fecha para reprogramar">
              <button class="btn-ghost btn-sm" data-action="varb-resolver" data-s="${s.id}" data-p="${p.id}" data-k="${k}" data-v="reprogramar">Reprogramar</button></div>` : ''}
        </div>`;
      }).join('')}</div>`;
  };

  /* ---------- Acciones ---------- */
  const set = (pid, o) => { (A.ui.vis = A.ui.vis || {})[pid] = Object.assign({}, A.ui.vis[pid] || {}, o); A.rerender(); };
  const rolDe = (s) => (s.clienteId === A.me().id ? 'cliente' : 'prestador');
  A.actions['vis-cancel'] = (el) => { if (A.ui.vis) delete A.ui.vis[el.dataset.p]; A.rerender(); };
  A.actions['vis-modo'] = (el) => set(el.dataset.p, { modo: el.dataset.v, tipo: 'reprogramar' });
  A.actions['vis-reprog-open'] = (el) => set(el.dataset.p, { modo: 'reprog' });
  A.actions['vis-novino'] = (el) => set(el.dataset.p, { modo: 'novino' });
  A.actions['vis-reprog'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const f = A.ui.vis[p.id];
    if (!f.franja || f.franja.trim().length < 5) { A.toast('Indicá la nueva fecha y horario.', 'err'); return; }
    p.visita.reprog = { por: rolDe(s), franja: f.franja.trim(), estado: 'pendiente', fecha: A.now() }; delete A.ui.vis[p.id];
    A.hist(s, 'visita', `${rolDe(s) === 'cliente' ? 'El cliente' : 'El prestador'} propone reprogramar la visita: ${p.visita.reprog.franja}`, p.prestadorId);
    A.commit('Propuesta de nueva fecha enviada.', 'ok');
  };
  A.actions['vis-reprog-resp'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const rp = p.visita.reprog;
    if (el.dataset.v === 'si') { rp.estado = 'aceptada'; A.resolverVisita(s, p, 'reprogramar', { franja: rp.franja }); A.commit(`Visita reprogramada: ${esc(rp.franja)}.`, 'ok'); }
    else { rp.estado = 'rechazada'; A.hist(s, 'visita', 'Propuesta de reprogramación rechazada', p.prestadorId); A.commit('Rechazaste la nueva fecha.', 'info'); }
  };
  A.actions['vis-marcar'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); p.visita.marcadaEn = A.now();
    A.hist(s, 'visita', 'El prestador marcó la visita como realizada', p.prestadorId);
    A.commit(`Visita marcada como realizada. Si el cliente no responde en ${A.plazoVisita()} h, se confirma sola.`, 'ok');
  };
  A.actions['visita-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); A.confirmarVisita(s, p, false);
    A.commit('Visita confirmada. El prestador ya puede enviarte el presupuesto (se paga aparte).', 'ok');
  };
  A.actions['vis-demo-confirmar'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p);
    p.visita.marcadaEn = A.fmtISO(new Date(Date.now() - (A.plazoVisita() + 1) * 3600000)); A.checkPlazos();
    A.commit('Pasó el plazo sin respuesta: la visita se confirmó automáticamente.', 'info');
  };
  A.actions['vis-novino-ok'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const f = A.ui.vis[p.id] || {};
    p.estado = 'visita_reclamada';
    p.visita.reclamo = { motivo: (f.motivo || '').trim(), fecha: A.now(), vence: A.fmtISO(A.addHoras(new Date(), A.plazoVisita())), estado: 'pendiente' };
    delete A.ui.vis[p.id];
    A.hist(s, 'visita', 'El cliente informó que el prestador no vino a la visita', p.prestadorId);
    A.commit(`Informado. El prestador tiene ${A.plazoVisita()} h para responder; si no responde, se te reembolsa la visita.`, 'ok');
  };
  A.actions['vis-acepto'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p);
    A.resolverVisita(s, p, 'reembolso', { por: 'prestador' });
    A.commit(`Visita reembolsada al cliente (${A.money(p.visita.monto)}).`, 'info');
  };
  A.actions['vis-descargo'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const f = A.ui.vis[p.id] || {}; const r = p.visita.reclamo;
    if (!f.descargo || f.descargo.trim().length < 10) { A.toast('Contá qué pasó (mín. 10 caracteres).', 'err'); return; }
    r.descargo = f.descargo.trim(); r.estado = 'negado'; delete A.ui.vis[p.id];
    p.visita.disputa = { id: A.nextId('DISPV'), fase: 'mediacion', venceMediacion: A.fmtISO(A.addHoras(new Date(), A.cfg('plazoMediacion', 72))), propuestas: [] };
    A.hist(s, 'visita', 'El prestador dice que fue y no había nadie: se abrió una mediación sobre la visita', p.prestadorId);
    A.commit('Descargo enviado. Empieza una mediación con el cliente.', 'ok');
  };
  A.actions['vis-demo-vencer'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p);
    p.visita.reclamo.vence = A.fmtISO(new Date(Date.now() - 60000)); A.checkPlazos();
    A.commit('El prestador no respondió a tiempo: se reembolsó la visita.', 'info');
  };
  A.actions['vis-prop'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const f = A.ui.vis[p.id] || {}; const d = p.visita.disputa;
    const tipo = f.tipo || 'reprogramar';
    if (tipo === 'reprogramar' && (!f.franja || f.franja.trim().length < 5)) { A.toast('Indicá la nueva fecha y horario.', 'err'); return; }
    d.propuestas.forEach((x) => { if (x.estado === 'pendiente' && x.por === rolDe(s)) x.estado = 'reemplazada'; });
    d.propuestas.push({ id: A.nextId('PV'), por: rolDe(s), tipo, franja: (f.franja || '').trim(), estado: 'pendiente', fecha: A.now() });
    delete A.ui.vis[p.id];
    A.commit('Propuesta enviada.', 'ok');
  };
  A.actions['vis-prop-resp'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const x = p.visita.disputa.propuestas.find((y) => y.id === el.dataset.x);
    if (el.dataset.v === 'si') { x.estado = 'aceptada'; A.resolverVisita(s, p, x.tipo, { franja: x.franja, por: 'acuerdo' }); A.commit(`Acuerdo aceptado: ${esc(textoProp(x))}.`, 'ok'); }
    else { x.estado = 'rechazada'; A.commit('Rechazaste la propuesta.', 'info'); }
  };
  A.actions['vis-escalar'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const d = p.visita.disputa;
    d.fase = 'arbitraje'; d.venceArbitro = A.fmtISO(A.addHabiles(new Date(), A.cfg('plazoArbitro', 10)));
    A.hist(s, 'visita', 'La disputa por la visita pasó a un árbitro', p.prestadorId);
    A.commit('La disputa por la visita pasó a un árbitro.', 'info');
  };
  A.actions['vis-demo-med'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); p.visita.disputa.venceMediacion = A.fmtISO(new Date(Date.now() - 60000)); A.checkPlazos();
    A.commit('Venció la mediación sin acuerdo: la visita pasó a un árbitro.', 'info');
  };
  A.actions['varb-sinsaldo'] = (el) => { A.ui.varb[el.dataset.k].sinSaldo = !!el.checked; };
  A.actions['varb-resolver'] = (el) => {
    const s = A.sol(el.dataset.s); const p = vis(s, el.dataset.p); const f = A.ui.varb[el.dataset.k]; const tipo = el.dataset.v;
    if (tipo === 'reprogramar' && (!f.franja || f.franja.trim().length < 5)) { A.toast('Indicá la nueva fecha para reprogramar.', 'err'); return; }
    A.resolverVisita(s, p, tipo, { franja: (f.franja || '').trim(), sinSaldo: f.sinSaldo, por: A.me().id });
    A.commit(`Disputa de la visita resuelta: ${esc(TIPOS[tipo])}.`, 'ok');
  };
})();

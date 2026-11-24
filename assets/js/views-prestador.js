/* Vistas del prestador: Pliego + Presupuesto por etapas propias (o visita técnica), Mis postulaciones. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;
  const sugeridas = (cat) => (window.CATEGORIAS[cat] || ['Diagnóstico', 'Ejecución', 'Prueba y limpieza final']).map((n) => ({ nombre: n, desc: '', monto: '' }));
  const esLimpieza = (s) => s.categoria === window.CAT_HERRAMIENTAS_CLIENTE;

  function mias(s, me) {
    return { budget: A.presupuestos(s).find((p) => p.prestadorId === me.id), visit: A.visitas(s).find((p) => p.prestadorId === me.id) };
  }

  function draftFor(s, me) {
    A.ui.presu = A.ui.presu || {};
    if (!A.ui.presu[s.id]) {
      const { budget, visit } = mias(s, me);
      A.ui.presu[s.id] = budget
        ? { tipo: 'presupuesto', etapas: budget.etapas.map((h, i) => ({ nombre: h.nombre, desc: h.desc || '', monto: String(budget.montos[i] || '') })), incluyeMateriales: budget.incluyeMateriales, detalleMateriales: budget.detalleMateriales, costoMateriales: String(budget.costoMateriales || ''), herramientas: budget.aportaHerramientas ? 'si' : 'no', detalleHerramientas: budget.detalleHerramientas, aclaracion: budget.aclaracion || '', nota: budget.nota }
        : { tipo: visit && visit.estado === 'enviada' ? 'visita' : 'presupuesto', etapas: sugeridas(s.categoria), incluyeMateriales: false, detalleMateriales: '', costoMateriales: '', herramientas: esLimpieza(s) ? '' : 'si', detalleHerramientas: '', aclaracion: '', nota: '',
            montoVisita: visit ? String(visit.montoVisita) : '', detalleVisita: visit ? visit.detalleVisita : '', franja: visit ? visit.franja : '', descuentaVisita: visit ? !!visit.descuentaVisita : false };
    }
    return A.ui.presu[s.id];
  }
  function totals(d) {
    const mano = d.etapas.reduce((a, e) => a + (Number(e.monto) || 0), 0);
    const mat = d.incluyeMateriales ? Number(d.costoMateriales) || 0 : 0;
    const cobra = d.tipo === 'visita' ? Number(d.montoVisita) || 0 : mano + mat; // lo que cobra el prestador
    const cliente = d.tipo === 'visita' ? A.alCliente(cobra, A.comision('visita')) : d.etapas.reduce((a, e) => a + A.alCliente(e.monto), 0) + (mat ? A.alCliente(mat, A.comision('materiales')) : 0); // precio final (solo demo)
    return { mano, mat, cobra, cliente };
  }
  A.live.presu = () => {
    const d = A.ui.presu[A.ui.presuId]; if (!d) return;
    const t = totals(d);
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('pr-mano', A.money(t.mano) + ' ARS'); set('pr-neto', A.money(t.cobra) + ' ARS');
    set('pr-cli', A.money(t.cliente)); set('pr-com', A.money(t.cliente - t.cobra));
  };

  const liquidacion = (t, sub) => `<div class="bg-surface-container border border-outline-variant p-4 mt-5 space-y-2">
      <div class="flex justify-between"><span class="lbl !mb-0">Lo que vas a cobrar</span>${A.icon('lock', 'text-primary !text-base')}</div>
      <div class="flex justify-between items-end"><span class="font-head font-bold text-sm uppercase">Total a cobrar<br><span class="text-[10px] text-tertiary normal-case font-semibold">${sub}</span></span><span class="money text-2xl text-tertiary" id="pr-neto">${A.money(t.cobra)} ARS</span></div>
      <p class="text-[11px] text-on-surface-variant">Cobrás exactamente lo que presupuestás. El cliente paga cada etapa antes de que empiece y el pago se acredita en tu cuenta de Mercado Pago.</p>
      ${A.demoNota(`El cliente verá un precio final de <b id="pr-cli">${A.money(t.cliente)}</b>. La diferencia (<b id="pr-com">${A.money(t.cliente - t.cobra)}</b>) es la comisión de la plataforma (${A.pct()} mano de obra, ${A.pct(A.comision('materiales'))} materiales) más el costo de Mercado Pago, que paga el cliente. Ni el cliente ni el prestador ven este desglose.`)}
    </div>`;

  function formPresupuesto(s, me, d, e, t, mine) {
    const acl = me.aclaraciones || [];
    return `<div class="flex justify-between mt-5 mb-2 items-end"><span class="lbl !mb-0">Etapas del trabajo (las definís vos)</span><span class="font-head text-[10px] text-on-surface-variant">Moneda: ARS ($)</span></div>
      <p class="text-xs text-on-surface-variant mb-2">Proponé los pasos o etapas en que vas a hacer el trabajo y cotizá cada uno. El cliente las ve y se usan para el seguimiento.</p>
      <div class="space-y-2">${d.etapas.map((h, i) => `<div class="bg-surface-container-low border ${e['m' + i] ? 'border-red-500' : 'border-outline-variant/60'} p-3 space-y-2">
          <div class="flex justify-between items-center"><span class="font-head text-[10px] font-bold text-primary">ETAPA ${String(i + 1).padStart(2, '0')}</span>
            <button class="text-on-surface-variant hover:text-red-600" data-action="et-del" data-s="${s.id}" data-i="${i}" title="Quitar etapa">${A.icon('delete', '!text-base')}</button></div>
          <div class="flex gap-2"><input class="inp !py-1.5" data-model="presu.${s.id}.etapas.${i}.nombre" value="${esc(h.nombre)}" placeholder="Nombre de la etapa">
            <label class="flex items-center bg-white border border-slate-400 w-32 shrink-0"><span class="px-2 font-head">$</span>
            <input type="number" min="0" step="500" inputmode="numeric" class="w-full py-1.5 pr-2 outline-none font-head font-semibold text-right tnum" data-model="presu.${s.id}.etapas.${i}.monto" data-live="presu" value="${esc(h.monto)}"></label></div>
          <input class="inp !py-1.5 !text-xs" data-model="presu.${s.id}.etapas.${i}.desc" value="${esc(h.desc)}" placeholder="Qué incluye esta etapa (opcional)"></div>`).join('')}</div>
      <div class="flex flex-wrap gap-2 mt-2"><button class="btn-ghost btn-sm" data-action="et-add" data-s="${s.id}">${A.icon('add')} Agregar etapa</button>
        <button class="btn-ghost btn-sm" data-action="et-sug" data-s="${s.id}">${A.icon('auto_awesome')} Usar etapas sugeridas (${esc(s.categoria)})</button></div>
      <div class="flex justify-between items-center bg-surface-container-high px-3 py-2 mt-2"><span class="font-head text-xs font-bold uppercase">Subtotal mano de obra</span><span class="money text-primary text-lg" id="pr-mano">${A.money(t.mano)} ARS</span></div>
      ${e.montos ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs px-2 py-1 mt-1">${e.montos}</div>` : ''}

      <div class="lbl mt-6">Materiales e insumos</div>
      <div class="bg-surface-container-low border border-outline-variant/60 p-3 space-y-3">
        <label class="flex justify-between items-center gap-3 cursor-pointer"><span class="text-sm"><b>¿Comprás vos los materiales / insumos?</b><br><span class="text-xs text-on-surface-variant">Si no, el cliente debe proveerlos.</span></span>
          <input type="checkbox" class="w-5 h-5 accent-[#2563eb]" data-model="presu.${s.id}.incluyeMateriales" data-rerender ${d.incluyeMateriales ? 'checked' : ''}></label>
        ${d.incluyeMateriales ? `<div><label class="lbl">Detalle de materiales</label><textarea rows="2" class="inp ${e.detalleMateriales ? 'inp-err' : ''}" data-model="presu.${s.id}.detalleMateriales" placeholder="Ej. disyuntor 40A, 25 m de cable 4 mm…">${esc(d.detalleMateriales)}</textarea></div>
          <div class="flex justify-between items-center"><span class="text-xs font-head font-semibold uppercase">Monto estimado</span>
            <label class="flex items-center bg-white border ${e.costoMateriales ? 'border-red-500 border-2' : 'border-slate-400'} w-32"><span class="px-2 font-head">$</span><input type="number" min="0" step="500" class="w-full py-1.5 pr-2 outline-none font-head font-semibold text-right tnum" data-model="presu.${s.id}.costoMateriales" data-live="presu" value="${esc(d.costoMateriales)}"></label></div>
          <div class="text-[11px] bg-blue-50 border border-primary-container/40 p-2 flex gap-1">${A.icon('receipt_long', '!text-sm text-primary')} <span>Durante el trabajo vas a <b>declarar el monto real de cada compra y adjuntar la foto del ticket</b>. Si gastás más de lo estimado, el cliente aprueba y paga la diferencia.</span></div>` : ''}
      </div>
      <div class="bg-surface-container-low border ${e.herramientas ? 'border-red-500' : 'border-outline-variant/60'} p-3 mt-2 space-y-2">
        <div class="text-sm font-semibold">Herramientas</div>
        ${esLimpieza(s)
          ? `<div class="text-xs text-on-surface-variant">En <b>limpieza de interiores</b> podés pedir que el cliente provea algunos elementos.</div>
            ${[['si', 'Aporto todas las herramientas y elementos'], ['no', 'El cliente debe proveer algunos elementos']].map(([v, tx]) => `<label class="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="herr-${s.id}" value="${v}" class="accent-[#2563eb]" data-model="presu.${s.id}.herramientas" ${d.herramientas === v ? 'checked' : ''}> ${tx}</label>`).join('')}`
          : `<div class="text-sm flex gap-2 items-center text-tertiary font-semibold">${A.icon('construction', '!text-base')} Las aportás vos (regla general de la plataforma)</div>`}
        <input class="inp" data-model="presu.${s.id}.detalleHerramientas" value="${esc(d.detalleHerramientas)}" placeholder="${esLimpieza(s) ? 'Ej. el cliente provee aspiradora y escalera' : 'Detalle (opcional): ej. termofusora, pinza amperométrica…'}">
      </div>

      <div class="lbl mt-6">Aclaraciones destacadas</div>
      <div class="bg-surface-container-low border border-outline-variant/60 p-3 space-y-2">
        ${acl.length ? A.aclaracionesHtml(me, null) : '<div class="text-xs text-on-surface-variant">No tenés aclaraciones en tu perfil.</div>'}
        <a href="#/perfil" class="text-[11px] underline text-primary">Editar aclaraciones de mi perfil</a>
        <input class="inp" data-model="presu.${s.id}.aclaracion" value="${esc(d.aclaracion)}" placeholder="Aclaración para este presupuesto (ej. No pico paredes)">
        <div class="text-[11px] text-on-surface-variant">Se muestran resaltadas al cliente, junto a tu presupuesto.</div>
      </div>
      <div class="mt-3"><label class="lbl">Condiciones / nota para el cliente (opcional)</label><input class="inp" data-model="presu.${s.id}.nota" value="${esc(d.nota)}" placeholder="Ej. Garantía de 6 meses sobre la mano de obra"></div>
      ${liquidacion(t, 'Cobrás cada etapa cuando el cliente la paga')}`;
  }

  function formVisita(s, d, e, t) {
    return `<div class="mt-5 bg-amber-50 border border-amber-600 p-3 text-xs flex gap-2">${A.icon('info', 'text-amber-700 !text-base')}
        <span>Cobrás <b>solo la visita</b> para ver el trabajo en persona. Después de la visita podés enviar el presupuesto: <b>son dos pagos distintos</b> para el cliente.</span></div>
      <div class="mt-4 space-y-3">
        <div class="flex justify-between items-center"><span class="lbl !mb-0">Monto de la visita</span>
          <label class="flex items-center bg-white border ${e.montoVisita ? 'border-red-500 border-2' : 'border-slate-400'} w-36"><span class="px-2 font-head">$</span><input type="number" min="0" step="500" class="w-full py-1.5 pr-2 outline-none font-head font-semibold text-right tnum" data-model="presu.${s.id}.montoVisita" data-live="presu" value="${esc(d.montoVisita)}"></label></div>
        <div><label class="lbl">Qué incluye la visita</label><textarea rows="3" class="inp ${e.detalleVisita ? 'inp-err' : ''}" data-model="presu.${s.id}.detalleVisita" placeholder="Ej. Revisión del tablero, medición de consumo y diagnóstico. Después envío el presupuesto cerrado.">${esc(d.detalleVisita)}</textarea></div>
        <div><label class="lbl">Días y horarios propuestos</label><input class="inp" data-model="presu.${s.id}.franja" value="${esc(d.franja)}" placeholder="Ej. Lunes 17/11 o martes 18/11, de 9 a 13 h"></div>
        <label class="flex items-start gap-2 text-sm cursor-pointer border border-outline-variant p-2"><input type="checkbox" class="w-4 h-4 mt-0.5 accent-[#2563eb]" data-model="presu.${s.id}.descuentaVisita" ${d.descuentaVisita ? 'checked' : ''}>
          <span>Si el cliente acepta mi presupuesto, <b>le descuento la visita</b>.<br><span class="text-xs text-on-surface-variant">Es un incentivo para que te elija. Se descuenta de las primeras etapas.</span></span></label>
      </div>
      ${liquidacion(t, 'Cuando el cliente confirma la visita')}`;
  }

  A.views.postular = function (s, me) {
    const cliente = A.user(s.clienteId);
    const { budget, visit } = mias(s, me);
    const head = A.pageHead(
      `<a href="#/" class="hover:text-primary">${A.icon('arrow_back', '!text-sm')} Oportunidades</a> / <span class="text-primary">Solicitud #${s.id}</span> / <span class="bg-surface-container px-1">Categoría: ${esc(s.categoria)}</span>`,
      `<div class="flex flex-wrap gap-2 mb-2">${A.estadoChip(s)}${budget ? `<span class="chip-green">Ya te postulaste</span>` : ''}${visit ? `<span class="chip-amber">Visita ofrecida</span>` : ''}</div>
       <h1 class="text-2xl md:text-[32px] md:leading-[38px] font-bold tracking-tight max-w-3xl">${esc(s.titulo)}</h1>`,
      `<div class="flex items-center gap-2 text-xs font-head"><span class="w-2 h-2 bg-tertiary inline-block"></span>${s.postulaciones.length} postulaciones</div>`);

    const left = `<div class="space-y-5 min-w-0">
      <div class="card card-pad grid sm:grid-cols-3 gap-3 bg-surface-container-low">
        <div class="flex items-center gap-2">${A.avatar(cliente, 'w-10 h-10')}<div><div class="font-head font-semibold text-sm">${esc(cliente.nombre)} ${esc(cliente.apellido[0])}.</div><div class="text-[10px] text-tertiary font-head font-bold uppercase">${A.icon('verified', '!text-xs')} DNI verificado</div></div></div>
        <div><div class="lbl !mb-0">Forma de pago</div><div class="text-sm font-semibold">${A.icon('payments', '!text-sm')} Pago por etapa (Mercado Pago)</div></div>
        <div><div class="lbl !mb-0">Ubicación</div><div class="text-sm font-semibold">${A.icon('location_on', '!text-sm text-red-600')} ${esc(s.zona)} · CP ${esc(s.cp)}</div></div>
      </div>
      ${A.solicitudInfo(s)}
      ${A.historialHtml(s, me.id)}
      <div class="bg-surface-container border border-outline-variant p-5 flex gap-3">${A.icon('precision_manufacturing', 'text-primary !text-2xl')}
        <div><div class="font-head font-semibold">Compromiso de exactitud granular</div><p class="text-sm text-on-surface-variant">Cada etapa cotizada queda registrada. El cliente paga cada etapa antes de que la empieces (se acredita en tu cuenta de Mercado Pago) y no se permiten cobros por fuera de la plataforma.</p></div></div>
    </div>`;

    let right;
    if (s.estado !== 'abierta') {
      const mineAssigned = s.asignada && s.asignada.prestadorId === me.id;
      right = `<div class="card card-pad text-center">${A.icon(mineAssigned ? 'task_alt' : 'block', '!text-4xl ' + (mineAssigned ? 'text-tertiary' : 'text-outline'))}
        <div class="font-head font-semibold text-lg mt-2">${mineAssigned ? '¡Tu presupuesto fue aceptado!' : 'La solicitud ya fue adjudicada'}</div>
        ${mineAssigned ? `<a href="#/trabajo/${s.id}" class="btn-primary mt-4 w-full">${A.icon('timeline')} Ir al seguimiento</a>` : '<p class="text-sm text-on-surface-variant mt-1">El cliente eligió otro presupuesto.</p>'}</div>`;
    } else if (me.estado !== 'activo') {
      right = `<div class="card card-pad border-amber-600 bg-amber-50"><div class="font-head font-semibold flex items-center gap-2">${A.icon('hourglass_top')} Perfil pendiente de aprobación</div>
        <p class="text-sm mt-2">Podés ver el pliego completo, pero para enviar presupuestos un administrador debe aprobar tu credencial de oficio.</p>
        <button class="btn-ghost btn-sm mt-3" data-action="ver-como" data-id="u-admin">Ver como administrador</button></div>`;
    } else if (visit && (visit.estado === 'visita_pagada' || visit.estado === 'visita_reclamada') && !budget) {
      right = `<div class="card card-pad border-amber-600 space-y-3">
        <div class="font-head font-semibold flex items-center gap-2">${A.icon('event_available', 'text-amber-700')} Visita pagada por el cliente</div>
        <p class="text-sm">El cliente pagó la visita: <b>${A.money(visit.montoVisita)}</b> ya están en tu cuenta de Mercado Pago.</p>
        <p class="text-xs text-on-surface-variant">Después de ir, marcá la visita como realizada: el cliente la confirma o se confirma sola a las ${A.plazoVisita()} h, y se habilita el presupuesto. Si no podés ir, proponé otra fecha. Si el cliente informa que no fuiste, tenés ${A.plazoVisita()} h para responder.</p>
        ${A.visitaGestion(s, visit, 'prestador')}
        <button class="btn-ghost btn-sm w-full" data-action="ver-como" data-id="${s.clienteId}" data-go="#/solicitud/${s.id}">Demo: ver como el cliente para confirmar la visita</button></div>
        ${A.contactoCard(s, me, s.clienteId, 'coordinar la visita')}`;
    } else {
      const d = draftFor(s, me); A.ui.presuId = s.id;
      const visitaHecha = visit && visit.estado === 'visita_realizada';
      const visitaCancelada = visit && visit.estado === 'visita_cancelada';
      if (visitaHecha || visitaCancelada) d.tipo = 'presupuesto';
      const t = totals(d); const e = d.showErr ? presuErrors(s, d) : {};
      const puedeElegir = !budget && !visitaHecha && !visitaCancelada;
      right = `<div class="card border-slate-950 shadow-hard">
        <div class="card-pad">
          <div class="font-head text-[10px] font-bold text-primary tracking-wider">RF03 · PRESUPUESTO E INSUMOS</div>
          <h2 class="font-head text-xl md:text-2xl font-bold uppercase leading-tight">${d.tipo === 'visita' ? 'Ofrecer visita técnica' : 'Emitir presupuesto por etapas'}</h2>
          ${visitaHecha ? `<div class="mt-2 bg-emerald-50 border border-emerald-600/50 p-2 text-xs">${A.icon('task_alt', '!text-sm text-tertiary')} Visita realizada el ${esc(visit.visita.realizada)} y cobrada. Ahora enviá el presupuesto: el cliente lo paga aparte y queda registrado que <b>primero visitaste y después presupuestaste</b>.</div>` : ''}
          ${visitaCancelada ? `<div class="mt-2 bg-red-50 border border-red-500 p-2 text-xs">${A.icon('event_busy', '!text-sm text-red-600')} El cliente canceló tu visita porque no te presentaste. Igual podés enviar un presupuesto directo.</div>` : ''}
          ${puedeElegir ? `<p class="text-xs text-on-surface-variant mt-2">Podés enviar el presupuesto directamente, sin visitar, o cobrar primero una visita para ver el trabajo en persona.</p>` : ''}
          ${puedeElegir ? `<div class="grid grid-cols-2 gap-1 mt-4 bg-surface-container-low p-1 border border-outline-variant/60">
            ${[['presupuesto', 'request_quote', 'Presupuesto directo'], ['visita', 'directions_walk', 'Cobrar visita primero']].map(([k, ic, tx]) => `<button class="py-2 font-head text-xs font-semibold flex items-center justify-center gap-1 ${d.tipo === k ? 'bg-white border border-slate-950 shadow-hard-sm' : 'text-on-surface-variant'}" data-action="presu-tipo" data-s="${s.id}" data-v="${k}">${A.icon(ic, '!text-base')} ${tx}</button>`).join('')}</div>` : ''}
          ${d.tipo === 'visita' ? formVisita(s, d, e, t) : formPresupuesto(s, me, d, e, t, budget)}
        </div>
        <button class="btn w-full bg-primary-container text-white border-slate-950 border-2 !py-4 text-base uppercase hover:bg-blue-700" data-action="presu-submit" data-s="${s.id}">${d.tipo === 'visita' ? (visit ? 'Actualizar visita' : 'Ofrecer visita al cliente') : budget ? 'Actualizar presupuesto' : 'Enviar presupuesto al solicitante'}</button>
        <div class="p-3 text-[11px] text-on-surface-variant bg-surface-container-low flex gap-2">${A.icon('verified_user', 'text-tertiary !text-base')} ${d.tipo === 'visita' ? 'Si el cliente acepta, paga la visita y se acredita en tu cuenta de Mercado Pago.' : 'Si el cliente acepta, paga la etapa 1 y después cada etapa antes de que la empieces: cada pago se acredita en tu cuenta de Mercado Pago. Cada etapa terminada la aprueba el cliente; si no responde en el plazo, se aprueba automáticamente.'}</div>
      </div>${visitaHecha ? A.contactoCard(s, me, s.clienteId, 'coordinar el presupuesto') : ''}`;
    }
    return head + `<div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 grid lg:grid-cols-[1fr_440px] gap-6">${left}<aside class="space-y-4">${right}</aside></div>`;
  };

  function presuErrors(s, d) {
    const e = {};
    if (d.tipo === 'visita') {
      if (!(Number(d.montoVisita) > 0)) e.montoVisita = true;
      if (!d.detalleVisita || d.detalleVisita.trim().length < 15) e.detalleVisita = true;
      return e;
    }
    if (!d.etapas.length) e.montos = 'Agregá al menos una etapa.';
    d.etapas.forEach((h, i) => { if (!(Number(h.monto) > 0) || !h.nombre.trim()) e['m' + i] = true; });
    if (Object.keys(e).length && !e.montos) e.montos = 'Cada etapa necesita un nombre y un monto mayor a 0.';
    if (d.incluyeMateriales) {
      if (!(Number(d.costoMateriales) > 0)) e.costoMateriales = true;
      if (!d.detalleMateriales || !d.detalleMateriales.trim()) e.detalleMateriales = true;
    }
    if (!d.herramientas) e.herramientas = true;
    return e;
  }

  A.actions['presu-tipo'] = (el) => { A.ui.presu[el.dataset.s].tipo = el.dataset.v; A.rerender(); };
  A.actions['et-add'] = (el) => { A.ui.presu[el.dataset.s].etapas.push({ nombre: '', desc: '', monto: '' }); A.rerender(); };
  A.actions['et-del'] = (el) => { A.ui.presu[el.dataset.s].etapas.splice(+el.dataset.i, 1); A.rerender(); };
  A.actions['et-sug'] = (el) => { const s = A.sol(el.dataset.s); A.ui.presu[s.id].etapas = sugeridas(s.categoria); A.rerender(); };

  A.actions['presu-submit'] = (el) => {
    const s = A.sol(el.dataset.s); const me = A.me(); const d = A.ui.presu[s.id];
    d.showErr = true;
    if (Object.keys(presuErrors(s, d)).length) { A.rerender(); A.toast(d.tipo === 'visita' ? 'Indicá el monto y qué incluye la visita.' : 'Completá las etapas con sus montos, materiales y herramientas.', 'err'); return; }
    const { budget, visit } = mias(s, me);
    if (d.tipo === 'visita') {
      const data = { montoVisita: Number(d.montoVisita), detalleVisita: d.detalleVisita.trim(), franja: (d.franja || '').trim(), descuentaVisita: !!d.descuentaVisita };
      if (visit) Object.assign(visit, data, { fecha: A.now() });
      else s.postulaciones.push(Object.assign({ id: A.nextId('P'), tipo: 'visita', prestadorId: me.id, fecha: A.now(), estado: 'enviada', montos: [], etapas: [] }, data));
      A.hist(s, 'visita', `${visit ? 'Visita técnica actualizada' : 'Visita técnica ofrecida'} (${A.money(data.montoVisita)})`, me.id);
      delete A.ui.presu[s.id];
      A.commit(visit ? 'Visita actualizada.' : `Visita técnica ofrecida a ${esc(A.user(s.clienteId).nombre)} por <b>${A.money(data.montoVisita)}</b>.`, 'ok');
      return;
    }
    const etapas = d.etapas.map((h) => ({ nombre: h.nombre.trim(), desc: (h.desc || '').trim() }));
    const data = {
      etapas, montos: d.etapas.map((h) => Number(h.monto)), incluyeMateriales: !!d.incluyeMateriales,
      detalleMateriales: d.incluyeMateriales ? d.detalleMateriales.trim() : 'No incluye insumos (los provee el cliente).',
      costoMateriales: d.incluyeMateriales ? Number(d.costoMateriales) : 0, aportaHerramientas: d.herramientas === 'si',
      detalleHerramientas: (d.detalleHerramientas || '').trim(), aclaracion: (d.aclaracion || '').trim(), nota: (d.nota || '').trim(),
    };
    // Origen: presupuesto directo o presupuesto posterior a una visita realizada (queda registrado).
    const trasVisita = visit && visit.estado === 'visita_realizada';
    if (!budget) Object.assign(data, trasVisita ? { origen: 'tras_visita', visitaId: visit.id, visitaRealizada: visit.visita.realizada } : { origen: 'directo' });
    // Si había una visita ofrecida y todavía no pagada, se retira (queda en el historial).
    if (visit && visit.estado === 'enviada') {
      visit.estado = 'retirada';
      A.hist(s, 'visita_retirada', 'Visita ofrecida retirada: el prestador prefirió enviar un presupuesto directo', me.id);
    }
    if (budget) Object.assign(budget, data, { fecha: A.now() });
    else s.postulaciones.push(Object.assign({ id: A.nextId('P'), tipo: 'presupuesto', prestadorId: me.id, fecha: A.now(), estado: 'enviada' }, data));
    const tot = A.money(A.totalPost(Object.assign({ tipo: 'presupuesto' }, data)));
    A.hist(s, 'presupuesto', budget ? `Presupuesto actualizado (${tot})` : trasVisita ? `Presupuesto enviado después de la visita del ${visit.visita.realizada} (${tot})` : `Presupuesto enviado (directo, sin visita previa) (${tot})`, me.id);
    delete A.ui.presu[s.id];
    A.commit(budget ? 'Presupuesto actualizado.' : `Presupuesto enviado a ${esc(A.user(s.clienteId).nombre)} por <b>${A.money(A.totalPost(Object.assign({ tipo: 'presupuesto' }, data)))}</b>.`, 'ok');
  };

  /* =================== MIS POSTULACIONES =================== */
  A.views.misPostulaciones = function (params, me) {
    const rows = [];
    A.state.solicitudes.forEach((s) => s.postulaciones.forEach((p) => { if (p.prestadorId === me.id) rows.push({ s, p }); }));
    const est = {
      enviada: '<span class="chip-blue">Enviada · esperando al cliente</span>', aceptada: '<span class="chip-green">Aceptada</span>', rechazada: '<span class="chip-gray">No seleccionada</span>',
      visita_pagada: '<span class="chip-amber">Visita pagada · coordinar</span>', visita_realizada: '<span class="chip-green">Visita realizada · cobrada</span>', visita_reclamada: '<span class="chip-red">El cliente dice que no fuiste</span>',
      visita_cancelada: '<span class="chip-red">Visita cancelada (no se presentó)</span>', retirada: '<span class="chip-gray">Visita retirada</span>',
    };
    return A.pageHead('<span>Mis postulaciones</span>', `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Mis postulaciones</h1>`) +
      `<div class="max-w-[1100px] mx-auto px-4 md:px-8 py-6 space-y-3">
        ${!rows.length ? `<div class="card p-10 text-center text-on-surface-variant">Todavía no te postulaste. <a href="#/" class="underline text-primary">Ver oportunidades</a></div>` : ''}
        ${rows.map(({ s, p }) => `<a href="${p.estado === 'aceptada' ? '#/trabajo/' + s.id : '#/solicitud/' + s.id}" class="card p-4 flex gap-4 items-center hover:border-primary-container">
          ${s.fotos[0] ? `<img src="${s.fotos[0]}" class="w-16 h-16 object-cover border border-slate-950/70 shrink-0">` : `<div class="w-16 h-16 bg-surface-container shrink-0"></div>`}
          <div class="min-w-0 flex-1"><div class="flex flex-wrap gap-2 mb-1"><span class="chip-dark">${p.tipo === 'visita' ? 'Visita' : p.origen === 'tras_visita' ? 'Presupuesto tras visita' : 'Presupuesto directo'}</span>${est[p.estado] || ''}<span class="font-head text-[10px] text-on-surface-variant">#${s.id}</span></div>
            <div class="font-head font-semibold truncate">${esc(s.titulo)}</div><div class="text-xs text-on-surface-variant">${esc(s.zona)} · enviada ${p.fecha}</div></div>
          <div class="money text-lg">${A.money(A.totalPost(p))}</div></a>`).join('')}
      </div>`;
  };
})();

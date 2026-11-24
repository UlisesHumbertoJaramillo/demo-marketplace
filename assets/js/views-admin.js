/* Panel de administración (métricas + ABM de usuarios y roles) y Centro de arbitraje de disputas. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {}; A.live = A.live || {};
  const esc = A.esc;
  const can = (me, p) => me.rol === 'admin' && (me.permisos || []).includes(p);
  const PERMISOS = [['metricas', 'Métricas financieras'], ['usuarios', 'ABM de usuarios'], ['arbitraje', 'Arbitraje'], ['permisos', 'Gestión de permisos']];
  const estadoU = { activo: '<span class="chip-green">Activo</span>', pendiente: '<span class="chip-amber">Pendiente</span>', suspendido: '<span class="chip-red">Suspendido</span>', rechazado: '<span class="chip-gray">Rechazado</span>' };

  function metrics() {
    const S = A.state.solicitudes.filter((s) => s.escrow);
    const V = [].concat(...A.state.solicitudes.map((s) => A.visitas(s).filter((p) => p.visita && p.visita.cliente).map((p) => p.visita)));
    const sum = (f) => S.reduce((a, s) => a + (f(s) || 0), 0);
    const vig = (p) => (p.cliente - (p.reembolsado || 0)) / p.cliente; // parte vigente de una visita (sin lo reembolsado)
    const sumV = (f) => V.reduce((a, p) => a + Math.round(f(p) * vig(p)), 0);
    const cerradas = S.filter((s) => s.estado === 'completada').length;
    const resueltas = S.filter((s) => s.estado === 'resuelta').length;
    return {
      cobrado: sum((s) => s.escrow.cobrado) + V.reduce((a, p) => a + p.cliente, 0),
      nPagos: S.reduce((a, s) => a + s.escrow.pagos.length, 0) + V.length,
      porCobrar: sum((s) => A.porPagar(s).cliente),
      prestadores: sum((s) => s.escrow.liberadoPrestador) + sumV((p) => p.recibe),
      comisiones: sum((s) => s.escrow.comisionCobrada) + sumV((p) => p.fee),
      costoMP: sum((s) => s.escrow.costoMPTotal) + sumV((p) => p.mpFee),
      reembolsado: sum((s) => s.escrow.reembolsado) + V.reduce((a, p) => a + (p.reembolsado || 0), 0),
      garantia: sum((s) => s.escrow.garantia),
      deudas: A.state.users.reduce((a, u) => a + (u.deuda || 0), 0),
      disputas: S.filter((s) => s.estado === 'en_disputa').length,
      mediacion: S.filter((s) => s.estado === 'en_disputa' && s.disputa.fase === 'mediacion').length,
      vencidos: S.filter((s) => s.estado === 'en_disputa' && s.disputa.fase === 'arbitraje' && A.parseFecha(s.disputa.venceArbitro) < new Date()).length,
      pendienteCliente: sum((s) => s.escrow.pendienteCliente),
      tasaPin: cerradas + resueltas ? Math.round((cerradas / (cerradas + resueltas)) * 100) : 100,
      pendientes: A.state.users.filter((u) => u.rol === 'prestador' && u.estado === 'pendiente').length,
    };
  }

  /* =================== PANEL ADMIN =================== */
  A.views.admin = function (params, me) {
    const tab = (A.ui.admTab = A.ui.admTab || 'prestadores');
    const m = metrics();
    const tile = (color, lbl, val, sub, icon) => `<div class="card border-t-4 ${color} p-4"><div class="flex justify-between"><span class="lbl">${lbl}</span>${A.icon(icon, 'text-primary')}</div>
      <div class="money text-2xl md:text-3xl">${val}</div><div class="text-[11px] text-on-surface-variant mt-1">${sub}</div></div>`;
    const kpis = can(me, 'metricas') ? `<div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        ${tile('border-t-primary-container', 'Cobrado con split', A.money(m.cobrado), `${m.nPagos} pagos · falta cobrar ${A.money(m.porCobrar)} en etapas`, 'payments')}
        ${tile('border-t-tertiary', 'Acreditado a prestadores', A.money(m.prestadores), `Cerrados sin arbitraje: ${m.tasaPin}%`, 'account_balance_wallet')}
        ${tile('border-t-secondary-container', 'Comisiones (application_fee)', A.money(m.comisiones), `Costo MP: ${A.money(m.costoMP)} · reembolsado: ${A.money(m.reembolsado)}`, 'percent')}
        ${tile('border-t-red-500', 'Disputas abiertas', m.disputas + ' casos', `${m.mediacion} en mediación · ${m.vencidos} con plazo vencido · Deuda de prestadores: ${A.money(m.deudas)} · fondo de garantía usado: ${A.money(m.garantia)}${m.pendienteCliente ? ` · pendiente de reintegro: ${A.money(m.pendienteCliente)}` : ''}`, 'gavel')}
      </div>` : `<div class="card p-4 text-sm text-on-surface-variant">${A.icon('lock', '!text-base')} Tu usuario no tiene permiso para ver métricas financieras.</div>`;

    const tabs = [['prestadores', 'Prestadores', m.pendientes], ['solicitantes', 'Solicitantes', A.state.users.filter((u) => u.rol === 'cliente' && (u.reportes || []).some((r) => !r.resuelto)).length],
      ['denuncias', 'Denuncias', A.state.users.reduce((n, u) => n + (u.reportes || []).filter((r) => !r.resuelto).length, 0)],
      ['arbitros', 'Árbitros / Soporte'], ['admins', 'Administradores'], ['movimientos', 'Movimientos MP']];
    let content;
    if (tab === 'movimientos' && !can(me, 'metricas')) content = `<div class="p-6 text-sm">Sin permiso de métricas financieras.</div>`;
    else if (tab !== 'movimientos' && !can(me, 'usuarios') && !(tab === 'admins' && can(me, 'permisos'))) content = `<div class="p-6 text-sm">Sin permiso de ABM de usuarios.</div>`;
    else content = { prestadores: tabPrestadores, solicitantes: tabSolicitantes, denuncias: tabDenuncias, arbitros: tabArbitros, admins: tabAdmins, movimientos: tabMovimientos }[tab](me);

    return `<div class="bg-slate-950 text-white text-[11px] font-head">
        <div class="max-w-[1400px] mx-auto px-4 md:px-8 py-2 flex flex-wrap gap-x-6 gap-y-1 items-center">
          <span class="text-emerald-400">■ Cobros con split activos</span><span class="opacity-70">Integración Mercado Pago · split 1:1 (simulada)</span>
          <span class="opacity-70">Sesión: ${esc(A.fullName(me))} · permisos: ${(me.permisos || []).join(', ')}</span></div></div>` +
      A.pageHead('<span>Administración</span>', `<h1 class="text-2xl md:text-3xl font-bold tracking-tight">Panel de administración</h1>
        <p class="text-sm text-on-surface-variant mt-1">Métricas financieras, ABM de usuarios y roles, aprobación de prestadores.</p>`,
        `<a href="#/arbitraje" class="btn-dark">${A.icon('gavel')} Centro de arbitraje (${m.disputas})</a>`) +
      `<div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-5">${kpis}${configCard(me)}${configDisputasCard(me)}
        <div class="card">
          <div class="scroll-x flex border-b border-outline-variant">${tabs.map(([k, t, n]) => `<button class="px-4 py-3 font-head text-sm font-semibold whitespace-nowrap border-b-2 ${tab === k ? 'border-primary-container text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}" data-action="adm-tab" data-v="${k}">${t}${n ? ` <span class="bg-amber-500 text-white text-[10px] px-1.5 ml-1">${n}</span>` : ''}</button>`).join('')}</div>
          <div class="overflow-x-auto">${content}</div>
        </div></div>`;
  };
  /* Configuración: comisión de OficiosYa por tipo de cobro, costo de MP estimado y recuadros de demo.
     Todo lo paga el cliente: el prestador recibe exactamente lo que cotiza y OficiosYa su comisión completa. */
  function configCard(me) {
    if (!can(me, 'metricas') && !can(me, 'permisos')) return '';
    const pc = (x) => String(Math.round(x * 1000) / 10);
    const f = (A.ui.cfgCom = A.ui.cfgCom || Object.fromEntries(A.TIPOS_COMISION.map(([k]) => [k, pc(A.comision(k))])));
    const vm = A.ui.cfgMP != null ? A.ui.cfgMP : pc(A.state.costoMP);
    const ej = 100000; const cli = A.alCliente(ej); const mpf = Math.round(cli * A.state.costoMP);
    return `<div class="card p-4 md:p-5 space-y-3">
      <div class="sec-title">${A.icon('percent')} Comisiones de OficiosYa y costo de Mercado Pago</div>
      <p class="text-xs text-on-surface-variant max-w-3xl">La comisión se configura <b>por tipo de cobro</b> y <b>siempre la paga el cliente</b>: se suma al precio, nunca se descuenta al prestador. El costo de procesamiento de Mercado Pago también se suma al precio del cliente. Una etapa terminada que el cliente no aprueba ni observa en el plazo configurado se aprueba automáticamente. Así, en cada pago el prestador recibe exactamente lo que cotizó y OficiosYa cobra su comisión completa (application_fee). Un cambio aplica a los trabajos y visitas que se acepten desde ahora.</p>
      <div class="flex flex-wrap items-end gap-3">
        ${A.TIPOS_COMISION.map(([k, t]) => `<div><label class="lbl">${t} (%)</label><input type="number" min="0" max="50" step="0.5" class="inp w-28 font-head font-bold" data-model="cfgCom.${k}" value="${esc(f[k])}"></div>`).join('')}
        <div><label class="lbl">Costo MP estimado (%)</label><input type="number" min="0" max="20" step="0.1" class="inp w-28 font-head font-bold" data-model="cfgMP" value="${esc(vm)}"></div>
        <div><label class="lbl">Aprobación automática (días)</label><input type="number" min="1" max="60" step="1" class="inp w-28 font-head font-bold" data-model="cfgPlazo" value="${esc(A.ui.cfgPlazo != null ? A.ui.cfgPlazo : A.plazoAprob())}"></div>
        <button class="btn-primary" data-action="cfg-comision">${A.icon('check')} Guardar</button>
      </div>
      <p class="text-[11px] text-on-surface-variant">Ejemplo con los valores vigentes (etapa): el prestador cotiza ${A.money(ej)} → el cliente paga ${A.money(cli)}; Mercado Pago descuenta ~${A.money(mpf)}, OficiosYa recibe ${A.money(cli - ej - mpf)} y el prestador ${A.money(ej)}.</p>
      <label class="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" class="w-4 h-4 accent-[#2563eb]" data-action="cfg-demo" ${A.state.mostrarComision === false ? '' : 'checked'}> Mostrar los recuadros "SOLO DEMO" con el desglose de la comisión</label>
    </div>`;
  }
  A.actions['cfg-comision'] = () => {
    const f = A.ui.cfgCom || {}; const nuevas = {};
    for (const [k, t] of A.TIPOS_COMISION) {
      const v = Number(f[k] != null ? f[k] : A.comision(k) * 100);
      if (!(v >= 0 && v <= 50)) { A.toast(`${t}: ingresá una comisión entre 0 y 50%.`, 'err'); return; }
      nuevas[k] = Math.round(v * 10) / 1000;
    }
    const vm = Number(A.ui.cfgMP != null ? A.ui.cfgMP : A.state.costoMP * 100);
    if (!(vm >= 0 && vm <= 20)) { A.toast('Ingresá un costo de Mercado Pago entre 0 y 20%.', 'err'); return; }
    const pl = Number(A.ui.cfgPlazo != null ? A.ui.cfgPlazo : A.plazoAprob());
    if (!(pl >= 1 && pl <= 60 && Number.isInteger(pl))) { A.toast('El plazo de aprobación automática tiene que ser de 1 a 60 días.', 'err'); return; }
    A.state.comisiones = nuevas; A.state.costoMP = Math.round(vm * 10) / 1000; A.state.plazoAprobacion = pl; A.ui.cfgCom = null; A.ui.cfgMP = null; A.ui.cfgPlazo = null;
    A.commit(`Comisiones (${A.TIPOS_COMISION.map(([k]) => A.pct(nuevas[k])).join(' / ')}) , costo MP ${A.pct(A.state.costoMP)} y aprobación automática a los ${pl} días guardados. Aplican a los trabajos y visitas que se acepten desde ahora.`, 'ok');
  };
  /* Configuración de disputas y garantías */
  const CFG_DISP = [['plazoMediacion', 'Mediación entre partes (horas)', 72, 1, 240], ['plazoVisita', 'Visitas: confirmación y respuesta a "no vino" (horas)', 48, 1, 240], ['plazoArbitro', 'Plazo del árbitro (días hábiles)', 10, 1, 60], ['plazoCorreccion', 'Corrección por defecto (días)', 5, 1, 30],
    ['plazoReclamo', 'Reclamos por garantía (días desde el cierre)', 90, 1, 365], ['topeGarantia', 'Tope del fondo de garantía por caso ($)', 100000, 0, 10000000], ['deudaMaxima', 'Deuda máxima antes de suspender ($)', 50000, 0, 10000000]];
  function configDisputasCard(me) {
    if (!can(me, 'metricas') && !can(me, 'permisos')) return '';
    const f = (A.ui.cfgDisp = A.ui.cfgDisp || Object.fromEntries(CFG_DISP.map(([k, , d]) => [k, String(A.cfg(k, d))])));
    return `<div class="card p-4 md:p-5 space-y-3">
      <div class="sec-title">${A.icon('gavel')} Disputas y garantías</div>
      <p class="text-xs text-on-surface-variant max-w-3xl">Toda disputa empieza con una mediación entre las partes; si no hay acuerdo en el plazo, pasa al árbitro, que tiene un plazo para resolver. El fondo de garantía cubre al cliente cuando un reembolso falla por falta de saldo del prestador, hasta un tope por caso; si la deuda del prestador supera el máximo, su cuenta se suspende automáticamente.</p>
      <div class="flex flex-wrap items-end gap-3">
        ${CFG_DISP.map(([k, t, , min, max]) => `<div><label class="lbl">${t}</label><input type="number" min="${min}" max="${max}" class="inp w-36 font-head font-bold" data-model="cfgDisp.${k}" value="${esc(f[k])}"></div>`).join('')}
        <button class="btn-primary" data-action="cfg-disputas">${A.icon('check')} Guardar</button>
      </div></div>`;
  }
  A.actions['cfg-disputas'] = () => {
    const f = A.ui.cfgDisp || {}; const nuevos = {};
    for (const [k, t, d, min, max] of CFG_DISP) {
      const v = Number(f[k] != null ? f[k] : A.cfg(k, d));
      if (!(Number.isInteger(v) && v >= min && v <= max)) { A.toast(`${t}: ingresá un número entero entre ${min} y ${max}.`, 'err'); return; }
      nuevos[k] = v;
    }
    Object.assign(A.state, nuevos); A.ui.cfgDisp = null;
    A.commit('Configuración de disputas y garantías guardada.', 'ok');
  };
  A.actions['cfg-demo'] = (el) => { A.state.mostrarComision = !!el.checked; A.commit(el.checked ? 'Recuadros de demo visibles.' : 'Recuadros de demo ocultos.'); };
  A.actions['adm-tab'] = (el) => { A.ui.admTab = el.dataset.v; A.rerender(); };

  function tabPrestadores() {
    const filtro = A.ui.admPrest || 'pendiente';
    const list = A.state.users.filter((u) => u.rol === 'prestador' && (filtro === 'todos' || u.estado === filtro));
    return `<div class="p-4 flex flex-wrap gap-2 items-center justify-between">
        <div class="text-sm text-on-surface-variant">Validación de credenciales de oficio, aprobación de perfiles y control de estado.</div>
        <div class="flex gap-1">${[['pendiente', 'Pendientes'], ['activo', 'Activos'], ['suspendido', 'Suspendidos'], ['todos', 'Todos']].map(([k, t]) => `<button class="chip !py-1 !px-2 ${filtro === k ? 'bg-primary-container text-white border-primary-container' : 'bg-white border-outline-variant'}" data-action="adm-prest" data-v="${k}">${t}</button>`).join('')}</div></div>
      <table class="tbl w-full min-w-[820px]"><thead><tr><th>Prestador</th><th>DNI / CUIT</th><th>Oficio y credencial</th><th>Foto de rostro</th><th>Email</th><th>Estado</th><th class="text-right">Acciones</th></tr></thead><tbody>
      ${list.length ? list.map((u) => `<tr>
        <td><div class="font-semibold">${esc(A.fullName(u))}</div><div class="text-xs text-on-surface-variant">${esc(u.zona || '')}</div></td>
        <td class="font-head tnum text-xs">${esc(u.dni)}</td>
        <td><div class="text-sm">${esc(u.oficio)}</div><div class="text-xs text-primary font-head">${esc(u.matricula || '—')}</div>
          <div class="flex flex-wrap gap-1 mt-1">${u.mpCuenta ? `<span class="chip-blue" title="${esc(u.mpCuenta.usuario)}">MP vinculada · KYC ${u.mpCuenta.kyc || '?'}</span>` : '<span class="chip-red">Sin cuenta MP</span>'}${u.deuda ? `<span class="chip-red">Deuda ${A.money(u.deuda)}</span>` : ''}${u.suspendidoPorDeuda && u.estado === 'suspendido' ? '<span class="chip-red">Suspendido por deuda</span>' : ''}${(() => { const d = A.statsDisputas(u.id); return (d.enContraPrestador ? `<span class="chip-amber">${d.enContraPrestador} fallo(s) en contra</span>` : '') + (d.garantiaSinResolver ? `<span class="chip-amber">${d.garantiaSinResolver} garantía(s) sin resolver</span>` : '') + (d.revisar ? '<span class="chip-red">Revisar</span>' : ''); })()}${u.matriculaRequerida ? '<span class="chip-amber">Matrícula obligatoria</span>' : ''}${u.matriculaFoto ? `<button class="chip-blue" data-action="zoom" data-src="${u.matriculaFoto}">${A.icon('image', '!text-xs')} Foto matrícula</button>` : ''}${(u.reportes || []).some((r) => !r.resuelto) ? `<span class="chip-red">${(u.reportes || []).filter((r) => !r.resuelto).length} denuncia(s)</span>` : ''}</div></td>
        <td>${u.foto ? `<button data-action="zoom" data-src="${u.foto}" class="flex items-center gap-2">${A.avatar(u, 'w-10 h-10')}<span class="chip-blue">Ver</span></button>` : '<span class="chip-red">Sin foto</span>'}</td>
        <td>${u.emailVerificado ? '<span class="chip-green">Verificado</span>' : '<span class="chip-amber">Sin verificar</span>'}</td>
        <td>${estadoU[u.estado]}</td>
        <td class="text-right whitespace-nowrap">${accionesUsuario(u)}</td></tr>`).join('') : `<tr><td colspan="7" class="text-center text-on-surface-variant py-8">No hay prestadores en este estado.</td></tr>`}
      </tbody></table>`;
  }
  function accionesUsuario(u) {
    if (u.estado === 'pendiente') return `<button class="btn-success btn-sm" data-action="u-estado" data-id="${u.id}" data-v="activo">Aprobar</button> <button class="btn-ghost btn-sm" data-action="u-estado" data-id="${u.id}" data-v="rechazado">Rechazar</button>`;
    if (u.estado === 'activo') return `<button class="btn-danger btn-sm" data-action="u-estado" data-id="${u.id}" data-v="suspendido">${u.rol === 'arbitro' ? 'Dar de baja' : 'Suspender'}</button>`;
    return `<button class="btn-ghost btn-sm" data-action="u-estado" data-id="${u.id}" data-v="activo">Reactivar</button>`;
  }
  A.actions['adm-prest'] = (el) => { A.ui.admPrest = el.dataset.v; A.rerender(); };
  A.actions['u-estado'] = (el) => {
    const u = A.user(el.dataset.id); u.estado = el.dataset.v;
    const msg = { activo: 'aprobado / activo', suspendido: 'suspendido', rechazado: 'rechazado' }[u.estado];
    A.commit(`${esc(A.fullName(u))}: ${msg}. Se notificó por email.`, u.estado === 'activo' ? 'ok' : 'info');
  };

  function tabSolicitantes() {
    const list = A.state.users.filter((u) => u.rol === 'cliente');
    return `<div class="p-4 text-sm text-on-surface-variant">Gestión de cuentas de clientes, moderación y resolución de reportes.</div>
      <table class="tbl w-full min-w-[820px]"><thead><tr><th>Solicitante</th><th>DNI / CUIT</th><th>Contacto</th><th>Solicitudes</th><th>Reportes</th><th>Estado</th><th class="text-right">Acciones</th></tr></thead><tbody>
      ${list.map((u) => {
        const rep = (u.reportes || []).filter((r) => !r.resuelto);
        return `<tr><td><div class="flex items-center gap-2">${A.avatar(u, 'w-9 h-9')}<span class="font-semibold">${esc(A.fullName(u))}</span></div></td>
        <td class="font-head tnum text-xs">${esc(u.dni)}</td>
        <td class="text-xs">${esc(u.email)}<br>${esc(u.tel || '')}</td>
        <td class="font-head">${A.state.solicitudes.filter((s) => s.clienteId === u.id).length}${(() => { const d = A.statsDisputas(u.id); return d.abiertas ? `<div class="text-[11px] font-body">${d.abiertas} disputa(s) · ${d.perdidasCliente} perdida(s)${d.revisar ? ' <span class="chip-red">Revisar</span>' : ''}</div>` : ''; })()}</td>
        <td>${rep.length ? rep.map((r) => `<div class="text-xs bg-amber-50 border border-amber-600 p-1.5 mb-1 max-w-[260px]">${esc(r.texto)}<br><button class="underline font-semibold mt-1" data-action="rep-ok" data-u="${u.id}" data-r="${r.id}">Marcar resuelto</button></div>`).join('') : '<span class="text-xs text-on-surface-variant">Sin reportes</span>'}</td>
        <td>${estadoU[u.estado]}</td><td class="text-right whitespace-nowrap">${accionesUsuario(u)}</td></tr>`;
      }).join('')}</tbody></table>`;
  }
  function tabDenuncias() {
    const filtro = A.ui.denFiltro || 'abiertas';
    const rows = [];
    A.state.users.forEach((u) => (u.reportes || []).forEach((r) => { if ((filtro === 'abiertas') === !r.resuelto) rows.push({ u, r }); }));
    rows.sort((a, b) => (b.r.fecha || '').localeCompare(a.r.fecha || ''));
    return `<div class="p-4 flex flex-wrap gap-2 items-center justify-between">
        <div class="text-sm text-on-surface-variant">Denuncias de acoso, agresiones, ausencias a visitas y otros reportes entre usuarios, con su evidencia.</div>
        <div class="flex gap-1">${[['abiertas', 'Abiertas'], ['resueltas', 'Resueltas']].map(([k, t]) => `<button class="chip !py-1 !px-2 ${filtro === k ? 'bg-primary-container text-white border-primary-container' : 'bg-white border-outline-variant'}" data-action="den-filtro" data-v="${k}">${t}</button>`).join('')}</div></div>
      <div class="divide-y divide-outline-variant/60 border-t border-outline-variant">${rows.length ? rows.map(({ u, r }) => {
        const autor = r.autorId ? A.user(r.autorId) : null;
        return `<div class="p-4 grid md:grid-cols-[1fr_auto] gap-3">
          <div class="space-y-1 min-w-0">
            <div class="flex flex-wrap gap-2 items-center">${r.grave ? '<span class="chip-red">' + esc(r.tipo || 'Denuncia') + '</span>' : '<span class="chip-amber">' + esc(r.tipo || 'Reporte') + '</span>'}
              ${r.solicitudId ? `<a class="font-head text-[11px] underline text-primary" href="#/trabajo/${r.solicitudId}">#${r.solicitudId}</a>` : ''}<span class="text-[11px] text-on-surface-variant">${esc(r.fecha || '')}</span>
              ${r.bloquear && !r.resuelto ? '<span class="chip-gray">Contacto oculto al denunciado</span>' : ''}</div>
            <div class="text-sm"><b>Denunciado:</b> ${esc(A.fullName(u))} (${A.ROL_LABEL[u.rol]}) ${estadoU[u.estado] || ''}${autor ? ` · <b>Denunciante:</b> ${esc(A.fullName(autor))}` : ''}</div>
            <p class="text-sm bg-surface-container-low border border-outline-variant/60 p-2 whitespace-pre-line">${esc(r.texto)}</p>
            ${(r.fotos || []).length ? A.gallery(r.fotos, { cols: 'grid-cols-4 md:grid-cols-6', label: 'EVIDENCIA' }) : '<div class="text-[11px] text-on-surface-variant">Sin evidencia adjunta.</div>'}
          </div>
          <div class="flex md:flex-col gap-2 items-start">${!r.resuelto ? `<button class="btn-ghost btn-sm" data-action="rep-ok" data-u="${u.id}" data-r="${r.id}">Marcar resuelta</button>
            ${u.estado === 'activo' ? `<button class="btn-danger btn-sm" data-action="den-suspender" data-u="${u.id}" data-r="${r.id}">Suspender denunciado</button>` : ''}` : '<span class="chip-green">Resuelta</span>'}</div>
        </div>`;
      }).join('') : `<div class="p-8 text-center text-sm text-on-surface-variant">No hay denuncias ${filtro}.</div>`}</div>`;
  }
  A.actions['den-filtro'] = (el) => { A.ui.denFiltro = el.dataset.v; A.rerender(); };
  A.actions['den-suspender'] = (el) => {
    const u = A.user(el.dataset.u); u.estado = 'suspendido';
    const r = u.reportes.find((x) => x.id === el.dataset.r); r.resuelto = true;
    A.commit(`${esc(A.fullName(u))} fue suspendido/a y la denuncia quedó resuelta. Se notificó por email.`, 'ok');
  };
  A.actions['rep-ok'] = (el) => {
    const u = A.user(el.dataset.u); const r = u.reportes.find((x) => x.id === el.dataset.r); r.resuelto = true;
    A.commit('Reporte marcado como resuelto.', 'ok');
  };

  function altaForm(kind) {
    const f = (A.ui['alta' + kind] = A.ui['alta' + kind] || {});
    return `<div class="p-4 bg-surface-container-low border-t border-outline-variant grid sm:grid-cols-[1fr_1fr_1.4fr_auto] gap-2 items-end">
      <div><label class="lbl">Nombre</label><input class="inp" data-model="alta${kind}.nombre" value="${esc(f.nombre || '')}"></div>
      <div><label class="lbl">Apellido</label><input class="inp" data-model="alta${kind}.apellido" value="${esc(f.apellido || '')}"></div>
      <div><label class="lbl">Email corporativo</label><input class="inp" data-model="alta${kind}.email" value="${esc(f.email || '')}" placeholder="nombre@oficiosya.com"></div>
      <button class="btn-primary" data-action="alta" data-kind="${kind}">${A.icon('person_add')} Dar de alta</button></div>`;
  }
  A.actions.alta = (el) => {
    const kind = el.dataset.kind; const f = A.ui['alta' + kind] || {};
    if (!f.nombre || !f.apellido || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email || '')) { A.toast('Completá nombre, apellido y un email válido.', 'err'); return; }
    A.state.users.push({ id: 'u-' + Date.now(), rol: kind, nombre: f.nombre.trim(), apellido: f.apellido.trim(), dni: '-', email: f.email.trim(), pass: 'demo1234', emailVerificado: true, foto: '', estado: 'activo', permisos: kind === 'admin' ? ['usuarios'] : undefined });
    A.ui['alta' + kind] = {};
    A.commit(`${kind === 'admin' ? 'Administrador' : 'Árbitro'} dado de alta. Se envió invitación por email (contraseña inicial de la demo: demo1234).`, 'ok');
  };

  function tabArbitros() {
    const list = A.state.users.filter((u) => u.rol === 'arbitro');
    return `<div class="p-4 text-sm text-on-surface-variant">Personal dedicado exclusivamente a revisar evidencias y resolver disputas de pagos.</div>
      <table class="tbl w-full min-w-[640px]"><thead><tr><th>Árbitro</th><th>Email</th><th>Casos asignados</th><th>Estado</th><th class="text-right">Acciones</th></tr></thead><tbody>
      ${list.map((u) => {
        const casos = A.state.solicitudes.filter((s) => s.disputa && s.disputa.arbitroId === u.id);
        return `<tr><td class="font-semibold">${esc(A.fullName(u))}</td><td class="text-xs">${esc(u.email)}</td>
          <td class="text-xs">${casos.length ? casos.map((s) => `<a class="underline text-primary mr-2" href="#/arbitraje/${s.id}">${s.disputa.id}</a>`).join('') : '—'}</td>
          <td>${estadoU[u.estado]}</td><td class="text-right">${accionesUsuario(u)}</td></tr>`;
      }).join('')}</tbody></table>${altaForm('arbitro')}`;
  }

  function tabAdmins(me) {
    const list = A.state.users.filter((u) => u.rol === 'admin');
    const edit = can(me, 'permisos');
    return `<div class="p-4 text-sm text-on-surface-variant">Gestión de permisos globales. ${edit ? '' : '<b>Tu usuario no puede modificar permisos.</b>'}</div>
      <table class="tbl w-full min-w-[720px]"><thead><tr><th>Administrador</th><th>Email</th>${PERMISOS.map((p) => `<th class="text-center">${p[1]}</th>`).join('')}<th>Estado</th></tr></thead><tbody>
      ${list.map((u) => `<tr><td class="font-semibold">${esc(A.fullName(u))}${u.id === me.id ? ' <span class="chip-gray">Vos</span>' : ''}</td><td class="text-xs">${esc(u.email)}</td>
        ${PERMISOS.map((p) => `<td class="text-center"><input type="checkbox" class="w-4 h-4 accent-[#2563eb]" data-action="perm" data-u="${u.id}" data-p="${p[0]}" ${(u.permisos || []).includes(p[0]) ? 'checked' : ''} ${edit && !(u.id === me.id && p[0] === 'permisos') ? '' : 'disabled'}></td>`).join('')}
        <td>${estadoU[u.estado]}</td></tr>`).join('')}</tbody></table>${edit ? altaForm('admin') : ''}`;
  }
  A.actions.perm = (el) => {
    const u = A.user(el.dataset.u); const p = el.dataset.p; u.permisos = u.permisos || [];
    if (u.permisos.includes(p)) u.permisos = u.permisos.filter((x) => x !== p); else u.permisos.push(p);
    A.commit(`Permisos de ${esc(A.fullName(u))} actualizados.`, 'ok');
  };

  function tabMovimientos() {
    return `<div class="p-4 text-sm text-on-surface-variant">Registro de operaciones sobre la cuenta colectora (simulado — en producción vía API y webhooks de Mercado Pago).</div>
      <table class="tbl w-full min-w-[820px]"><thead><tr><th>Fecha</th><th>Operación</th><th>Solicitud</th><th class="text-right">Monto</th><th>Llamada / detalle</th></tr></thead><tbody>
      ${A.state.movimientos.map((m) => `<tr><td class="font-head text-xs tnum whitespace-nowrap">${m.fecha}</td><td class="font-semibold text-sm">${esc(m.tipo)}</td>
        <td><a class="underline text-primary font-head text-xs" href="#/trabajo/${m.solicitudId}">#${m.solicitudId}</a></td>
        <td class="text-right money">${A.money(m.monto)}</td><td class="font-mono text-[11px] text-on-surface-variant">${esc(m.api)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  /* =================== CENTRO DE ARBITRAJE =================== */
  A.views.arbitraje = function (params, me) {
    if (me.rol === 'admin' && !can(me, 'arbitraje')) return A.noAccess('Tu usuario administrador no tiene el permiso de arbitraje.');
    const all = A.state.solicitudes.filter((s) => s.disputa);
    const visibles = me.rol === 'arbitro' ? all.filter((s) => !s.disputa.arbitroId || s.disputa.arbitroId === me.id) : all;
    const filtro = A.ui.arbFiltro || 'abiertas';
    const resuelto = (s) => s.estado !== 'en_disputa' && !!s.disputa.resolucion;
    const lista = visibles.filter((s) => (filtro === 'abiertas' ? s.estado === 'en_disputa' : resuelto(s)));
    const sel = A.sol(params[0]) && A.sol(params[0]).disputa ? A.sol(params[0]) : lista[0];

    const caseTab = (s) => `<a href="#/arbitraje/${s.id}" class="block min-w-[220px] p-3 border ${sel && sel.id === s.id ? 'bg-white border-primary-container shadow-hard-sm' : 'bg-surface-container-low border-outline-variant/60 hover:bg-white'}">
        <div class="flex justify-between gap-2"><span class="font-head text-[10px] text-primary font-bold">CASO #${s.disputa.id}</span>${s.estado !== 'en_disputa' ? '<span class="chip-gray">Resuelto</span>' : s.disputa.fase === 'mediacion' ? '<span class="chip-amber">Mediación entre partes</span>' : A.parseFecha(s.disputa.venceArbitro) < new Date() ? '<span class="chip-red">Plazo vencido</span>' : s.disputa.arbitroId ? '<span class="chip-red">En arbitraje</span>' : '<span class="chip-amber">Sin asignar</span>'}</div>
        <div class="font-head font-semibold text-sm truncate mt-1">${esc(s.titulo)}</div>
        <div class="flex justify-between text-xs mt-1"><span class="text-on-surface-variant truncate">${esc(A.user(s.clienteId).nombre)} vs ${esc(A.user(s.asignada.prestadorId).nombre)}</span><span class="money text-secondary">${A.money(s.estado === 'en_disputa' ? A.enJuego(s) : s.escrow.cobrado)}</span></div></a>`;

    return A.pageHead('<span>Arbitraje & auditoría</span>',
      `<div class="flex items-center gap-3"><span class="bg-primary-container text-white w-11 h-11 flex items-center justify-center">${A.icon('gavel', '!text-2xl')}</span>
        <div><h1 class="text-xl md:text-2xl font-bold tracking-tight">Centro de arbitraje de disputas y mediación de pagos</h1>
        <p class="text-xs text-on-surface-variant">Mediación entre las partes y, si no hay acuerdo, dictamen del árbitro: corregir la etapa o reembolsar su pago vía Mercado Pago.</p></div></div>`,
      `<div class="flex gap-1">${[['abiertas', 'Abiertas'], ['resueltas', 'Resueltas']].map(([k, t]) => `<button class="chip !py-1.5 !px-3 ${filtro === k ? 'bg-slate-950 text-white border-slate-950' : 'bg-white border-outline-variant'}" data-action="arb-filtro" data-v="${k}">${t} (${visibles.filter((s) => (k === 'abiertas' ? s.estado === 'en_disputa' : resuelto(s))).length})</button>`).join('')}</div>`) +
      `<div class="max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-5">
        <div class="scroll-x flex gap-2 pb-1">${lista.length ? lista.map(caseTab).join('') : `<div class="text-sm text-on-surface-variant p-4 card w-full">No hay casos ${filtro}.${me.rol === 'arbitro' ? ' (Ves los casos asignados a vos y los sin asignar.)' : ''}</div>`}</div>
        ${sel ? caso(sel, me) : ''}
        ${A.visitasArbitrajeHtml(me)}
      </div>`;
  };
  A.actions['arb-filtro'] = (el) => { A.ui.arbFiltro = el.dataset.v; A.go('#/arbitraje'); };

  function caso(s, me) {
    const d = s.disputa; const cl = A.user(s.clienteId); const pr = A.user(s.asignada.prestadorId); const e = s.escrow;
    const p = A.postAceptada(s);
    const puedeResolver = s.estado === 'en_disputa' && d.fase !== 'mediacion' && (me.rol === 'admin' || d.arbitroId === me.id);
    const vencido = d.fase === 'arbitraje' && s.estado === 'en_disputa' && A.parseFecha(d.venceArbitro) < new Date();
    const arbitros = A.state.users.filter((u) => u.rol === 'arbitro' && u.estado === 'activo');

    const asign = me.rol === 'admin' && s.estado === 'en_disputa'
      ? `<select class="inp !py-1 !text-xs max-w-[200px]" data-change-arb="${s.id}"><option value="">Sin asignar</option>${arbitros.map((a) => `<option value="${a.id}" ${d.arbitroId === a.id ? 'selected' : ''}>${esc(A.fullName(a))}</option>`).join('')}</select>`
      : d.arbitroId ? `<b>${esc(A.fullName(A.user(d.arbitroId)))}</b>` : (me.rol === 'arbitro' ? `<button class="btn-primary btn-sm" data-action="arb-tomar" data-s="${s.id}">Tomar caso</button>` : 'Sin asignar');

    const columna = (titulo, color, u, side, extra) => `<div class="card p-4 md:p-5 space-y-3">
        <div class="flex justify-between items-start gap-2"><div class="font-head font-semibold uppercase text-sm flex items-center gap-2"><span class="w-3 h-3 ${color} inline-block"></span>${titulo}</div><span class="chip-gray !normal-case">${esc(A.fullName(u))}</span></div>
        <div><div class="font-head text-[10px] font-bold uppercase tracking-wider ${color === 'bg-amber-700' ? 'text-amber-700' : 'text-primary'} mb-1">Declaración en plataforma</div>
          <p class="text-sm italic bg-surface-container-low border border-outline-variant/60 p-3 whitespace-pre-line">${side.declaracion ? '“' + esc(side.declaracion) + '”' : '<span class="not-italic text-on-surface-variant">Todavía no presentó descargo.</span>'}</p></div>
        <div><div class="lbl">Contra-evidencias adjuntas (${side.fotos.length})</div>${A.gallery(side.fotos, { label: 'CONTRA', cols: 'grid-cols-2', empty: 'Sin contra-evidencias.' })}</div>
        ${extra}</div>`;

    const comp = `<div class="card p-4 md:p-5">
      <div class="sec-title mb-3">${A.icon('compare')} Comparación: estado inicial vs trabajo entregado</div>
      <div class="grid grid-cols-2 gap-2 md:gap-3">
        ${[['Estado inicial (cliente)', s.fotos[0]], ['Trabajo entregado (prestador)', s.evidenciasPost[0]]].map(([t, src]) => `<figure class="border border-slate-950 relative">
          ${src ? `<img src="${src}" class="w-full aspect-video object-cover cursor-zoom-in" data-action="zoom" data-src="${src}">` : `<div class="aspect-[4/3] bg-surface-container flex items-center justify-center text-xs text-on-surface-variant">Sin foto</div>`}
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center"><span class="w-8 h-8 border border-white/80"></span></div>
          <figcaption class="bg-slate-950 text-white font-head text-[10px] px-2 py-1 uppercase tracking-wide">${t}</figcaption></figure>`).join('')}
      </div></div>`;

    const hechos = s.hitos.filter((h) => h.estado === 'completado').length;
    const resumen = `<div class="card p-4 md:p-5 grid sm:grid-cols-4 gap-4">
      <div><div class="lbl !mb-0">Pagos con split</div><div class="font-head text-primary font-semibold">${e.pagos.length} pago(s)</div><div class="text-[11px] text-on-surface-variant">Primero: ${esc(e.paymentId)}</div></div>
      <div><div class="lbl !mb-0">En disputa (etapa en curso)</div><div class="money text-secondary text-lg">${A.money(A.enJuego(s))} ARS</div><div class="text-[11px] text-on-surface-variant">Cobrado en total ${A.money(e.cobrado)} · lo aprobado no se discute</div></div>
      <div><div class="lbl !mb-0">Motivo declarado</div><div class="text-sm font-semibold">${esc(d.motivo)}</div><div class="text-[11px] text-on-surface-variant">Abierta por el ${d.abiertaPor} · ${d.fecha}</div>
        ${s.estado === 'en_disputa' ? (d.fase === 'mediacion' ? `<div class="text-[11px] text-amber-700 font-semibold">Mediación hasta el ${A.fmtFecha(A.parseFecha(d.venceMediacion))}</div>` : `<div class="text-[11px] font-semibold ${vencido ? 'text-red-600' : 'text-primary'}">${vencido ? 'Plazo para resolver vencido' : 'Resolver antes del'} ${A.fmtFecha(A.parseFecha(d.venceArbitro))}</div>`) : ''}</div>
      <div><div class="lbl !mb-0">Árbitro asignado</div><div class="text-sm mt-0.5">${asign}</div></div>
      <div class="sm:col-span-4 flex flex-wrap gap-2 text-xs">
        ${s.hitos.some((h) => h.auto) ? `<span class="chip-amber">Etapas aprobadas automáticamente: ${s.hitos.filter((h) => h.auto).length}</span>` : ''}
        <span class="chip-blue">Etapas aprobadas: ${hechos} de ${s.hitos.length} · pagadas: ${s.hitos.filter((h) => h.pagado).length}</span>
        ${pr.deuda ? `<span class="chip-red">Deuda del prestador: ${A.money(pr.deuda)}</span>` : ''}
        ${(d.propuestas || []).length ? `<span class="chip-gray">Propuestas en la mediación: ${d.propuestas.map((x) => `${x.por} → ${x.tipo === 'corregir' ? 'corregir en ' + x.plazo + ' días' : x.tipo === 'parcial' ? 'reembolso de ' + A.money(x.monto) : x.tipo} (${x.estado})`).join(' · ')}</span>` : ''}
        ${A.statsDisputas(s.clienteId).revisar ? '<span class="chip-red">Cliente marcado para revisión (disputas perdidas)</span>' : ''}${A.statsDisputas(pr.id).revisar ? '<span class="chip-red">Prestador marcado para revisión (fallos en contra)</span>' : ''}
        ${s.ajuste ? `<span class="chip-amber">Ajuste de precio: ${A.money(s.ajuste.actual)} → ${A.money(s.ajuste.propuesto)} (${s.ajuste.estado})</span>` : ''}
        <span class="chip-gray">Presupuesto: mano de obra ${A.money(A.manoObra(p))} + insumos ${A.money(p.incluyeMateriales ? p.costoMateriales : 0)}</span>
        <a href="#/trabajo/${s.id}" class="underline text-primary self-center">Ver expediente completo</a>
      </div></div>`;

    let dictamen;
    if (s.estado !== 'en_disputa' && d.resolucion) {
      const r = d.resolucion;
      dictamen = `<div class="card border-2 border-slate-950 p-5"><div class="sec-title">${A.icon('task_alt')} Dictamen ejecutado</div>
        <div class="font-head font-bold text-lg mt-2">${esc(r.titulo)}</div><p class="text-sm">${esc(r.detalle)}</p>
        ${r.nota ? `<p class="text-sm mt-2 bg-surface-container-low border border-outline-variant/60 p-2"><b>Fundamento:</b> ${esc(r.nota)}</p>` : ''}
        <div class="font-mono text-[11px] bg-slate-950 text-emerald-300 p-3 mt-3 overflow-x-auto">${esc(r.api)}</div>
        <div class="text-[11px] text-on-surface-variant mt-2">${r.por === 'acuerdo' ? 'Acuerdo entre las partes en la mediación' : esc(A.fullName(A.user(r.arbitroId)))} · ${r.fecha}</div>
        ${r.tipo === 'corregir' && s.correccion ? `<div class="text-xs mt-2 ${s.correccion.incumplida ? 'text-red-700' : s.correccion.cumplida ? 'text-tertiary' : 'text-amber-700'}">Corrección: ${s.correccion.incumplida ? 'no se cumplió en el plazo; se reembolsó la etapa' : s.correccion.cumplida ? 'cumplida en el plazo' : 'en curso, vence el ' + A.fmtFecha(A.parseFecha(s.correccion.vence))}</div>` : ''}</div>`;
    } else if (d.fase === 'mediacion') {
      dictamen = `<div class="card border-2 border-amber-600 p-5 space-y-2"><div class="sec-title">${A.icon('schedule')} Mediación entre las partes</div>
        <p class="text-sm">El cliente y el prestador tienen hasta el <b>${A.fmtFecha(A.parseFecha(d.venceMediacion))}</b> para llegar a un acuerdo. Si no lo hay, el caso pasa automáticamente al árbitro, que tiene ${A.cfg('plazoArbitro', 10)} días hábiles para resolver.</p>
        ${me.rol === 'admin' || me.rol === 'arbitro' ? `<button class="btn-dark btn-sm" data-action="arb-escalar" data-s="${s.id}">${A.icon('gavel')} Pasar a arbitraje ahora</button>` : ''}</div>`;
    } else if (!puedeResolver) {
      dictamen = `<div class="card p-5 text-sm text-on-surface-variant">${A.icon('info')} ${me.rol === 'arbitro' && !d.arbitroId ? 'Tomá el caso para poder emitir el dictamen.' : 'Solo el árbitro asignado o un administrador pueden emitir el dictamen.'}</div>`;
    } else {
      const enJ = A.enJuego(s); const pagos = A.pagosEnJuego(s);
      const f = (A.ui.dict = A.ui.dict || {})[s.id] = (A.ui.dict[s.id] || { reembolso: String(Math.round(enJ * 0.3)), nota: '', sinSaldo: false, plazo: String(A.cfg('plazoCorreccion', 5)) });
      const parc = calcParcial(s, Number(f.reembolso) || 0);
      const prestEnJ = pagos.reduce((a, p) => a + Math.round((p.recibe * (p.cliente - p.reembolsado)) / p.cliente), 0);
      dictamen = `<div class="card p-4 md:p-5">
        <div class="flex flex-wrap justify-between gap-2 items-center mb-1"><div class="sec-title">${A.icon('terminal')} Panel de dictamen y ejecución financiera</div>
          <span class="font-mono text-[10px] bg-surface-container px-2 py-1">POST /v1/payments/{id}/refunds</span></div>
        ${vencido ? `<div class="bg-red-50 border border-red-500 text-red-700 text-xs p-2 mb-3">${A.icon('warning', '!text-sm')} Venció el plazo para resolver (${A.cfg('plazoArbitro', 10)} días hábiles). Resolvé cuanto antes: Mercado Pago permite reembolsar solo hasta 180 días después del pago.</div>` : ''}
        <p class="text-xs text-on-surface-variant mb-3">Se resuelve sobre el <b>pago de la etapa en curso (${A.money(enJ)})</b>, que ya está en la cuenta del prestador: lo aprobado por el cliente no se discute. El reembolso se le pide a Mercado Pago, que lo descuenta en proporción de la cuenta del prestador y de la comisión. Las etapas sin pagar se cancelan. Al confirmar se notifica a ambas partes por email.</p>
        <label class="flex items-start gap-2 text-xs mb-4 cursor-pointer border border-dashed border-amber-600 bg-amber-50/70 p-2"><input type="checkbox" class="w-4 h-4 mt-0.5 accent-[#b45309]" data-action="dict-sinsaldo" data-s="${s.id}" ${f.sinSaldo ? 'checked' : ''}>
          <span><b>Demo:</b> simular que el prestador no tiene saldo en Mercado Pago. El reembolso falla, OficiosYa le reintegra al cliente con su fondo de garantía y el monto queda como deuda del prestador (se recupera de sus próximos cobros).</span></label>
        <div class="mb-4"><label class="lbl">Fundamento del dictamen (opcional)</label><textarea rows="2" class="inp" data-model="dict.${s.id}.nota" placeholder="Ej. La mano de obra principal fue ejecutada (70%) pero requiere re-ajuste de unión.">${esc(f.nota)}</textarea></div>
        <div class="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div class="border-2 border-primary-container p-4 flex flex-col">
            <div class="font-head font-bold text-primary text-sm uppercase">${A.icon('handyman', '!text-base')} Recomendado primero</div>
            <div class="font-head font-semibold">Corregir la etapa</div>
            <p class="text-xs text-on-surface-variant my-2">El prestador corrige la etapa sin costo dentro del plazo. Si no la marca como terminada a tiempo, se reembolsa automáticamente el pago de la etapa.</p>
            <label class="lbl">Plazo (días)</label><input type="number" min="1" max="30" class="inp" data-model="dict.${s.id}.plazo" value="${esc(f.plazo)}">
            <button class="btn-primary btn-sm mt-auto w-full !mt-3" data-action="resolver" data-tipo="corregir" data-s="${s.id}">Ordenar corrección</button>
          </div>
          <div class="border border-outline-variant p-4 flex flex-col">
            <div class="font-head font-bold text-primary-container text-sm uppercase">${A.icon('call_split', '!text-base')} Trabajo incompleto / parcial</div>
            <div class="font-head font-semibold">Reembolso parcial</div>
            <p class="text-xs text-on-surface-variant my-2">Devuelve una parte del pago de la etapa en curso; el resto queda para el prestador.</p>
            <label class="lbl">Devolver al cliente (ARS)</label>
            <label class="flex items-center bg-white border border-slate-400"><span class="px-2 font-head">$</span><input type="number" min="1" max="${enJ - 1}" step="500" class="w-full py-1.5 pr-2 outline-none font-head font-semibold tnum" data-model="dict.${s.id}.reembolso" data-live="dict" value="${esc(f.reembolso)}"></label>
            <div class="text-xs mt-2 space-y-0.5" id="dict-parc">${parcHtml(parc)}</div>
            <button class="btn-primary btn-sm mt-auto w-full !mt-3" data-action="resolver" data-tipo="parcial" data-s="${s.id}">Ejecutar reembolso parcial</button>
          </div>
          <div class="border border-outline-variant p-4 flex flex-col">
            <div class="font-head font-bold text-red-600 text-sm uppercase">${A.icon('undo', '!text-base')} Trabajo mal hecho / incumplido</div>
            <div class="font-head font-semibold">Reembolso total de la etapa</div>
            <p class="text-xs text-on-surface-variant my-2">Arbitraje a favor del cliente: se devuelve todo el pago de la etapa en curso.</p>
            <div class="bg-surface-container-low p-2 text-center mt-auto"><div class="lbl !mb-0">Reintegro a tarjeta / saldo MP</div><div class="money text-red-600 text-xl">${A.money(enJ)}</div></div>
            <button class="btn-danger btn-sm !bg-red-600 !text-white w-full mt-3" data-action="resolver" data-tipo="total" data-s="${s.id}">Devolver 100% de la etapa</button>
          </div>
          <div class="border border-outline-variant p-4 flex flex-col">
            <div class="font-head font-bold text-tertiary text-sm uppercase">${A.icon('verified', '!text-base')} Cliente malintencionado</div>
            <div class="font-head font-semibold">A favor del prestador</div>
            <p class="text-xs text-on-surface-variant my-2">Si el servicio fue brindado (evidencias y etapas aprobadas), no hay reembolso: el pago de la etapa queda para el prestador y el trabajo se cierra.</p>
            <div class="bg-surface-container-low p-2 text-center mt-auto"><div class="lbl !mb-0">Queda para el prestador</div><div class="money text-tertiary text-xl">${A.money(prestEnJ)}</div></div>
            <button class="btn-success btn-sm w-full mt-3" data-action="resolver" data-tipo="forzosa" data-s="${s.id}">Resolver a favor del prestador</button>
          </div>
        </div></div>`;
    }

    return `<div class="space-y-5 fade-in">${resumen}
      <div class="grid lg:grid-cols-2 gap-5">
        ${columna('Columna A: reclamo y evidencia del cliente', 'bg-amber-700', cl, d.cliente, `<div><div class="lbl">Fotos iniciales del problema (${s.fotos.length})</div>${A.gallery(s.fotos, { cols: 'grid-cols-3' })}</div>`)}
        ${columna('Columna B: descargo y evidencia del prestador', 'bg-primary-container', pr, d.prestador, `<div><div class="lbl">Evidencias post-trabajo (${s.evidenciasPost.length})</div>${A.gallery(s.evidenciasPost, { label: 'EVIDENCIA', cols: 'grid-cols-3', empty: 'Sin evidencias post-trabajo.' })}</div>
          ${(s.compras || []).length ? `<div><div class="lbl">Tickets de materiales (${s.compras.length})</div><div class="space-y-1">${s.compras.map((c) => `<div class="flex items-center gap-2 text-xs"><img src="${c.foto}" class="w-8 h-8 object-cover border border-outline-variant cursor-zoom-in" data-action="zoom" data-src="${c.foto}"><span class="flex-1">${esc(c.detalle)}</span><b class="font-head tnum">${A.money(c.monto)}</b><span class="chip-gray">${c.estado}</span></div>`).join('')}</div></div>` : ''}
          <div class="text-xs text-on-surface-variant">Calificación: ${pr.rating ? '★ ' + pr.rating + ' (' + pr.trabajos + ' trabajos)' : '—'} · ${esc(pr.matricula || '')}</div>`)}
      </div>
      ${comp}${dictamen}</div>`;
  }

  /* Reembolso parcial sobre el pago de la etapa en curso: MP lo descuenta en proporción del prestador y de la comisión */
  function calcParcial(s, reembolso) {
    const pagos = A.pagosEnJuego(s); const enJ = A.enJuego(s);
    const cli = pagos.reduce((a, p) => a + p.cliente, 0) || 1; const fee = pagos.reduce((a, p) => a + p.fee, 0);
    const r = Math.max(0, Math.min(enJ, reembolso)); const com = Math.round((r * fee) / cli);
    return { r, com, prest: r - com, queda: enJ - r };
  }
  const parcHtml = (c) => `<div class="flex justify-between"><span>Se descuenta al prestador</span><b class="font-head tnum">-${A.money(c.prest)}</b></div>
    <div class="flex justify-between"><span>Se descuenta de la comisión</span><b class="font-head tnum">-${A.money(c.com)}</b></div>
    <div class="flex justify-between"><span>Queda del pago de la etapa</span><b class="font-head tnum text-tertiary">${A.money(c.queda)}</b></div>`;
  A.live.dict = () => {
    const id = Object.keys(A.ui.dict || {}).find((k) => document.querySelector(`[data-model="dict.${k}.reembolso"]`));
    if (!id) return; const s = A.sol(id);
    const el = document.getElementById('dict-parc'); if (el) el.innerHTML = parcHtml(calcParcial(s, Number(A.ui.dict[id].reembolso) || 0));
  };
  A.actions['dict-sinsaldo'] = (el) => { A.ui.dict[el.dataset.s].sinSaldo = !!el.checked; A.rerender(); };

  document.addEventListener('change', (ev) => {
    const el = ev.target; if (!el.dataset || !el.dataset.changeArb) return;
    const s = A.sol(el.dataset.changeArb); s.disputa.arbitroId = el.value || null;
    A.commit(el.value ? `Caso ${s.disputa.id} asignado a ${esc(A.fullName(A.user(el.value)))}.` : 'Caso sin asignar.', 'ok');
  });
  A.actions['arb-tomar'] = (el) => {
    const s = A.sol(el.dataset.s); s.disputa.arbitroId = A.me().id;
    A.commit(`Tomaste el caso ${s.disputa.id}.`, 'ok');
  };

  A.actions['arb-escalar'] = (el) => { const s = A.sol(el.dataset.s); A.escalarArbitraje(s, 'lo pasó administración/arbitraje'); A.commit('El caso pasó a arbitraje.', 'info'); };
  A.actions.resolver = (el) => {
    const s = A.sol(el.dataset.s); const tipo = el.dataset.tipo; const f = A.ui.dict[s.id];
    const enJ = A.enJuego(s); const ids = A.pagosEnJuego(s).map((p) => p.id).join(', ') || '—';
    let plan;
    if (tipo === 'parcial') {
      const c = calcParcial(s, Number(f.reembolso) || 0);
      if (c.r <= 0 || c.r >= enJ) { A.toast('El reembolso parcial debe ser mayor a 0 y menor al pago de la etapa en curso.', 'err'); return; }
      plan = A.planResolucion(s, 'parcial', { monto: c.r, nota: f.nota });
    } else if (tipo === 'corregir') {
      const pl = Number(f.plazo);
      if (!(pl >= 1 && pl <= 30 && Number.isInteger(pl))) { A.toast('Indicá un plazo de corrección de 1 a 30 días.', 'err'); return; }
      plan = A.planResolucion(s, 'corregir', { plazo: pl, nota: f.nota });
    } else plan = A.planResolucion(s, tipo, { nota: f.nota });
    if (plan.reembolso && f.sinSaldo) {
      const tope = A.cfg('topeGarantia', 100000);
      plan.detalle += ` El reembolso fue rechazado por falta de saldo en la cuenta del prestador: OficiosYa le reintegró al cliente con su fondo de garantía${plan.reembolso > tope ? ` (hasta el tope de ${A.money(tope)} por caso; el resto queda pendiente de reintegro)` : ''} y registró la deuda al prestador.`;
    }
    plan.api = plan.reembolso
      ? `POST https://api.mercadopago.com/v1/payments/{id}/refunds   (pagos: ${ids})\n{ "amount": ${plan.reembolso} }${f.sinSaldo ? '\n→ error: saldo insuficiente en la cuenta del prestador\n→ reintegro con el fondo de garantía de OficiosYa + deuda al prestador' : ''}`
      : tipo === 'corregir' ? `Sin movimiento de dinero ahora. Si la corrección no se termina en ${plan.plazo} días:\nPOST https://api.mercadopago.com/v1/payments/{id}/refunds   (pagos: ${ids})\n{ "amount": ${enJ} }` : 'Sin movimiento de dinero: el pago ya está en la cuenta del prestador';
    A.ui.pendingPlan = { id: s.id, plan, tipo };
    A.modal(`<div class="p-5 space-y-3">
      <div class="font-head font-bold text-lg flex items-center gap-2">${A.icon('gavel')} Confirmar dictamen — ${plan.titulo}</div>
      <p class="text-sm">${plan.detalle}</p>
      <div class="font-mono text-[11px] bg-slate-950 text-emerald-300 p-3 whitespace-pre overflow-x-auto">${esc(plan.api)}</div>
      <p class="text-[11px] text-on-surface-variant">Simulación: no se ejecuta ninguna llamada real a Mercado Pago.</p>
      <div class="flex gap-2"><button class="btn-ghost flex-1" data-action="close-modal">Cancelar</button><button class="btn-dark flex-1" data-action="resolver-ok">Confirmar y ejecutar</button></div></div>`);
  };
  A.actions['resolver-ok'] = () => {
    const { id, plan } = A.ui.pendingPlan; const s = A.sol(id); const me = A.me(); const f = A.ui.dict[id] || {};
    A.ejecutarResolucion(s, plan, me.id, !!f.sinSaldo);
    A.ui.pendingPlan = null; A.closeModal();
    A.commit(`Dictamen ejecutado: <b>${plan.titulo}</b>. Ambas partes fueron notificadas.`, 'ok');
  };
})();

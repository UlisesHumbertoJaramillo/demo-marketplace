/* Estado, persistencia local y utilidades de UI. Sin servidor: todo vive en el navegador. */
(function () {
  const KEY = 'oficiosya-demo-v11';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* almacenamiento no disponible */ }
    return window.SEED();
  }

  const App = (window.App = {
    state: load(),
    ui: {}, // estado efímero de vistas (no se guarda)
  });

  App.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(App.state)); }
    catch (e) { console.warn('No se pudo guardar el estado de la demo', e); }
  };

  App.reset = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    App.state = window.SEED();
    App.ui = {};
    location.hash = '#/';
    App.render();
    App.toast('Demo reiniciada con los datos de ejemplo.');
  };

  /* ---------- Consultas ---------- */
  App.me = () => App.state.users.find((u) => u.id === App.state.currentUserId);
  App.user = (id) => App.state.users.find((u) => u.id === id);
  App.sol = (id) => App.state.solicitudes.find((s) => s.id === id);
  App.nextId = (pref) => pref + '-' + ++App.state.seq;

  App.totalPost = (p) => (p.tipo === 'visita' ? Number(p.montoVisita) || 0
    : p.montos.reduce((a, b) => a + (Number(b) || 0), 0) + (p.incluyeMateriales ? Number(p.costoMateriales) || 0 : 0));
  App.manoObra = (p) => p.montos.reduce((a, b) => a + (Number(b) || 0), 0);
  /* ---------- Cobros con split de Mercado Pago: pago por etapa, sin custodia ----------
     Cada cobro se crea a nombre del prestador (token OAuth de su cuenta MP) con application_fee = comisión de OficiosYa.
     MP descuenta primero su costo de procesamiento de la parte del vendedor y después la comisión del marketplace.
     Todo lo paga el cliente: la comisión de OficiosYa (configurable por tipo de cobro) y el costo de MP se suman al precio:
       precio al cliente = (presupuesto + comisión) / (1 − costo MP)
       application_fee = precio al cliente − presupuesto − costo de MP  (= la comisión completa)
     Así el prestador cobra exactamente lo que presupuesta y OficiosYa su comisión completa, en todos los cobros.
     El dinero se acredita en la cuenta del prestador en el momento: no hay custodia.
     Las tasas y el costo de MP estimado se configuran en el panel admin; cada trabajo guarda los valores con los que se contrató. */
  App.TIPOS_COMISION = [['etapa', 'Etapas de mano de obra'], ['visita', 'Visita técnica'], ['ajuste', 'Ajustes de precio'], ['materiales', 'Materiales con ticket']];
  App.comision = (tipo) => { const c = (App.state.comisiones || {})[tipo || 'etapa']; return c == null ? 0.1 : c; };
  App.tasa = (e, tipo) => (e && e.tasas && e.tasas[tipo || 'etapa'] != null ? e.tasas[tipo || 'etapa'] : App.comision(tipo));
  App.costoMP = (e) => (e && e.mp != null ? e.mp : App.state.costoMP);
  /* Precio al cliente de un monto del prestador: suma la comisión y el costo de MP */
  App.alCliente = (n, t, mp) => {
    const v = Number(n) || 0; const tt = t == null ? App.comision('etapa') : t; const r = mp == null ? App.state.costoMP : mp;
    return Math.round((v + Math.round(v * tt)) / (1 - r));
  };
  /* Precio al cliente con los valores contratados en un trabajo, según el tipo de cobro */
  App.precio = (e, n, tipo) => App.alCliente(n, App.tasa(e, tipo), App.costoMP(e));
  /* Inversa aproximada: cuánto cobra el prestador por un precio al cliente */
  App.netoDesde = (e, g, tipo) => Math.round(((Number(g) || 0) * (1 - App.costoMP(e))) / (1 + App.tasa(e, tipo)));
  App.precioCliente = (p) => (p.tipo === 'visita' ? App.alCliente(p.montoVisita, App.comision('visita'))
    : p.montos.reduce((a, b) => a + App.alCliente(b), 0) + (p.incluyeMateriales ? App.alCliente(p.costoMateriales, App.comision('materiales')) : 0));
  App.pct = (t) => Math.round((t == null ? App.comision('etapa') : t) * 1000) / 10 + '%';
  /* Recuadro visible solo en la demo (se desactiva desde el panel admin): muestra lo que el producto no informa */
  App.demoNota = (html) => (App.state.mostrarComision === false ? '' : `<div class="border border-dashed border-amber-600 bg-amber-50/70 px-2 py-1.5 text-[11px] text-amber-900 leading-snug"><span class="font-head font-bold tracking-wider">SOLO DEMO · </span>${html}</div>`);
  App.presupuestos = (s) => s.postulaciones.filter((p) => p.tipo !== 'visita');
  App.visitas = (s) => s.postulaciones.filter((p) => p.tipo === 'visita');
  App.visitasActivas = (s) => App.visitas(s).filter((p) => p.estado !== 'retirada');
  /* Registra un evento en el historial de la solicitud */
  App.hist = (s, tipo, texto, prestadorId) => { (s.historial = s.historial || []).push({ fecha: App.now(), tipo, texto, prestadorId }); };

  /* Monto (lo que cobra el prestador) de la etapa i, con los ajustes de precio aplicados */
  App.montoEtapa = (s, i) => (Number((App.postAceptada(s).montos || [])[i]) || 0) + ((s.hitos[i] && s.hitos[i].ajuste) || 0) + ((s.hitos[i] && s.hitos[i].descVisita) || 0);
  /* Totales del trabajo (mano de obra + ajustes): neto = prestador, total = cliente */
  App.recalcTrabajo = (s) => {
    const e = s.escrow;
    e.neto = s.hitos.reduce((a, h, i) => a + App.montoEtapa(s, i), 0) + (e.extraNeto || 0);
    e.total = s.hitos.reduce((a, h, i) => a + App.precio(e, App.montoEtapa(s, i), 'etapa'), 0) + (e.extraCliente || 0);
  };
  /* Etapas que el cliente todavía no pagó */
  App.porPagar = (s) => {
    if (!s.escrow || (s.estado !== 'en_curso' && s.estado !== 'en_disputa')) return { neto: 0, cliente: 0, n: 0 };
    let neto = 0, cliente = 0, n = 0;
    s.hitos.forEach((h, i) => { if (!h.pagado) { const m = App.montoEtapa(s, i); neto += m; cliente += App.precio(s.escrow, m, 'etapa'); n++; } });
    return { neto, cliente, n };
  };
  /* Monto en juego: pagos de etapas que todavía no fueron aprobadas (y ajustes pagados mientras el trabajo sigue abierto).
     Lo aprobado por el cliente no se discute: es su conformidad con esa etapa. */
  App.pagosEnJuego = (s) => {
    const e = s.escrow; if (!e) return [];
    return (e.pagos || []).filter((p) => {
      if (p.cliente - p.reembolsado <= 0) return false;
      if (p.ref && p.ref.indexOf('etapa:') === 0) { const h = s.hitos[+p.ref.slice(6)]; return h && h.estado !== 'completado'; }
      return p.ref === 'ajuste' && s.estado !== 'completada';
    });
  };
  App.enJuego = (s) => App.pagosEnJuego(s).reduce((a, p) => a + p.cliente - p.reembolsado, 0);

  /* Cobro con split: crea el pago a nombre del prestador y registra cómo se reparte.
     Si el prestador tiene deuda con OficiosYa (reembolso que no pudo ejecutarse), se recupera hasta el 50% de lo que recibe. */
  App.cobrar = (s, o) => {
    const e = s.escrow; const mp = o.mp != null ? o.mp : App.costoMP(e);
    const pr = App.user(o.prestadorId || (s.asignada && s.asignada.prestadorId));
    const mpFee = Math.round(o.cliente * mp);
    let fee = Math.max(0, o.cliente - o.neto - mpFee);
    let recibe = o.cliente - mpFee - fee; let recupero = 0;
    if (pr && pr.deuda > 0) { recupero = Math.min(pr.deuda, Math.round(recibe * 0.5)); pr.deuda -= recupero; fee += recupero; recibe -= recupero; }
    const pago = { id: App.newPaymentId(), concepto: o.concepto, ref: o.ref, cliente: o.cliente, recibe, mpFee, fee, recupero, reembolsado: 0, fecha: App.now() };
    if (e && o.guardar !== false) {
      e.pagos.push(pago);
      e.cobrado = (e.cobrado || 0) + o.cliente; e.liberadoPrestador = (e.liberadoPrestador || 0) + recibe;
      e.comisionCobrada = (e.comisionCobrada || 0) + fee; e.costoMPTotal = (e.costoMPTotal || 0) + mpFee;
    }
    App.mov(o.concepto, s.id, o.cliente, `POST /v1/payments (token OAuth del prestador) { "transaction_amount": ${o.cliente}, "application_fee": ${fee} } → prestador ${recibe} · costo MP ${mpFee}${recupero ? ` · recupero de deuda ${recupero}` : ''}`);
    return pago;
  };
  /* Reembolso sobre uno o más pagos (del más reciente al más antiguo). MP lo descuenta en proporción de la cuenta del
     prestador y de la de OficiosYa. Si el prestador no tiene saldo, el reembolso falla: OficiosYa reintegra al cliente con su
     fondo de garantía y lo que le correspondía devolver al prestador queda como deuda (se recupera de sus próximos cobros). */
  App.reembolsar = (s, pagos, monto, concepto, sinSaldo, prestadorId) => {
    const e = s.escrow; let resta = monto; let prest = 0, plat = 0, recibe = 0;
    pagos.slice().reverse().forEach((p) => {
      const r = Math.min(p.cliente - p.reembolsado, resta); if (r <= 0) return;
      const feeP = Math.round((r * p.fee) / p.cliente); const recP = Math.round((r * p.recibe) / p.cliente);
      p.reembolsado += r; resta -= r; plat += feeP; prest += r - feeP; recibe += recP;
      App.mov(sinSaldo ? concepto + ' · rechazado por MP' : concepto, s.id, r, sinSaldo
        ? `POST /v1/payments/${p.id}/refunds { "amount": ${r} } → error: saldo insuficiente en la cuenta del prestador`
        : `POST /v1/payments/${p.id}/refunds { "amount": ${r} } → se descuentan ${r - feeP} al prestador y ${feeP} a OficiosYa`);
    });
    const total = monto - resta;
    if (e) {
      e.reembolsado = (e.reembolsado || 0) + total; e.liberadoPrestador = (e.liberadoPrestador || 0) - recibe;
      e.comisionCobrada = (e.comisionCobrada || 0) - plat; e.costoMPTotal = (e.costoMPTotal || 0) - (prest - recibe);
    }
    let cubierto = 0, pendiente = 0;
    if (sinSaldo && total) {
      // El fondo de garantía cubre hasta un tope por caso; el excedente queda pendiente de reintegro al cliente.
      cubierto = Math.min(total, App.cfg('topeGarantia', 100000)); pendiente = total - cubierto;
      const pr = App.user(prestadorId || (s.asignada ? s.asignada.prestadorId : null));
      if (pr) pr.deuda = (pr.deuda || 0) + prest;
      if (e) { e.garantia = (e.garantia || 0) + cubierto; e.pendienteCliente = (e.pendienteCliente || 0) + pendiente; }
      App.mov('Reintegro al cliente con el fondo de garantía', s.id, cubierto, `Transferencia desde la cuenta de OficiosYa · deuda registrada al prestador: ${prest}${pendiente ? ` · supera el tope por caso: quedan ${pendiente} pendientes de reintegro` : ''}`);
      // Suspensión automática si la deuda supera el máximo configurado
      if (pr && pr.estado === 'activo' && pr.deuda > App.cfg('deudaMaxima', 50000)) {
        pr.estado = 'suspendido'; pr.suspendidoPorDeuda = true;
        App.mov('Prestador suspendido por deuda', s.id, pr.deuda, `La deuda supera el máximo de ${App.cfg('deudaMaxima', 50000)}`);
        App.hist(s, 'contacto', 'El prestador quedó suspendido automáticamente: su deuda con OficiosYa supera el máximo permitido');
      }
    }
    return { total, prest, plat, sinSaldo: !!sinSaldo, cubierto, pendiente };
  };
  /* ---------- Aprobación de etapas (sin PIN) ----------
     Cada etapa terminada la aprueba el cliente. Si no la aprueba ni la observa dentro del plazo configurable,
     se aprueba automáticamente. Al aprobarse la última etapa, el trabajo queda cerrado. */
  App.plazoAprob = () => (App.state.plazoAprobacion == null ? 7 : App.state.plazoAprobacion);
  App.parseFecha = (f) => new Date(String(f).replace(' ', 'T'));
  App.venceAprob = (h) => new Date(App.parseFecha(h.terminadaEn).getTime() + App.plazoAprob() * 86400000);
  App.fmtFecha = (d) => { const p = (x) => String(x).padStart(2, '0'); return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  App.aprobarEtapa = (s, i, auto) => {
    const h = s.hitos[i]; h.estado = 'completado'; h.hora = App.shortNow(); h.auto = !!auto; h.observacion = '';
    App.hist(s, 'pago', `Etapa ${i + 1} (“${h.nombre}”) ${auto ? `aprobada automáticamente: el cliente no respondió en ${App.plazoAprob()} días` : 'aprobada por el cliente (conformidad con la etapa)'}`, s.asignada.prestadorId);
    if (i === s.hitos.length - 1) {
      s.estado = 'completada'; s.escrow.estado = 'liquidado'; s.cerradaEn = App.now();
      App.hist(s, 'pago', 'Etapa final aprobada: el trabajo quedó cerrado', s.asignada.prestadorId);
    }
  };
  App.checkAutoAprobacion = () => {
    const ahora = Date.now(); let n = 0;
    App.state.solicitudes.forEach((s) => {
      if (s.estado !== 'en_curso') return;
      s.hitos.forEach((h, i) => { if (s.estado === 'en_curso' && h.estado === 'por_aprobar' && h.terminadaEn && App.venceAprob(h).getTime() <= ahora) { App.aprobarEtapa(s, i, true); n++; } });
    });
    if (n) App.save();
    return n;
  };
  /* ---------- Disputas: mediación, arbitraje, corrección, garantía y reclamos en Mercado Pago ----------
     Con el split el dinero ya está en la cuenta del prestador: el arbitraje prioriza que el trabajo se corrija y,
     si hay que devolver dinero, se pide un reembolso a Mercado Pago. Los plazos se configuran en el panel admin. */
  App.cfg = (k, def) => (App.state[k] == null ? def : App.state[k]);
  App.addHoras = (d, h) => new Date(d.getTime() + h * 3600000);
  App.addHabiles = (d, n) => { const r = new Date(d.getTime()); let k = 0; while (k < n) { r.setDate(r.getDate() + 1); const w = r.getDay(); if (w !== 0 && w !== 6) k++; } return r; };
  App.diasDesde = (f) => Math.floor((Date.now() - App.parseFecha(f).getTime()) / 86400000);
  /* Abre una disputa: empieza siempre por la mediación entre las partes */
  App.abrirDisputa = (s, o) => {
    if (s.disputa && s.disputa.resolucion) (s.disputasAnteriores = s.disputasAnteriores || []).push(s.disputa);
    s.estado = 'en_disputa'; s.correccion = null;
    s.disputa = { id: App.nextId('DISP'), abiertaPor: o.abiertaPor, motivo: o.motivo, fecha: App.now(), arbitroId: null, fase: 'mediacion',
      venceMediacion: App.fmtISO(App.addHoras(new Date(), App.cfg('plazoMediacion', 72))), propuestas: [],
      cliente: { declaracion: o.cliente || '', fotos: o.fotosCliente || [] }, prestador: { declaracion: o.prestador || '', fotos: o.fotosPrestador || [] } };
    App.mov('Disputa abierta (etapa en curso)', s.id, App.enJuego(s), 'Sin movimiento de dinero: el pago de la etapa en curso ya está en la cuenta del prestador');
    App.hist(s, 'contacto', `Disputa ${s.disputa.id} abierta por el ${o.abiertaPor}: empieza la mediación entre las partes (${App.cfg('plazoMediacion', 72)} h)`);
    return s.disputa;
  };
  /* Pasa el caso al árbitro, con plazo para resolver en días hábiles */
  App.escalarArbitraje = (s, motivo) => {
    const d = s.disputa; if (!d || d.fase === 'arbitraje') return;
    d.fase = 'arbitraje'; d.escalada = App.now();
    d.venceArbitro = App.fmtISO(App.addHabiles(new Date(), App.cfg('plazoArbitro', 10)));
    d.propuestas.forEach((p) => { if (p.estado === 'pendiente') p.estado = 'vencida'; });
    App.hist(s, 'contacto', `Caso ${d.id} escalado a arbitraje: ${motivo}`);
  };
  /* Ejecuta una resolución (por acuerdo en la mediación o por dictamen del árbitro).
     plan: { tipo: 'total' | 'parcial' | 'forzosa' | 'corregir', reembolso, plazo, titulo, detalle, api, nota } */
  App.ejecutarResolucion = (s, plan, por, sinSaldo) => {
    const d = s.disputa; const e = s.escrow;
    let r = null;
    if (plan.tipo === 'corregir') {
      const i = s.hitos.findIndex((h) => h.estado !== 'completado');
      const h = s.hitos[i]; const plazo = plan.plazo || App.cfg('plazoCorreccion', 5);
      h.estado = 'pendiente'; h.terminadaEn = null;
      h.observacion = `Corrección ${por === 'acuerdo' ? 'acordada' : 'ordenada por el árbitro'}: ${plan.nota || 'corregir lo observado por el cliente'}`;
      s.correccion = { hito: i, vence: App.fmtISO(new Date(Date.now() + plazo * 86400000)), plazo, monto: App.enJuego(s), cumplida: false };
      s.estado = 'en_curso';
    } else {
      if (plan.reembolso) r = App.reembolsar(s, App.pagosEnJuego(s), plan.reembolso, `Reembolso ${plan.tipo === 'total' ? 'total' : 'parcial'} de la etapa (${por === 'acuerdo' ? 'acuerdo de mediación' : 'arbitraje'})`, !!sinSaldo);
      s.estado = 'resuelta'; e.estado = 'resuelto';
    }
    d.resolucion = { tipo: plan.tipo, titulo: plan.titulo, detalle: plan.detalle, api: plan.api || '', nota: plan.nota || '', por, arbitroId: por === 'acuerdo' ? null : por, fecha: App.now(), plazo: plan.plazo };
    App.hist(s, 'contacto', `${por === 'acuerdo' ? 'Acuerdo en la mediación' : 'Arbitraje resuelto'}: ${plan.titulo}`);
    return r;
  };
  /* Arma una resolución (la usan la mediación y el árbitro) */
  App.planResolucion = (s, tipo, o) => {
    o = o || {}; const enJ = App.enJuego(s); const sinPagar = s.hitos.filter((h) => !h.pagado).length;
    let plan;
    if (tipo === 'corregir') {
      const plazo = Number(o.plazo) || App.cfg('plazoCorreccion', 5);
      plan = { tipo, plazo, titulo: `Corregir la etapa (${plazo} días)`, detalle: `El prestador tiene ${plazo} días para corregir la etapa en curso sin costo. Si no la marca como terminada en ese plazo, se le reembolsa al cliente el pago de la etapa (${App.money(enJ)}).`, reembolso: 0 };
    } else if (tipo === 'parcial') {
      const m = Math.round(Number(o.monto) || 0);
      plan = { tipo, titulo: 'Reembolso parcial', detalle: `Se reembolsan ${App.money(m)} al cliente sobre el pago de la etapa en curso (${App.money(enJ)}). El resto queda para el prestador.`, reembolso: m };
    } else if (tipo === 'total') {
      plan = { tipo, titulo: 'Reembolso total de la etapa en curso', detalle: `Se reembolsa el 100% del pago de la etapa en curso (${App.money(enJ)}) al cliente. Lo pagado por etapas aprobadas no se modifica.`, reembolso: enJ };
    } else {
      plan = { tipo: 'forzosa', titulo: 'A favor del prestador (sin reembolso)', detalle: `El pago de la etapa en curso (${App.money(enJ)}) queda para el prestador. El servicio se considera brindado.`, reembolso: 0 };
    }
    if (plan.tipo !== 'corregir' && sinPagar) plan.detalle += ` Se cancelan ${sinPagar} etapa(s) sin pagar.`;
    plan.nota = o.nota || '';
    return plan;
  };
  /* Corrección vencida sin que el prestador marque la etapa como terminada: se reembolsa la etapa en curso */
  App.incumplirCorreccion = (s) => {
    const c = s.correccion; if (!c || c.cumplida || c.incumplida) return;
    const r = App.reembolsar(s, App.pagosEnJuego(s), App.enJuego(s), 'Reembolso por no corregir la etapa en el plazo', false);
    c.incumplida = true; s.estado = 'resuelta'; s.escrow.estado = 'resuelto';
    App.hist(s, 'contacto', `Venció el plazo de corrección sin que el prestador terminara la etapa: se reembolsaron ${App.money(r.total)} al cliente`);
    return r;
  };
  /* Revisa todos los plazos: aprobación automática, fin de la mediación y plazo de corrección */
  App.checkPlazos = () => {
    let n = App.checkAutoAprobacion() + App.checkVisitas(); const ahora = Date.now();
    App.state.solicitudes.forEach((s) => {
      const d = s.disputa;
      if (s.estado === 'en_disputa' && d && d.fase === 'mediacion' && d.venceMediacion && App.parseFecha(d.venceMediacion).getTime() <= ahora) {
        App.escalarArbitraje(s, `venció el plazo de mediación (${App.cfg('plazoMediacion', 72)} h) sin acuerdo`); n++;
      }
      const c = s.correccion;
      if (s.estado === 'en_curso' && c && !c.cumplida && !c.incumplida && App.parseFecha(c.vence).getTime() <= ahora) { App.incumplirCorreccion(s); n++; }
    });
    if (n) App.save();
    return n;
  };
  /* Estadísticas de disputas por usuario, para detectar abusos */
  App.statsDisputas = (uid) => {
    let perdidasCliente = 0, enContraPrestador = 0, abiertas = 0, garantiaSinResolver = 0;
    App.state.solicitudes.forEach((s) => {
      [].concat(s.disputasAnteriores || [], s.disputa ? [s.disputa] : []).forEach((d) => {
        if (s.clienteId === uid && d.abiertaPor === 'cliente') abiertas++;
        if (!d.resolucion) return;
        if (s.clienteId === uid && d.abiertaPor === 'cliente' && d.resolucion.tipo === 'forzosa') perdidasCliente++;
        if (s.asignada && s.asignada.prestadorId === uid && d.resolucion.tipo !== 'forzosa') enContraPrestador++;
      });
      if (s.reclamo && s.reclamo.estado === 'no_resuelto' && s.asignada && s.asignada.prestadorId === uid) garantiaSinResolver++;
    });
    const revisar = perdidasCliente >= 2 || enContraPrestador >= 2 || garantiaSinResolver >= 2;
    return { perdidasCliente, enContraPrestador, abiertas, garantiaSinResolver, revisar };
  };
  /* ---------- Visitas técnicas: confirmación, "no vino" con descargo, mediación y reprogramación ---------- */
  App.plazoVisita = () => App.cfg('plazoVisita', 48); // horas
  /* Descuento de la visita en el presupuesto del mismo prestador (si lo ofreció y la visita se hizo) */
  App.descuentoVisita = (s, post) => {
    const v = App.visitas(s).find((x) => x.prestadorId === post.prestadorId && x.descuentaVisita && x.estado === 'visita_realizada');
    return v ? Number(v.montoVisita) || 0 : 0;
  };
  /* Resuelve una visita: 'reembolso' (el prestador no fue), 'sin_reembolso' (fue y el cliente no estaba) o 'reprogramar' */
  App.resolverVisita = (s, p, tipo, o) => {
    o = o || {}; const v = p.visita;
    if (tipo === 'reembolso') {
      const r = App.reembolsar(s, [v], v.monto - (v.reembolsado || 0), 'Reembolso de visita (el prestador no se presentó)', !!o.sinSaldo, p.prestadorId);
      if (r.sinSaldo) { v.garantia = (v.garantia || 0) + r.cubierto; v.pendienteCliente = (v.pendienteCliente || 0) + r.pendiente; }
      p.estado = 'visita_cancelada'; v.cancelada = App.shortNow();
      const pr = App.user(p.prestadorId); pr.reportes = pr.reportes || [];
      pr.reportes.push({ id: App.nextId('DEN'), tipo: 'No se presentó a la visita', texto: v.reclamo ? v.reclamo.motivo : 'El cliente informó que el prestador no se presentó a la visita pagada.', fotos: [], autorId: s.clienteId, solicitudId: s.id, fecha: App.now(), resuelto: false });
      App.hist(s, 'visita_cancelada', `Visita cancelada: el prestador no se presentó. Reembolso total de la visita${r.sinSaldo ? ' (con el fondo de garantía)' : ''}`, p.prestadorId);
    } else if (tipo === 'sin_reembolso') {
      p.estado = 'visita_realizada'; v.realizada = App.shortNow(); v.clienteAusente = true;
      const cl = App.user(s.clienteId); cl.reportes = cl.reportes || [];
      cl.reportes.push({ id: App.nextId('DEN'), tipo: 'Cliente ausente en la visita', texto: v.reclamo && v.reclamo.descargo ? v.reclamo.descargo : 'El prestador fue a la visita y no lo atendieron.', fotos: [], autorId: p.prestadorId, solicitudId: s.id, fecha: App.now(), resuelto: false });
      App.hist(s, 'visita_realizada', 'Visita considerada realizada: el cliente no estaba. Sin reembolso; se habilita el presupuesto', p.prestadorId);
    } else {
      p.estado = 'visita_pagada'; p.franja = o.franja || p.franja; v.marcadaEn = null;
      App.hist(s, 'visita', `Visita reprogramada: ${o.franja || p.franja}`, p.prestadorId);
    }
    if (v.reclamo) v.reclamo.estado = 'resuelto';
    if (v.disputa && !v.disputa.resolucion) v.disputa.resolucion = { tipo, por: o.por || 'acuerdo', fecha: App.now(), franja: o.franja || '' };
  };
  App.confirmarVisita = (s, p, auto) => {
    p.estado = 'visita_realizada'; p.visita.realizada = App.shortNow(); p.visita.auto = !!auto;
    App.hist(s, 'visita_realizada', auto ? `Visita confirmada automáticamente: el cliente no respondió en ${App.plazoVisita()} h. Se habilita el presupuesto` : 'Visita realizada (confirmada por el cliente). Se habilita el presupuesto', p.prestadorId);
  };
  App.checkVisitas = () => {
    const ahora = Date.now(); let n = 0; const h = App.plazoVisita() * 3600000;
    App.state.solicitudes.forEach((s) => App.visitas(s).forEach((p) => {
      const v = p.visita; if (!v) return;
      if (p.estado === 'visita_pagada' && v.marcadaEn && App.parseFecha(v.marcadaEn).getTime() + h <= ahora) { App.confirmarVisita(s, p, true); n++; }
      if (p.estado === 'visita_reclamada' && v.reclamo && v.reclamo.estado === 'pendiente' && App.parseFecha(v.reclamo.vence).getTime() <= ahora) {
        App.hist(s, 'visita', `El prestador no respondió el reclamo de "no vino" en ${App.plazoVisita()} h`, p.prestadorId);
        App.resolverVisita(s, p, 'reembolso', { por: 'sistema' }); n++;
      }
      const d = v.disputa;
      if (p.estado === 'visita_reclamada' && d && !d.resolucion && d.fase === 'mediacion' && App.parseFecha(d.venceMediacion).getTime() <= ahora) {
        d.fase = 'arbitraje'; d.venceArbitro = App.fmtISO(App.addHabiles(new Date(), App.cfg('plazoArbitro', 10)));
        App.hist(s, 'visita', 'Venció la mediación de la visita sin acuerdo: pasó a un árbitro', p.prestadorId); n++;
      }
    }));
    return n;
  };
  App.reviews = (prestadorId) => App.state.solicitudes.filter((s) => s.resena && s.asignada && s.asignada.prestadorId === prestadorId);
  /* Reputación de un prestador: calificación general y promedio por oficio (según reseñas de la plataforma) */
  App.statsPrestador = (id) => {
    const u = App.user(id); const revs = App.reviews(id); const porCat = {};
    revs.forEach((s) => { const c = (porCat[s.categoria] = porCat[s.categoria] || { suma: 0, n: 0 }); c.suma += s.resena.estrellas; c.n += 1; });
    Object.values(porCat).forEach((c) => { c.avg = Math.round((c.suma / c.n) * 10) / 10; });
    const n = revs.length; const avgPlat = n ? Math.round((revs.reduce((a, s) => a + s.resena.estrellas, 0) / n) * 10) / 10 : null;
    return { general: u && u.rating, trabajos: u && u.trabajos, resenas: n, avgPlat, porCat };
  };
  App.stars =(n, cls = '') => `<span class="text-amber-500 tracking-tight ${cls}" aria-label="${n} de 5">${'★'.repeat(n)}<span class="text-slate-300">${'★'.repeat(5 - n)}</span></span>`;
  App.charCount = (txt, min) => { const n = (txt || '').trim().length; return `<span class="${n >= min ? 'text-tertiary' : 'text-red-600'} font-head font-semibold">${n}</span> / ${min} caracteres mínimos`; };
  App.postAceptada = (s) => s.asignada && s.postulaciones.find((p) => p.id === s.asignada.postulacionId);

  /* ---------- Formato ---------- */
  App.money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');
  App.now = function () {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  App.fmtISO = (d) => { const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  App.shortNow = function () {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  App.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  App.fullName = (u) => (u ? `${u.nombre} ${u.apellido}` : '—');
  /* Nombre abreviado para mostrar a terceros (privacidad): "Martín S." */
  App.shortName = (u) => (u ? `${u.nombre} ${(u.apellido || '').charAt(0)}.` : '—');
  /* Visibilidad de una solicitud en el explorador según el rol:
     'full' = tarjeta y detalle completos · 'resumen' = solo resultado (prestador y calificaciones) · null = no se muestra */
  App.visibilidad = (s, me) => {
    if (me.rol === 'admin' || me.rol === 'arbitro') return 'full';
    const asignado = s.asignada && s.asignada.prestadorId === me.id;
    const terminada = s.estado === 'completada' || s.estado === 'resuelta';
    if (me.rol === 'cliente') return s.clienteId === me.id ? 'full' : terminada ? 'resumen' : null;
    if (me.rol === 'prestador') return s.estado === 'abierta' || asignado ? 'full' : terminada ? 'resumen' : null;
    return null;
  };
  App.initials = (u) => (u ? (u.nombre[0] || '') + (u.apellido[0] || '') : '?');

  App.avatar = function (u, size = 'w-10 h-10', extra = '') {
    if (u && u.foto) return `<img src="${u.foto}" alt="" class="${size} object-cover border border-outline-variant ${extra}">`;
    return `<div class="${size} bg-surface-container-high text-primary font-head font-bold flex items-center justify-center border border-outline-variant ${extra}">${App.esc(App.initials(u))}</div>`;
  };
  App.icon = (name, cls = '') => `<span class="ms ${cls}" aria-hidden="true">${name}</span>`;

  App.ESTADOS = {
    abierta: ['chip-blue', 'Abierta · cotizando'],
    en_curso: ['chip-amber', 'En curso · pago por etapa'],
    en_disputa: ['chip-red', 'En disputa · arbitraje'],
    completada: ['chip-green', 'Completada · etapas aprobadas'],
    resuelta: ['chip-gray', 'Cerrada por arbitraje'],
    cancelada: ['chip-gray', 'Rescindida'],
  };
  App.estadoChip = (s) => {
    const [c, t] = App.ESTADOS[s.estado] || ['chip-gray', s.estado];
    return `<span class="${c}">${t}</span>`;
  };

  /* ---------- Notificaciones y modales ---------- */
  App.toast = function (msg, kind = 'info') {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    const colors = { info: 'border-slate-950', ok: 'border-emerald-600', err: 'border-red-500', mail: 'border-primary-container' };
    el.className = `fade-in bg-white border-l-4 ${colors[kind] || colors.info} border border-outline-variant shadow-hard px-4 py-3 text-sm max-w-sm`;
    el.innerHTML = msg;
    box.appendChild(el);
    while (box.children.length > 2) box.firstElementChild.remove();
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, kind === 'mail' ? 9000 : 3800);
    setTimeout(() => el.remove(), kind === 'mail' ? 9400 : 4200);
  };

  App.modal = function (html, opts = {}) {
    const root = document.getElementById('modal');
    root.innerHTML = `<div class="fixed inset-0 z-[80] modal-backdrop flex items-end md:items-center justify-center md:p-6" data-action="modal-bg">
      <div class="fade-in bg-white w-full ${opts.wide ? 'md:max-w-3xl' : 'md:max-w-lg'} max-h-[92vh] overflow-y-auto border border-outline-variant rounded-t-[1.6rem] md:rounded-[1.6rem] shadow-hard" role="dialog" aria-modal="true">${html}</div></div>`;
    document.body.style.overflow = 'hidden';
  };
  App.closeModal = function () {
    document.getElementById('modal').innerHTML = '';
    document.body.style.overflow = '';
  };
  App.lightbox = function (src) {
    App.modal(`<div class="relative bg-slate-950"><img src="${src}" class="w-full max-h-[80vh] object-contain">
      <button class="absolute top-2 right-2 btn-dark btn-sm" data-action="close-modal">${App.icon('close')} Cerrar</button></div>`, { wide: true });
  };

  /* ---------- Fotos: lectura local y compresión (no se suben a ningún lado) ---------- */
  App.readImages = function (fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    return Promise.all(files.map((f) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 900;
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(f);
    }))).then((r) => r.filter(Boolean));
  };

  /* Galería reutilizable */
  App.gallery = function (fotos, opts = {}) {
    if (!fotos || !fotos.length) return `<div class="border border-dashed border-outline-variant p-6 text-center text-sm text-on-surface-variant">${opts.empty || 'Sin fotos cargadas.'}</div>`;
    const cols = opts.cols || 'grid-cols-2 md:grid-cols-3';
    return `<div class="grid ${cols} gap-2 md:gap-3">${fotos.map((f, i) => `
      <figure class="group relative border border-slate-950/80 bg-surface-container-low cursor-zoom-in overflow-hidden" data-action="zoom" data-src="${f}">
        <img src="${f}" alt="" class="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300">
        <figcaption class="absolute top-0 left-0 bg-slate-950 text-white font-head text-[10px] font-bold px-1.5 py-0.5">${opts.label || 'FOTO'} #${String(i + 1).padStart(2, '0')}</figcaption>
        ${opts.removable ? `<button class="absolute top-1 right-1 bg-white/90 border border-slate-950 w-7 h-7 flex items-center justify-center" data-action="${opts.removable}" data-idx="${i}" title="Quitar">${App.icon('close', '!text-base')}</button>` : ''}
      </figure>`).join('')}</div>`;
  };

  /* Bloque de carga de fotos (input file + fotos de ejemplo) */
  App.uploader = function (target, ejemplo, label = 'Subir fotos') {
    return `<div class="flex flex-wrap gap-2">
      <label class="btn-ghost btn-sm cursor-pointer">${App.icon('photo_camera')} ${label}
        <input type="file" accept="image/*" multiple class="hidden" data-upload="${target}"></label>
      ${ejemplo ? `<button type="button" class="btn-ghost btn-sm" data-action="sample-photos" data-target="${target}" data-set="${ejemplo}">${App.icon('image')} Usar fotos de ejemplo</button>` : ''}
    </div>`;
  };

  /* Registro de movimientos Mercado Pago (simulados) */
  App.mov = function (tipo, solicitudId, monto, api) {
    App.state.movimientos.unshift({ fecha: App.now(), tipo, solicitudId, monto, api });
  };

  /* Checkout Mercado Pago simulado y reutilizable (etapas, visita, ajustes de precio o materiales). El cobro va a la cuenta del prestador (split). */
  App.checkout = function ({ intro, lineas, total, action, data }) {
    const attrs = Object.entries(data || {}).map(([k, v]) => `data-${k}="${App.esc(v)}"`).join(' ');
    App.modal(`<div class="bg-[#009ee3] text-white px-5 py-4 flex justify-between items-center">
        <div class="font-head font-bold text-lg">mercado pago <span class="font-normal text-xs opacity-80">· checkout simulado</span></div>
        <button data-action="close-modal">${App.icon('close')}</button></div>
      <div class="p-5 space-y-4">
        <div class="text-sm">${intro}</div>
        <div class="bg-surface-container-low border border-outline-variant p-3 text-sm space-y-1">
          ${lineas.map(([k, v]) => `<div class="flex justify-between gap-3"><span>${k}</span><span class="text-right font-semibold font-head tnum">${v}</span></div>`).join('')}
          <div class="flex justify-between border-t border-outline-variant pt-2 mt-2"><b>Total a pagar</b><span class="money text-xl">${App.money(total)}</span></div>
        </div>
        <div><label class="lbl">Medio de pago</label>
          <select class="inp"><option>Dinero en cuenta Mercado Pago</option><option>Tarjeta de crédito · hasta 6 cuotas</option><option>Tarjeta de débito</option></select></div>
        <button class="btn w-full bg-[#009ee3] border-[#0089c7] text-white hover:bg-[#0089c7]" data-action="${action}" ${attrs}>${App.icon('lock')} Pagar ${App.money(total)}</button>
        <p class="text-[11px] text-on-surface-variant text-center">El pago se acredita en la cuenta de Mercado Pago del prestador, procesado por OficiosYa.<br>Al pagar aceptás resolver cualquier reclamo primero con la mediación de OficiosYa.<br>Simulación: no se realiza ningún cobro real.</p>
      </div>`);
  };
  App.newPaymentId = () => 'MP-' + Math.floor(100000000 + Math.random() * 899999999);
})();

/* Landing page pública: explica el sistema y lleva al login o al registro. */
(function () {
  const A = window.App;
  A.views = A.views || {}; A.actions = A.actions || {};

  A.views.landing = function (params, me) {
    const cta = me
      ? `<a href="#/" class="btn btn-sm bg-white text-primary border-white hover:bg-blue-50 !px-6 !py-3 !text-base">${A.icon('arrow_forward')} Ir a la plataforma</a>`
      : `<button class="btn bg-secondary-container text-white border-secondary hover:bg-secondary !px-6 !py-3 !text-base shadow-hard" data-action="landing-reg" data-rol="cliente">${A.icon('person_add')} Crear cuenta gratis</button>
         <a href="#/login" class="btn bg-transparent text-white border-white/70 hover:bg-white/10 !px-6 !py-3 !text-base">${A.icon('login')} Ya tengo cuenta</a>`;

    const pasos = [
      ['assignment', 'Publicás tu solicitud', 'Contás el problema con detalle, medidas y fotos de la parte a reparar. Te guiamos con un instructivo.'],
      ['request_quote', 'Recibís presupuestos', 'Prestadores verificados cotizan por etapas, con materiales y herramientas claros. Si hace falta, primero cobran una visita.'],
      ['lock', 'Pagás por etapa', 'Pagás cada etapa con Mercado Pago antes de que empiece: nunca adelantás más que una etapa. La aprobás cuando está terminada y recién ahí pagás la siguiente.'],
      ['task_alt', 'Aprobás cada etapa', 'Revisás cada etapa terminada y la aprobás. Al aprobar la última, el trabajo queda cerrado.'],
    ];
    const garantias = [
      ['verified_user', 'Identidad verificada', 'DNI/CUIT, email y foto de rostro reales. Gasistas y electricistas, con matrícula.'],
      ['shield', 'Riesgo acotado', 'Pago por etapa con Mercado Pago, aprobación de cada etapa y reembolso de la etapa en curso si algo sale mal.'],
      ['gavel', 'Mediación y arbitraje', 'Primero se busca un acuerdo, por ejemplo que el prestador corrija la etapa. Si no lo hay, un árbitro revisa las evidencias de las dos partes y decide.'],
      ['reviews', 'Calificaciones reales', 'Opiniones de clientes, incluso meses después, y reputación por oficio.'],
      ['receipt_long', 'Materiales con ticket', 'Si el prestador compra materiales, declara el monto y adjunta el ticket.'],
      ['contact_phone', 'Contacto seguro', 'Los datos se comparten recién después de pagar, con canal de denuncias.'],
    ];
    const oficios = Object.keys(window.CATEGORIAS);
    // Requisitos para operar (RF05): [ícono, título, detalle, obligatorio]
    const reqCliente = [
      ['person', 'Cuenta en OficiosYa', 'Nombre, apellido, DNI/CUIT y teléfono reales, email verificado y foto de rostro.', true],
      ['payments', 'Un medio de pago', 'Tarjeta de crédito o débito: no necesitás cuenta de Mercado Pago.', true],
      ['account_balance_wallet', 'Cuenta de Mercado Pago', 'Solo si querés pagar con dinero en cuenta o con Cuotas sin Tarjeta.', false],
      ['receipt_long', 'Efectivo', 'Podés pagar en Rapipago o Pago Fácil: la etapa empieza cuando se acredita el pago.', false],
    ];
    const reqPrestador = [
      ['person', 'Cuenta en OficiosYa', 'Datos reales con DNI/CUIT, email verificado y foto de rostro.', true],
      ['badge', 'Matrícula en oficios regulados', 'Número de matrícula obligatorio para gas y electricidad. OficiosYa aprueba tu perfil antes de que puedas cotizar.', true],
      ['account_balance_wallet', 'Cuenta de Mercado Pago a tu nombre', 'Con la identidad validada en Mercado Pago (nivel KYC 6) y vinculada a OficiosYa al registrarte. Es donde cobrás cada etapa.', true],
      ['verified_user', 'App de Mercado Pago', 'Recomendada, para ver tus cobros, retirar el dinero y responder reclamos.', false],
    ];
    const reqItem = ([ic, t, d, obl]) => `<li class="flex gap-3">${A.icon(ic, 'text-primary !text-xl shrink-0')}<div><div class="font-head font-semibold text-sm">${t} <span class="${obl ? 'chip-blue' : 'chip-gray'} !text-[9px] ml-1">${obl ? 'Obligatorio' : 'Opcional'}</span></div><p class="text-sm text-on-surface-variant">${d}</p></div></li>`;

    return `
    <section class="bg-primary-container text-white border-b border-blue-800">
      <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-20 grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
        <div>
          <span class="inline-flex items-center gap-1 bg-tertiary text-white font-head text-[10px] font-bold px-2 py-1 tracking-wider mb-4">${A.icon('verified_user', '!text-sm')} PAGO POR ETAPA · PAGÁS CON MERCADO PAGO</span>
          <h1 class="font-head text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">Arreglos en casa, <span class="font-serif italic font-normal text-[#4af656]">sin riesgos.</span></h1>
          <p class="text-base md:text-lg opacity-90 mt-4 max-w-xl">OficiosYa conecta a quienes necesitan un trabajo de plomería, gas, electricidad, pintura y más con prestadores verificados. Pagás cada etapa con Mercado Pago antes de que empiece y la aprobás cuando está terminada: nunca adelantás más que una etapa.</p>
          <div class="flex flex-wrap gap-3 mt-8">${cta}</div>
          ${me ? '' : `<button class="mt-4 text-sm underline underline-offset-2 opacity-90 hover:opacity-100" data-action="landing-reg" data-rol="prestador">¿Sos prestador? Sumate y conseguí trabajos →</button>`}
        </div>
        <div class="relative hidden md:block">
          <img src="assets/img/seg-tablero.jpg" alt="" class="w-full aspect-[4/3] object-cover border-2 border-slate-950 shadow-hard">
          <div class="absolute -bottom-5 -left-5 bg-white text-on-surface border-2 border-slate-950 shadow-hard p-4 w-64">
            <div class="font-head text-[10px] font-bold tracking-wider text-on-surface-variant">ETAPA 3 DE 4 · PAGADA</div>
            <div class="money text-2xl text-primary">$35.200</div>
            <div class="flex gap-1 mt-2">${[1, 1, 0, 0].map((ok) => `<span class="h-2 flex-1 ${ok ? 'bg-tertiary' : 'bg-surface-container-high'}"></span>`).join('')}</div>
            <div class="text-[11px] text-on-surface-variant mt-1">Pagás y aprobás etapa por etapa</div>
          </div>
        </div>
      </div>
    </section>

    <section class="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-16">
      <h2 class="font-head text-2xl md:text-3xl font-bold tracking-tight text-center">Cómo funciona</h2>
      <p class="text-center text-on-surface-variant mt-2">Cuatro pasos, y nunca adelantás más que una etapa.</p>
      <ol class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">${pasos.map(([ic, t, d], i) => `<li class="card p-5 relative">
        <span class="absolute top-0 right-0 bg-slate-950 text-white font-head font-bold text-xs px-2 py-1">${i + 1}</span>
        <span class="w-11 h-11 bg-surface-container-high text-primary flex items-center justify-center mb-3">${A.icon(ic, '!text-2xl')}</span>
        <div class="font-head font-semibold text-lg">${t}</div><p class="text-sm text-on-surface-variant mt-1">${d}</p></li>`).join('')}</ol>
    </section>

    <section class="bg-surface-container-low border-y border-outline-variant/60">
      <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-6">
        <div class="card p-6 md:p-8">
          <div class="flex items-center gap-2 font-head font-bold text-xl">${A.icon('home', 'text-primary')} Para clientes</div>
          <ul class="mt-4 space-y-2 text-sm">
            ${['Publicar es gratis: pagás recién cuando aceptás un presupuesto.', 'Comparás presupuestos por etapas y ves la reputación de cada prestador en ese oficio.', 'Aprobás cada compra de materiales con su ticket.', 'Si algo sale mal, abrís una mediación con tus fotos; si no hay acuerdo, decide un árbitro. Y tenés garantía después de terminado el trabajo.']
              .map((t) => `<li class="flex gap-2">${A.icon('check_circle', 'text-tertiary !text-lg shrink-0')} ${t}</li>`).join('')}
          </ul>
          ${me ? '' : `<button class="btn-primary mt-6" data-action="landing-reg" data-rol="cliente">${A.icon('person_add')} Crear cuenta de cliente</button>`}
        </div>
        <div class="card p-6 md:p-8">
          <div class="flex items-center gap-2 font-head font-bold text-xl">${A.icon('engineering', 'text-secondary')} Para prestadores</div>
          <ul class="mt-4 space-y-2 text-sm">
            ${['Accedés a solicitudes detalladas, con medidas y fotos de la parte a reparar.', 'Armás tu presupuesto con tus propias etapas, o cobrás primero la visita.', 'El cliente paga cada etapa antes de que empieces y el pago se acredita en tu cuenta de Mercado Pago. Los materiales se pagan al aprobar el ticket.', 'Si el cliente no responde, la etapa terminada se aprueba sola en el plazo establecido.', 'Construís tu reputación con calificaciones por oficio.']
              .map((t) => `<li class="flex gap-2">${A.icon('check_circle', 'text-tertiary !text-lg shrink-0')} ${t}</li>`).join('')}
          </ul>
          ${me ? '' : `<button class="btn mt-6 bg-secondary-container text-white border-secondary hover:bg-secondary" data-action="landing-reg" data-rol="prestador">${A.icon('handyman')} Registrarme como prestador</button>`}
        </div>
      </div>
    </section>

    <section class="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-16" id="requisitos">
      <h2 class="font-head text-2xl md:text-3xl font-bold tracking-tight text-center">Qué necesitás para operar</h2>
      <p class="text-center text-on-surface-variant mt-2">Los pagos se procesan con Mercado Pago y van directo a la cuenta del prestador.</p>
      <div class="grid md:grid-cols-2 gap-6 mt-8">
        <div class="card p-6 md:p-8">
          <div class="flex items-center gap-2 font-head font-bold text-xl">${A.icon('home', 'text-primary')} Si sos cliente</div>
          <ul class="mt-4 space-y-4">${reqCliente.map(reqItem).join('')}</ul>
        </div>
        <div class="card p-6 md:p-8">
          <div class="flex items-center gap-2 font-head font-bold text-xl">${A.icon('engineering', 'text-secondary')} Si sos prestador</div>
          <ul class="mt-4 space-y-4">${reqPrestador.map(reqItem).join('')}</ul>
          <div class="mt-4 bg-amber-50 border border-amber-600 p-3 text-xs flex gap-2">${A.icon('info', 'text-amber-700 !text-base shrink-0')}<span>Si tu cuenta de Mercado Pago todavía no tiene la identidad validada, hacelo desde la app de Mercado Pago (DNI, foto y datos personales) antes de registrarte.</span></div>
        </div>
      </div>
    </section>

    <section class="max-w-[1200px] mx-auto px-4 md:px-8 pb-12 md:pb-16">
      <h2 class="font-head text-2xl md:text-3xl font-bold tracking-tight text-center">Confianza en cada paso</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">${garantias.map(([ic, t, d]) => `<div class="flex gap-3 p-4 border border-outline-variant bg-white">
        ${A.icon(ic, 'text-primary !text-2xl shrink-0')}<div><div class="font-head font-semibold">${t}</div><p class="text-sm text-on-surface-variant">${d}</p></div></div>`).join('')}</div>
      <div class="flex flex-wrap justify-center gap-2 mt-10">${oficios.map((o) => `<span class="chip-blue !text-[11px] !py-1 !px-3">${o}</span>`).join('')}</div>
    </section>

    <section class="bg-slate-950 text-white">
      <div class="max-w-[1200px] mx-auto px-4 md:px-8 py-12 md:py-14 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div><h2 class="font-head text-2xl md:text-3xl font-bold">¿Tenés algo para arreglar?</h2>
          <p class="opacity-80 mt-1">Creá tu cuenta en minutos y publicá tu primera solicitud.</p></div>
        <div class="flex flex-wrap gap-3">${me
          ? `<a href="#/" class="btn bg-white text-slate-950 border-white hover:bg-blue-50 !px-6 !py-3">${A.icon('arrow_forward')} Ir a la plataforma</a>`
          : `<button class="btn bg-secondary-container text-white border-secondary hover:bg-secondary !px-6 !py-3" data-action="landing-reg" data-rol="cliente">${A.icon('person_add')} Crear cuenta gratis</button>
             <a href="#/login" class="btn bg-transparent text-white border-white/70 hover:bg-white/10 !px-6 !py-3">${A.icon('login')} Ingresar</a>`}</div>
      </div>
    </section>`;
  };

  /* Lleva al registro con el rol ya elegido */
  A.actions['landing-reg'] = (el) => {
    A.ui.reg = { rol: el.dataset.rol || 'cliente', foto: [], step: 1 };
    A.go('#/registro');
  };
})();

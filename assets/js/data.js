/* Datos de ejemplo de la demo (se recargan con "Reiniciar demo"). */
window.SEED = function () {
  const IMG = 'assets/img/';
  const PASS = 'demo1234'; // contraseña de todas las cuentas de ejemplo
  const haceDias = (n) => { const d = new Date(Date.now() - n * 86400000); const p = (x) => String(x).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 09:00`; };
  const data = {
    // Comisión de OficiosYa por tipo de cobro (configurable en el panel admin). Siempre la paga el cliente.
    comisiones: { etapa: 0.10, visita: 0.10, ajuste: 0.10, materiales: 0.10 },
    // Disputas y garantías (configurables en el panel admin)
    plazoMediacion: 72, // horas de mediación entre las partes antes de pasar al árbitro
    plazoArbitro: 10, // días hábiles para que el árbitro resuelva
    plazoCorreccion: 5, // días por defecto para corregir una etapa
    plazoReclamo: 90, // días después del cierre para un reclamo por garantía
    topeGarantia: 100000, // tope por caso del fondo de garantía
    deudaMaxima: 50000, // deuda a partir de la cual el prestador se suspende automáticamente
    plazoVisita: 48, // horas: confirmación automática de la visita y plazo del prestador para responder un "no vino"
    plazoAprobacion: 7, // días: una etapa terminada sin respuesta del cliente se aprueba automáticamente (configurable)
    costoMP: 0.06, // costo de procesamiento estimado de Mercado Pago; también lo paga el cliente (configurable)
    mostrarComision: true, // demo: mostrar los recuadros "SOLO DEMO" con el desglose de la comisión
    currentUserId: null, // la demo arranca sin sesión, en la landing
    seq: 9000,
    users: [
      // Solicitantes
      { id: 'u-martin', rol: 'cliente', nombre: 'Martín', apellido: 'Sommer', dni: '20-31456789-3', tel: '11 5555-0101', email: 'martin.sommer@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'user-martin.jpg', estado: 'activo', zona: 'Palermo, CABA', reportes: [] },
      { id: 'u-marianaf', rol: 'cliente', nombre: 'Mariana', apellido: 'Fernández', dni: '27-30111222-4', tel: '11 5555-0102', email: 'mariana.f@mail.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', zona: 'Belgrano, CABA', reportes: [] },
      { id: 'u-andrea', rol: 'cliente', nombre: 'Andrea', apellido: 'Villalba', dni: '27-33999888-1', tel: '11 5555-0103', email: 'andrea.v@mail.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', zona: 'Caballito, CABA', reportes: [] },
      { id: 'u-federico', rol: 'cliente', nombre: 'Federico', apellido: 'Luna', dni: '20-28777666-5', tel: '11 5555-0104', email: 'fede.luna@mail.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', zona: 'Vicente López', reportes: [{ id: 'r1', texto: 'Prestador reporta que el cliente pidió pagar por fuera de la plataforma.', resuelto: false }] },
      // Prestadores
      { id: 'u-roberto', rol: 'prestador', nombre: 'Roberto', apellido: 'Gómez', dni: '20-24123456-7', tel: '11 5555-0201', email: 'roberto.gomez@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'prest-roberto.jpg', estado: 'activo', oficio: 'Plomería y Gas / Electricidad', matricula: 'Matrícula gasista #41982', rating: 4.9, trabajos: 84, zona: 'CABA', aclaraciones: ['No pico paredes ni hago trabajos de albañilería'] },
      { id: 'u-carlos', rol: 'prestador', nombre: 'Carlos', apellido: 'Méndez', dni: '20-29888777-2', tel: '11 5555-0202', email: 'carlos.mendez@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'prest-carlos.jpg', estado: 'activo', oficio: 'Plomería', matricula: 'Instalador sanitario', rating: 4.7, trabajos: 42, zona: 'Palermo', aclaraciones: ['No hago electricidad ni gas'] },
      { id: 'u-sib', rol: 'prestador', nombre: 'Servicios Integrales', apellido: 'BA', dni: '30-71234567-9', tel: '11 5555-0203', email: 'contacto@sib.com.ar', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', oficio: 'Mantenimiento general', matricula: 'Empresa habilitada', rating: 4.5, trabajos: 112, zona: 'CABA y GBA', aclaraciones: [] },
      { id: 'u-marcelo', rol: 'prestador', nombre: 'Marcelo', apellido: 'Kraus', dni: '20-26555444-3', tel: '11 5555-0204', email: 'marcelo.k@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'disp-tec-manometro.jpg', estado: 'activo', oficio: 'Plomería', matricula: 'Matrícula provincial #20331', rating: 4.92, trabajos: 64, zona: 'Caballito', aclaraciones: ['No trabajo en altura (más de 3 m)'] },
      { id: 'u-esteban', rol: 'prestador', nombre: 'Esteban R.', apellido: 'Morales', dni: '20-34209112-4', tel: '11 5555-0205', email: 'esteban.morales@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'kyc-esteban.jpg', estado: 'pendiente', oficio: 'Gas', matricula: 'Gasista matriculado 2° cat. MAT-ENARGAS #98224', zona: 'San Isidro', aclaraciones: [] },
      { id: 'u-rodrigo', rol: 'prestador', nombre: 'Rodrigo G.', apellido: 'Peralta', dni: '20-38741809-8', tel: '11 5555-0206', email: 'rodrigo.peralta@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'kyc-rodrigo.jpg', estado: 'pendiente', oficio: 'Electricidad', matricula: 'Técnico electricista CERT-COPIME #4410', zona: 'Quilmes', aclaraciones: [] },
      { id: 'u-marianav', rol: 'prestador', nombre: 'Mariana C.', apellido: 'Varela', dni: '27-31902551-3', tel: '11 5555-0207', email: 'mariana.varela@mail.com', pass: PASS, emailVerificado: true, foto: IMG + 'kyc-mariana.jpg', estado: 'pendiente', oficio: 'Climatización', matricula: 'Instaladora certificada MAT-CACAAV #1902', zona: 'Villa Urquiza', aclaraciones: [] },
      // Árbitros / soporte
      { id: 'u-laura', rol: 'arbitro', nombre: 'Laura', apellido: 'Benítez', dni: '27-29000111-6', email: 'laura.benitez@oficiosya.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo' },
      { id: 'u-diego', rol: 'arbitro', nombre: 'Diego', apellido: 'Ruiz', dni: '20-30222333-1', email: 'diego.ruiz@oficiosya.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo' },
      // Administradores
      { id: 'u-admin', rol: 'admin', nombre: 'Admin', apellido: 'General', dni: '-', email: 'admin@oficiosya.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', permisos: ['metricas', 'usuarios', 'arbitraje', 'permisos'] },
      { id: 'u-sofia', rol: 'admin', nombre: 'Sofía', apellido: 'Paz', dni: '-', email: 'sofia.paz@oficiosya.com', pass: PASS, emailVerificado: true, foto: '', estado: 'activo', permisos: ['usuarios'] },
    ],
    solicitudes: [
      {
        id: 'SOL-8841', titulo: 'Reparación de cañería principal y reemplazo de grifería monocomando en cocina', categoria: 'Plomería',
        direccion: 'Av. Santa Fe 3200', zona: 'Palermo, CABA', cp: '1425', clienteId: 'u-martin', creada: '2026-11-13 09:12', estado: 'abierta',
        descripcion: 'Bajo la mesada de la cocina hay un goteo constante en el empalme de entrada de agua caliente, justo antes de la llave de paso. El agua ya mojó el zócalo lateral del mueble y la madera está hinchada. Además perdimos presión en la canilla: tarda en salir el agua caliente y sale con poco caudal. La cañería es de PVC antiguo (aprox. 20 años) y la unión que gotea está a unos 40 cm del piso. Quiero reemplazar el tramo dañado por termofusión y aprovechar para instalar una grifería monocomando que ya compré (marca FV, modelo Arizona). Partes a hacer: cortar el agua, cambiar el tramo, instalar la grifería y probar que no pierda. El mueble se puede vaciar y el acceso es cómodo.',
        medidas: 'Tramo dañado aprox. 60 cm de caño 1/2". Bajo mesada: 80 cm ancho × 55 cm profundidad. Grifería monocomando ya comprada.',
        tareas: ['Cortar el agua y diagnosticar la pérdida', 'Reemplazar el tramo dañado por termofusión', 'Instalar grifería monocomando provista', 'Probar estanqueidad y limpiar la zona'],
        hitos: [],
        fotos: [IMG + 'sol-fuga-bacha.jpg', IMG + 'sol-humedad.jpg', IMG + 'sol-griferia.jpg'],
        postulaciones: [
          { id: 'P-1', tipo: 'presupuesto', prestadorId: 'u-roberto', fecha: '2026-11-14 10:20', estado: 'enviada',
            etapas: [
              { nombre: 'Diagnóstico y corte general', desc: 'Cierre de llave principal y prueba con manómetro.' },
              { nombre: 'Desarme bajo mesada', desc: 'Apertura de zócalo y retiro del tramo dañado.' },
              { nombre: 'Reparación y conexión monocomando', desc: 'Termofusión, válvula nueva y grifería.' },
              { nombre: 'Prueba hidráulica y limpieza final', desc: '30 min con agua caliente activa y retiro de escombros.' },
            ],
            montos: [6000, 9000, 18000, 9000], incluyeMateriales: true, detalleMateriales: 'Selladores, cuplas y accesorios de termofusión. La grifería la aporta el cliente.', costoMateriales: 9500, aportaHerramientas: true, detalleHerramientas: 'Termofusora, llaves y manómetro.', aclaracion: '', nota: 'Garantía de 6 meses sobre la mano de obra.' },
          { id: 'P-2', tipo: 'presupuesto', prestadorId: 'u-carlos', fecha: '2026-11-14 07:40', estado: 'enviada',
            etapas: [
              { nombre: 'Diagnóstico y corte de agua', desc: '' },
              { nombre: 'Reemplazo del tramo por termofusión', desc: 'Incluye llave de paso nueva.' },
              { nombre: 'Instalación de grifería y prueba', desc: '' },
            ],
            montos: [8000, 25000, 15000], incluyeMateriales: false, detalleMateriales: 'No incluye insumos ni cuplas (debe proveerlos el cliente).', costoMateriales: 0, aportaHerramientas: true, detalleHerramientas: 'Herramientas propias.', aclaracion: 'No incluye arreglo del mueble ni de azulejos', nota: '' },
          { id: 'P-3', tipo: 'presupuesto', prestadorId: 'u-sib', fecha: '2026-11-14 04:05', estado: 'enviada',
            etapas: [
              { nombre: 'Diagnóstico', desc: '' }, { nombre: 'Desarme', desc: '' }, { nombre: 'Reparación y grifería', desc: '' }, { nombre: 'Prueba y limpieza final', desc: '' },
            ],
            montos: [8000, 12000, 18000, 7000], incluyeMateriales: true, detalleMateriales: 'Repuestos de primera marca incluidos.', costoMateriales: 15000, aportaHerramientas: true, detalleHerramientas: 'Dos operarios con herramientas propias.', aclaracion: '', nota: 'Se termina en el día.' },
        ],
      },
      {
        id: 'SOL-8492', titulo: 'Instalación de cuadro eléctrico principal y cableado para climatización', categoria: 'Electricidad',
        direccion: 'Cabildo 1850', zona: 'Belgrano, CABA', cp: '1428', clienteId: 'u-marianaf', creada: '2026-11-15 08:30', estado: 'abierta',
        descripcion: 'Cada vez que encendemos los dos aires acondicionados inverter al mismo tiempo (uno de 3000 frigorías en el living y otro de 2250 en el dormitorio) salta la llave termomagnética general y nos quedamos sin luz en todo el departamento. El tablero es viejo, tiene una sola térmica de 25A y no tiene disyuntor diferencial. Los dos equipos están conectados a tomas comunes. Necesito que alguien revise la carga, cambie la térmica y ponga un disyuntor, y que tienda una línea separada para los aires desde el tablero. El tablero está en el pasillo de entrada, a 1,60 m de altura, y los equipos están a 6 y 11 metros. El departamento es un tercer piso con cañerías embutidas.',
        medidas: 'Distancia tablero → aire living: 6 m. Tablero → aire dormitorio: 11 m. Tablero a 1,60 m de altura.',
        tareas: ['Diagnóstico y prueba de fuga', 'Reemplazo de disyuntor y térmica', 'Tendido de cableado para los aires', 'Protocolo de puesta a tierra'],
        hitos: [],
        fotos: [IMG + 'ele-tablero-saturado.jpg', IMG + 'ele-bornera.jpg', IMG + 'ele-aire.jpg'],
        postulaciones: [
          { id: 'P-4', tipo: 'presupuesto', prestadorId: 'u-sib', fecha: '2026-11-15 09:10', estado: 'enviada',
            etapas: [
              { nombre: 'Diagnóstico integral y cálculo de carga', desc: '' },
              { nombre: 'Montaje de térmicas, disyuntor y acometida', desc: '' },
              { nombre: 'Tendido y aislación de línea independiente', desc: '' },
              { nombre: 'Pruebas con carga y puesta a tierra', desc: '' },
            ],
            montos: [20000, 30000, 35000, 12000], incluyeMateriales: false, detalleMateriales: '', costoMateriales: 0, aportaHerramientas: true, detalleHerramientas: '', aclaracion: '', nota: '' },
          { id: 'P-8', tipo: 'visita', prestadorId: 'u-roberto', fecha: '2026-11-15 11:45', estado: 'enviada',
            montoVisita: 12000, detalleVisita: 'Visita de diagnóstico: medición de consumo con pinza amperométrica, revisión del tablero y de las cañerías existentes. Después de la visita envío el presupuesto cerrado (es un pago aparte).',
            franja: 'Lunes 17/11 o martes 18/11, de 9 a 13 h', montos: [], etapas: [] },
        ],
      },
      {
        id: 'SOL-7930', titulo: 'Instalación y normalización de tablero trifásico', categoria: 'Electricidad',
        direccion: 'Gorriti 4500', zona: 'Palermo, CABA', cp: '1414', clienteId: 'u-martin', creada: '2026-11-08 11:00', estado: 'en_curso',
        descripcion: 'Tablero antiguo sin disyuntor diferencial. Se necesita normalizar el tablero y separar circuitos de iluminación, tomas y climatización.',
        medidas: 'Tablero de 12 bocas. Casa de 2 plantas.',
        tareas: ['Medir puesta a tierra', 'Montar gabinete y térmicas', 'Canalizar línea ignífuga', 'Probar con carga'],
        hitos: [
          { nombre: 'Diagnóstico de carga y aislamiento previo', desc: 'Medición de puesta a tierra (3.8 Ohms).', estado: 'completado', hora: '10/11 10:15', pagado: true },
          { nombre: 'Montaje de cuadro y llaves termomagnéticas', desc: 'Caja IP65, riel DIN, disyuntor 40A y 4 térmicas.', estado: 'completado', hora: '11/11 12:30', pagado: true },
          { nombre: 'Tendido y canalización de línea ignífuga', desc: 'Conductores IRAM 2183, prensacables sellados.', estado: 'por_aprobar', hora: '12/11 14:45', pagado: true, terminadaEn: haceDias(1) },
          { nombre: 'Prueba de carga, tensión y entrega final', desc: 'Mediciones y entrega final.', estado: 'pendiente' },
        ],
        fotos: [IMG + 'ele-tablero-saturado.jpg', IMG + 'ele-bornera.jpg'],
        postulaciones: [
          { id: 'P-5', prestadorId: 'u-roberto', fecha: '2026-11-08 15:00', estado: 'aceptada', montos: [15000, 28000, 32000, 10000], incluyeMateriales: true, detalleMateriales: 'Disyuntor 40A 30mA, térmicas, 25m de cable 4mm IRAM. Se rinden con ticket.', costoMateriales: 45000, aportaHerramientas: true, detalleHerramientas: 'Pinza amperométrica, telurímetro, taladro.', aclaracion: '', nota: 'Garantía técnica de 6 meses.' },
        ],
        asignada: { postulacionId: 'P-5', prestadorId: 'u-roberto' },
        // Etapas 1 a 3 pagadas (1 y 2 aprobadas, 3 esperando aprobación), etapa 4 sin pagar y ticket C-1 pagado.
        // Los pagos con split se generan abajo, en la normalización.
        escrow: { fecha: haceDias(9) },
        evidenciasPost: [IMG + 'seg-tablero.jpg', IMG + 'seg-multimetro.jpg', IMG + 'seg-canalizacion.jpg'],
        compras: [
          { id: 'C-1', detalle: 'Disyuntor 40A 30mA, 4 térmicas 2x16A y riel DIN', monto: 38000, foto: IMG + 'ticket-ejemplo.svg', fecha: '2026-11-11 14:40', estado: 'pagada' },
          { id: 'C-2', detalle: '25 m de cable 4 mm IRAM y prensacables', monto: 14500, foto: IMG + 'ticket-ejemplo.svg', fecha: '2026-11-12 10:05', estado: 'pendiente' },
        ],
      },
      {
        id: 'SOL-8810', titulo: 'Pintura epoxi de alto tránsito para piso de garaje 40m²', categoria: 'Pintura',
        direccion: 'Av. Maipú 900', zona: 'Vicente López', cp: '1638', clienteId: 'u-federico', creada: '2026-11-12 18:20', estado: 'abierta',
        descripcion: 'Tengo un garaje de 40 m² (8 m × 5 m) con piso de hormigón alisado que tiene manchas de aceite y algunas fisuras finas. Quiero aplicar pintura epoxi de alto tránsito porque entran dos autos todos los días. Antes hay que desengrasar y pulir el piso para que la pintura agarre bien. Me interesa que se aplique una imprimación y dos manos de terminación en color gris. Las fisuras son finas (menos de 2 mm) y están cerca del portón. El garaje se puede dejar libre durante 4 o 5 días para que cure. Hay toma de agua y de luz dentro del garaje. Prefiero que el prestador compre la pintura y me pase el ticket.',
        medidas: '8 m × 5 m (40 m²). Fisuras finas de menos de 2 mm, aprox. 3 m lineales.',
        tareas: ['Desengrasar y pulir el piso', 'Sellar fisuras', 'Aplicar imprimación', 'Aplicar dos manos de epoxi'],
        hitos: [],
        fotos: [IMG + 'job-garage.jpg'],
        postulaciones: [],
      },
      {
        id: 'SOL-7502', titulo: 'Reparación de pérdida de gas en cocina', categoria: 'Gas',
        direccion: 'Rivadavia 5100', zona: 'Caballito, CABA', cp: '1405', clienteId: 'u-andrea', creada: '2026-10-28 10:00', estado: 'completada',
        descripcion: 'Olor a gas detrás de la cocina. Sustituir flexible y llave de paso.',
        medidas: '',
        tareas: ['Detección de pérdida', 'Cambio de flexible y llave de paso', 'Prueba de hermeticidad'],
        hitos: [
          { nombre: 'Detección neumática', desc: '', estado: 'completado', hora: '29/10 10:00' },
          { nombre: 'Sustitución de flexible y llave', desc: '', estado: 'completado', hora: '29/10 12:00' },
          { nombre: 'Prueba de hermeticidad', desc: '', estado: 'completado', hora: '29/10 13:10' },
        ],
        fotos: [IMG + 'job-gas-cocina.jpg'],
        postulaciones: [
          { id: 'P-6', prestadorId: 'u-roberto', fecha: '2026-10-28 12:00', estado: 'aceptada', montos: [25000, 45000, 15000], incluyeMateriales: true, detalleMateriales: 'Flexible aprobado y llave de paso 1/2".', costoMateriales: 10000, aportaHerramientas: true, detalleHerramientas: '', aclaracion: '', nota: '' },
        ],
        asignada: { postulacionId: 'P-6', prestadorId: 'u-roberto' },
        escrow: { fecha: '2026-10-28 15:00' },
        evidenciasPost: [IMG + 'job-gas-cocina.jpg'],
      },
      {
        id: 'SOL-7011', titulo: 'Pintura de living y comedor (paredes y cielorraso)', categoria: 'Pintura',
        direccion: 'Gorriti 4500', zona: 'Palermo, CABA', cp: '1414', clienteId: 'u-martin', creada: '2026-09-28 10:30', estado: 'completada',
        descripcion: 'Pintura completa de living-comedor: paredes con látex interior y cielorraso con antihongos.',
        medidas: 'Living-comedor de 6 m × 4 m, altura 2,70 m.',
        tareas: ['Preparar paredes', 'Pintar cielorraso', 'Pintar paredes (2 manos)'],
        hitos: [
          { nombre: 'Preparación de superficie', desc: 'Lijado, enduido y fijador.', estado: 'completado', hora: '02/10 17:00' },
          { nombre: 'Cielorraso', desc: '', estado: 'completado', hora: '03/10 16:30' },
          { nombre: 'Paredes y limpieza final', desc: '', estado: 'completado', hora: '05/10 15:10' },
        ],
        fotos: [IMG + 'sol-humedad.jpg'],
        postulaciones: [
          { id: 'P-9', prestadorId: 'u-sib', fecha: '2026-09-28 18:00', estado: 'aceptada', montos: [40000, 35000, 55000], incluyeMateriales: true, detalleMateriales: 'Látex interior 20 L, antihongos, enduido y fijador.', costoMateriales: 30000, aportaHerramientas: true, detalleHerramientas: '', aclaracion: 'No reparo humedad de cimientos', nota: 'Garantía de 6 meses.' },
        ],
        asignada: { postulacionId: 'P-9', prestadorId: 'u-sib' },
        escrow: { fecha: '2026-09-30 11:00' },
        evidenciasPost: [IMG + 'job-tablero-nuevo.jpg'],
        resena: {
          estrellas: 5, fecha: '2026-10-05 19:00',
          comentario: 'Muy prolijos y puntuales. Cubrieron todos los muebles y dejaron todo limpio.',
          seguimientos: [
            { autor: 'cliente', fecha: '2026-11-06 10:20', texto: 'A un mes del trabajo se brotó la pintura en la pared junto a la ventana del living.', fotos: [IMG + 'sol-humedad.jpg'] },
            { autor: 'prestador', fecha: '2026-11-06 15:40', texto: 'Gracias por avisar. Parece humedad que sube desde el zócalo. Pasamos el jueves a evaluarlo: la mano de obra tiene 6 meses de garantía.', fotos: [] },
          ],
        },
      },
      {
        id: 'SOL-7104', titulo: 'Bomba presurizadora y cañería de alimentación', categoria: 'Plomería',
        direccion: 'Acoyte 300', zona: 'Caballito, CABA', cp: '1405', clienteId: 'u-andrea', creada: '2026-11-02 09:00', estado: 'en_disputa',
        descripcion: 'Instalar bomba presurizadora nueva y rehacer la unión roscada de la cañería de alimentación.',
        medidas: '',
        tareas: ['Retirar bomba vieja', 'Instalar bomba nueva', 'Sellar uniones y probar presión'],
        hitos: [
          { nombre: 'Retiro de equipo anterior', desc: '', estado: 'completado', hora: '05/11 09:30', pagado: true },
          { nombre: 'Instalación de bomba', desc: '', estado: 'completado', hora: '05/11 12:10', pagado: true },
          { nombre: 'Sellado y prueba de presión', desc: '', estado: 'por_aprobar', hora: '05/11 15:58', pagado: true, terminadaEn: '2026-11-05 15:58' },
        ],
        fotos: [IMG + 'job-cobre-fuga.jpg'],
        postulaciones: [
          { id: 'P-7', prestadorId: 'u-marcelo', fecha: '2026-11-02 14:00', estado: 'aceptada', montos: [15000, 40000, 20000], incluyeMateriales: true, detalleMateriales: 'Cinta, sellador anaeróbico y uniones.', costoMateriales: 20000, aportaHerramientas: true, detalleHerramientas: '', aclaracion: '', nota: '' },
        ],
        asignada: { postulacionId: 'P-7', prestadorId: 'u-marcelo' },
        // Etapas 1 y 2 aprobadas; la etapa 3 está pagada y en disputa (el prestador ya cobró ese pago)
        escrow: { fecha: '2026-11-03 10:00' },
        evidenciasPost: [IMG + 'disp-tec-manometro.jpg', IMG + 'disp-tec-teflon.jpg'],
        disputa: {
          id: 'DISP-104', abiertaPor: 'cliente', motivo: 'Trabajo incompleto / parcial', fecha: '2026-11-06 08:15', arbitroId: 'u-laura',
          fase: 'arbitraje', venceMediacion: '2026-11-09 08:15', escalada: '2026-11-09 08:15', venceArbitro: '2026-11-23 08:15',
          propuestas: [{ id: 'PR-1', por: 'prestador', tipo: 'corregir', plazo: 3, monto: 0, nota: 'Vuelvo a sellar la unión roscada superior y hago la prueba con las canillas abiertas delante de la clienta.', estado: 'rechazada', fecha: '2026-11-07 10:00' }],
          cliente: { declaracion: 'La bomba gotea de manera continua por la unión roscada superior. El instalador se retiró sin realizar la prueba final con las canillas abiertas y me pidió que aprobara la etapa antes de verificar.', fotos: [IMG + 'disp-fuga-bomba.jpg', IMG + 'disp-cinta-bomba.jpg'] },
          prestador: { declaracion: 'El equipo quedó montado sobre base nivelada y sellado. El manómetro marcó 1.8 bar estables durante 10 minutos. La cliente no quiso aprobar la etapa.', fotos: [IMG + 'disp-tec-manometro.jpg', IMG + 'disp-tec-teflon.jpg'] },
        },
      },
    ],
    movimientos: [], // se generan abajo a partir de los pagos de cada trabajo
  };

  // Trabajos cerrados y calificados (historial de reputación para el explorador y el ranking por oficio).
  const cerrada = (o) => {
    data.solicitudes.push({
      id: o.id, titulo: o.titulo, categoria: o.categoria, direccion: '', zona: o.zona, cp: o.cp, clienteId: o.clienteId, creada: o.fecha + ' 09:00', estado: 'completada',
      descripcion: o.descripcion, medidas: '', tareas: [], fotos: [IMG + o.foto],
      hitos: o.etapas.map((n) => ({ nombre: n, desc: '', estado: 'completado', pagado: true, hora: o.fecha.slice(8, 10) + '/' + o.fecha.slice(5, 7) + ' 17:00' })),
      postulaciones: [{ id: 'P-' + o.id, prestadorId: o.prestadorId, fecha: o.fecha + ' 12:00', estado: 'aceptada', montos: o.montos, incluyeMateriales: false, detalleMateriales: 'Los provee el cliente.', costoMateriales: 0, aportaHerramientas: true, detalleHerramientas: '', aclaracion: '', nota: '' }],
      asignada: { postulacionId: 'P-' + o.id, prestadorId: o.prestadorId },
      escrow: { fecha: o.fecha + ' 15:00' },
      evidenciasPost: [IMG + o.foto],
      resena: { estrellas: o.estrellas, comentario: o.comentario, fecha: o.fecha + ' 20:00', seguimientos: o.seguimientos || [] },
    });
  };
  cerrada({ id: 'SOL-6720', titulo: 'Agregar circuito independiente para horno eléctrico', categoria: 'Electricidad', zona: 'Palermo, CABA', cp: '1425', clienteId: 'u-martin', prestadorId: 'u-roberto', fecha: '2026-09-12',
    descripcion: 'Circuito nuevo desde el tablero hasta la cocina para el horno eléctrico, con térmica propia.', etapas: ['Diagnóstico', 'Tendido', 'Conexión y prueba'], montos: [12000, 38000, 15000], foto: 'job-tablero-nuevo.jpg',
    estrellas: 5, comentario: 'Impecable. Explicó todo, dejó el tablero rotulado y no quedó ni un resto de cable.' });
  cerrada({ id: 'SOL-6655', titulo: 'Cambio de flexible y regulador del calefón', categoria: 'Gas', zona: 'Caballito, CABA', cp: '1405', clienteId: 'u-andrea', prestadorId: 'u-roberto', fecha: '2026-08-30',
    descripcion: 'El calefón se apagaba solo. Cambio de flexible, regulador y prueba de hermeticidad.', etapas: ['Diagnóstico', 'Reemplazo', 'Prueba de hermeticidad'], montos: [10000, 28000, 9000], foto: 'job-gas-cocina.jpg',
    estrellas: 5, comentario: 'Muy profesional, matriculado y con todas las pruebas hechas delante mío.' });
  cerrada({ id: 'SOL-6890', titulo: 'Destapación de cañería de cocina', categoria: 'Plomería', zona: 'Belgrano, CABA', cp: '1428', clienteId: 'u-marianaf', prestadorId: 'u-roberto', fecha: '2026-10-03',
    descripcion: 'Pileta de cocina tapada. Destapación con máquina y cambio de sifón.', etapas: ['Diagnóstico', 'Destapación', 'Cambio de sifón y prueba'], montos: [8000, 20000, 9000], foto: 'sol-fuga-bacha.jpg',
    estrellas: 3, comentario: 'Resolvió el problema pero llegó dos horas tarde y dejó la cocina sucia.' });
  cerrada({ id: 'SOL-6801', titulo: 'Reemplazo de canilla y flexibles del baño', categoria: 'Plomería', zona: 'Palermo, CABA', cp: '1414', clienteId: 'u-martin', prestadorId: 'u-carlos', fecha: '2026-09-25',
    descripcion: 'Cambio de canilla de lavatorio y flexibles por pérdida.', etapas: ['Desarme', 'Instalación', 'Prueba'], montos: [6000, 14000, 5000], foto: 'sol-griferia.jpg',
    estrellas: 5, comentario: 'Rápido y prolijo. Muy buen precio.' });
  cerrada({ id: 'SOL-6602', titulo: 'Reparación de pérdida en cañería de agua fría', categoria: 'Plomería', zona: 'Caballito, CABA', cp: '1405', clienteId: 'u-andrea', prestadorId: 'u-marcelo', fecha: '2026-08-18',
    descripcion: 'Pérdida en caño de agua fría en el lavadero. Reparación por termofusión.', etapas: ['Detección', 'Reparación', 'Prueba'], montos: [9000, 26000, 7000], foto: 'job-cobre-fuga.jpg',
    estrellas: 5, comentario: 'Encontró la pérdida enseguida con el manómetro. Muy recomendable.' });
  cerrada({ id: 'SOL-6540', titulo: 'Pintura de dormitorio y placard', categoria: 'Pintura', zona: 'Vicente López', cp: '1638', clienteId: 'u-federico', prestadorId: 'u-sib', fecha: '2026-08-05',
    descripcion: 'Pintura de dormitorio de 3 × 3,5 m y placard con esmalte.', etapas: ['Preparación', 'Pintura', 'Limpieza final'], montos: [20000, 45000, 8000], foto: 'sol-humedad.jpg',
    estrellas: 4, comentario: 'Buen terminado. Tardaron un día más de lo pactado.' });
  cerrada({ id: 'SOL-6575', titulo: 'Instalación de tomacorrientes en living', categoria: 'Electricidad', zona: 'Belgrano, CABA', cp: '1428', clienteId: 'u-marianaf', prestadorId: 'u-sib', fecha: '2026-09-02',
    descripcion: 'Agregar tres tomacorrientes en el living con cañería exterior.', etapas: ['Tendido', 'Conexión', 'Prueba'], montos: [18000, 12000, 6000], foto: 'ele-bornera.jpg',
    estrellas: 2, comentario: 'Los tomas quedaron torcidos y hubo que volver a llamarlos.' });

  // Pagos con split de los ejemplos: cada etapa pagada es un cobro a nombre del prestador con application_fee.
  // El cliente paga el monto del prestador + la comisión del tipo de cobro + el costo de MP.
  const C = data.comisiones; const MP = data.costoMP;
  const bruto = (n, t) => Math.round((n + Math.round(n * t)) / (1 - MP));
  const alC = (n) => bruto(n, C.etapa);
  const pMat = (m) => bruto(m, C.materiales);
  let nPay = 0;
  data.users.forEach((u) => { if (u.rol === 'prestador') { u.mpCuenta = { usuario: u.email, vinculada: '2026-08-01', kyc: 6 }; u.deuda = 0; } });
  data.solicitudes.forEach((s) => {
    s.compras = s.compras || [];
    if (!s.escrow) return;
    const p = s.postulaciones.find((x) => x.id === s.asignada.postulacionId);
    const mat = p.incluyeMateriales ? Number(p.costoMateriales) || 0 : 0;
    const e = s.escrow;
    Object.assign(e, { tasas: Object.assign({}, C), mp: MP, estado: s.estado === 'completada' ? 'liquidado' : 'activo', pagos: [], cobrado: 0, liberadoPrestador: 0, comisionCobrada: 0, costoMPTotal: 0, reembolsado: 0 });
    const pagar = (concepto, ref, cliente, neto, fecha) => {
      const mpFee = Math.round(cliente * MP); const fee = Math.max(0, cliente - neto - mpFee); const recibe = cliente - mpFee - fee;
      const id = 'MP-98' + s.id.slice(4) + String(++nPay).padStart(3, '0');
      e.pagos.push({ id, concepto, ref, cliente, recibe, mpFee, fee, recupero: 0, reembolsado: 0, fecha });
      e.cobrado += cliente; e.liberadoPrestador += recibe; e.comisionCobrada += fee; e.costoMPTotal += mpFee;
      data.movimientos.push({ fecha, tipo: concepto, solicitudId: s.id, monto: cliente, api: `POST /v1/payments (token OAuth del prestador) { "transaction_amount": ${cliente}, "application_fee": ${fee} } → prestador ${recibe} · costo MP ${mpFee}` });
    };
    if (s.estado === 'completada') s.hitos.forEach((h) => { h.pagado = true; });
    if (s.estado === 'completada' && mat && !s.compras.length) {
      s.compras.push({ id: 'C-' + s.id.slice(4), detalle: p.detalleMateriales || 'Materiales', monto: mat, foto: IMG + 'ticket-ejemplo.svg', fecha: e.fecha, estado: 'pagada' });
    }
    s.hitos.forEach((h, i) => { if (h.pagado) pagar(`Pago de etapa ${i + 1}`, 'etapa:' + i, alC(p.montos[i]), p.montos[i], e.fecha); });
    s.compras.forEach((c) => { if (c.estado === 'pagada') pagar(`Pago de materiales (ticket ${c.id})`, 'compra:' + c.id, pMat(c.monto), c.monto, c.fecha); });
    e.paymentId = e.pagos[0].id;
    if (s.estado === 'completada') s.cerradaEn = s.resena ? s.resena.fecha : e.fecha;
    e.neto = p.montos.reduce((a, b) => a + b, 0); e.total = p.montos.reduce((a, b) => a + alC(b), 0);
  });
  data.movimientos.sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Normalización: todas las postulaciones tienen tipo y etapas propias del prestador.
  data.solicitudes.forEach((s) => {
    s.postulaciones.forEach((p) => {
      p.tipo = p.tipo || 'presupuesto';
      if (!p.etapas || (!p.etapas.length && p.tipo === 'presupuesto')) p.etapas = s.hitos.map((h) => ({ nombre: h.nombre, desc: h.desc }));
      if (p.aclaracion == null) p.aclaracion = '';
      if (p.tipo === 'presupuesto' && !p.origen) p.origen = 'directo';
    });
    // Historial de la solicitud (auditoría de visitas, presupuestos, pagos y contactos)
    s.historial = [{ fecha: s.creada, tipo: 'publicada', texto: 'Solicitud publicada por el cliente' }]
      .concat(s.postulaciones.map((p) => ({ fecha: p.fecha, tipo: p.tipo === 'visita' ? 'visita' : 'presupuesto', prestadorId: p.prestadorId,
        texto: p.tipo === 'visita' ? 'Visita técnica ofrecida' : 'Presupuesto enviado (directo, sin visita previa)' })));
    if (s.escrow) s.historial.push({ fecha: s.escrow.fecha, tipo: 'pago', prestadorId: s.asignada.prestadorId, texto: 'Presupuesto aceptado. Pago de la etapa 1 acreditado al prestador (split de Mercado Pago)' });
    s.historial.sort((a, b) => a.fecha.localeCompare(b.fecha));
  });
  return data;
};

// Etapas sugeridas por oficio. Ahora las usa el PRESTADOR al armar su presupuesto (el cliente ya no define los pasos).
window.CATEGORIAS = {
  'Plomería': ['Diagnóstico', 'Desarme', 'Reparación', 'Prueba', 'Limpieza final'],
  'Gas': ['Diagnóstico', 'Desarme', 'Reparación', 'Prueba de hermeticidad', 'Limpieza final'],
  'Electricidad': ['Diagnóstico', 'Montaje', 'Tendido / conexión', 'Prueba con carga'],
  'Albañilería': ['Diagnóstico', 'Demolición / desarme', 'Reparación', 'Terminaciones', 'Limpieza final'],
  'Pintura': ['Preparación de superficie', 'Primera mano', 'Terminación', 'Limpieza final'],
  'Limpieza de interiores': ['Relevamiento', 'Limpieza general', 'Limpieza final y revisión'],
  'Climatización': ['Diagnóstico', 'Instalación', 'Carga y prueba', 'Limpieza final'],
};
// Única categoría en la que el cliente puede tener que proveer las herramientas / elementos.
window.CAT_HERRAMIENTAS_CLIENTE = 'Limpieza de interiores';
window.MIN_DESC_SOLICITUD = 500;
// Oficios regulados: al registrarse como prestador se exige número de matrícula (la foto es opcional).
window.OFICIOS_MATRICULA = {
  'Gas': 'Gasista matriculado (ENARGAS / distribuidora)',
  'Electricidad': 'Electricista matriculado (COPIME / APSE / colegio provincial)',
};
window.TIPOS_DENUNCIA = ['Acoso', 'Agresión verbal o insultos', 'Agresión física', 'Amenazas', 'Discriminación', 'Pedido de pago por fuera de la plataforma', 'Otro'];

// Fotos de ejemplo para cargar rápido durante la presentación
window.FOTOS_EJEMPLO = {
  solicitud: ['assets/img/sol-fuga-bacha.jpg', 'assets/img/job-cobre-fuga.jpg'],
  post: ['assets/img/seg-tablero.jpg', 'assets/img/seg-multimetro.jpg', 'assets/img/job-tablero-nuevo.jpg'],
  contra: ['assets/img/disp-fuga-bomba.jpg', 'assets/img/disp-cinta-bomba.jpg'],
  rostro: ['assets/img/kyc-mariana.jpg', 'assets/img/kyc-rodrigo.jpg', 'assets/img/kyc-esteban.jpg'],
  ticket: ['assets/img/ticket-ejemplo.svg'],
  matricula: ['assets/img/ticket-ejemplo.svg'],
  denuncia: ['assets/img/disp-fuga-bomba.jpg'],
  resena: ['assets/img/sol-humedad.jpg'],
};

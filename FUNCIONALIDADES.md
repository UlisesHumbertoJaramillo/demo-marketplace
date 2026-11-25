# OficiosYa — Demo MVP: puntos funcionales

Demo navegable del *Marketplace de Servicios de Oficios — Fase 1 (MVP)*, basada en el documento de requerimientos, en las pantallas de `/ejemplos` y en las modificaciones de `actualizaciones.txt`.

## Cómo abrirla

- Abrir `demo/index.html` con doble clic. No necesita servidor ni internet (fuentes, íconos, imágenes y CSS son locales).
- Para compartirla: comprimir la carpeta `demo/` (la subcarpeta `_build/` es opcional; solo sirve para recompilar el CSS).
- Al abrirla se ve la **landing page** (sin sesión), con botones para crear una cuenta o ingresar. También se puede entrar directo con la barra "Ver como".
- Todas las cuentas de ejemplo usan la contraseña **demo1234**.
- La barra negra superior es de uso exclusivo de la demo:
  - **Ver como**: cambia de usuario y rol sin contraseña (Cliente, Prestador, Administrador, Árbitro).
  - **Login**: abre la pantalla de inicio de sesión.
  - **+ Registrar usuario**: abre el registro.
  - **Reiniciar demo**: vuelve a los datos de ejemplo.
- Los cambios se guardan solo en el navegador (localStorage). Pagos, emails y reembolsos son **simulados**.

---

## Novedades de esta versión (actualizaciones.txt)

| # | Cambio pedido | Cómo quedó en la demo | Dónde |
|---|---|---|---|
| N.1 | Los pasos los define el prestador en el presupuesto | El cliente ya no carga hitos. Cada prestador propone sus **etapas** (nombre, detalle y monto), con un botón para usar las etapas sugeridas para el oficio. Al aceptar, esas etapas pasan al seguimiento del trabajo | `#/solicitud/:id` (prestador), `#/trabajo/:id` |
| N.2 | Mínimo de detalle de 500 caracteres en la solicitud, que puede incluir pasos, etapas o partes | El detalle de la solicitud exige **500 caracteres** como mínimo, con contador en vivo. Hay un campo de **medidas y datos técnicos** y una lista opcional de **partes/tareas** | `#/publicar` |
| N.3 | Las herramientas las aporta el prestador, excepto en limpieza de interiores | En todas las categorías las herramientas las aporta el prestador (no se puede cambiar). Solo en **Limpieza de interiores** el prestador puede indicar que el cliente provea algunos elementos | `#/publicar`, presupuesto |
| N.4 | El prestador puede comprar materiales: declara el monto y adjunta foto del ticket | En el presupuesto indica si compra los materiales y un monto estimado. Durante el trabajo **pide el pago de cada compra** con el monto del comercio; el cliente la **paga antes de que se haga** y después el prestador **sube el ticket** (foto obligatoria) con el monto real. Más barato: crédito en la próxima etapa; más caro: pago complementario (ver N.29) | `#/trabajo/:id` → Compras de materiales |
| N.5 | Se puede cobrar solo la visita; después el presupuesto, en dos pagos diferentes | El prestador elige **"Solo cobrar visita"** (monto, qué incluye, días y horarios). El cliente la paga (pago 1, se acredita al prestador) y confirma que se realizó. Después el prestador envía el presupuesto, que se paga aparte, por etapas | `#/solicitud/:id` |
| N.6 | Calificar el servicio con comentarios después del pago (ej. "a un mes se brotó la pintura") | Al terminar, el cliente califica con **1 a 5 estrellas y un comentario**. Después puede sumar **comentarios posteriores** con fecha y fotos, en cualquier momento. El prestador puede responder. Las reseñas aparecen en el perfil del prestador y en sus presupuestos | `#/trabajo/:id`, `#/perfil` |
| N.7 | Disputa de precio después de aceptar el presupuesto y posible rechazo del cliente o del prestador | Con el trabajo en curso, cualquiera de las partes propone un **ajuste de precio** con motivo. Si la otra parte lo acepta, la diferencia se aplica a las etapas que faltan pagar (con todo pagado, se cobra o se reembolsa en el momento). Si lo rechaza, pueden seguir con el precio original o **rechazar el trabajo**: sin etapa pagada en curso se cancelan las etapas sin pagar; con una etapa pagada en curso, se reembolsa (si rescinde el prestador) o pasa a arbitraje | `#/trabajo/:id` |
| N.8 | Aclaración resaltada del prestador (ej. "No pico paredes", "No hago electricidad ni gas") | El prestador carga **aclaraciones destacadas** en su perfil y puede sumar otra en cada presupuesto. Se muestran resaltadas en amarillo junto a su cotización | `#/perfil`, presupuesto |
| N.9 | Las fotos de evidencia públicas deben ser de la parte a arreglar, no generales | La sección de fotos explica qué subir y qué no. Si hay fotos, el cliente debe **confirmar** que muestran solo la parte a reparar | `#/publicar` |
| N.10 | Instructivo para el cliente sobre cómo cargar una solicitud | Hay un **instructivo desplegable** con 5 pasos (título, situación, medidas, accesos y fotos) y un ejemplo poco específico al lado de uno específico | `#/publicar` |
| N.11 | Pantallas de login y registro | **Login** con email y contraseña, accesos rápidos a las cuentas de ejemplo, **recuperación de contraseña** por código enviado por email y **cerrar sesión**. El registro pide repetir la contraseña y aceptar los términos | `#/login`, `#/registro` |

### Segunda ronda de cambios

| # | Cambio pedido | Cómo quedó en la demo | Dónde |
|---|---|---|---|
| N.12 | Íconos rotos | La fuente local de íconos solo traía los de la primera versión. Se regeneró con todos los íconos que usa la demo | `assets/fonts/material-symbols.woff2` |
| N.13 | Cancelar la visita si el prestador no vino | Con la visita pagada, el cliente tiene el botón **"El prestador no vino · cancelar visita"** (con motivo). Se cancela el pedido, se **reembolsa el 100%** de la visita y queda un reporte en el perfil del prestador para administración | `#/solicitud/:id` (cliente) |
| N.14 | Presupuesto sin visita | El prestador elige entre **"Presupuesto directo"** y **"Cobrar visita primero"**. Si había ofrecido una visita todavía no pagada y manda un presupuesto directo, la visita queda **retirada** y registrada | `#/solicitud/:id` (prestador) |
| N.15 | Registro de visita y después presupuesto | Cada presupuesto indica su origen: **"Presupuesto directo (sin visita previa)"** o **"Presupuesto tras visita realizada el …"**, vinculado a la visita. Hay un **historial de la solicitud** con cada paso: publicación, visita ofrecida, pagada, realizada o cancelada, presupuesto, pago y accesos al contacto | Solicitud, trabajo |
| N.16 | Datos de contacto con advertencias y denuncia | Después de pagar una visita o un presupuesto, cliente y prestador pueden **ver los datos de contacto** (teléfono, email y, del cliente, la dirección). Antes tienen que aceptar las **advertencias de seguridad**, y queda registrado en el historial. Ambos pueden **denunciar acoso o agresiones** con tipo, relato y **evidencia en fotos**, y pedir que se oculten sus datos al denunciado. Administración revisa en la pestaña **Denuncias** | Solicitud, trabajo, `#/admin` → Denuncias |
| N.18 | En el explorador, mostrar qué prestador atendió cada solicitud y sus calificaciones | Las solicitudes adjudicadas muestran **"Atendida por"** con el prestador y tres datos: su **calificación en esa solicitud**, su **calificación general** y su **promedio en ese oficio**. Hay un **ranking de mejor valorados por oficio**, un orden **"Mejor calificados"** y búsqueda por nombre del prestador | `#/` |
| N.19 | Qué solicitudes ve cada rol al explorar (privacidad, RNF03) | El **cliente** ve completas solo sus solicitudes. De otros clientes solo ve los **trabajos terminados** en formato resumido. El **prestador** ve completas las solicitudes **abiertas** (para cotizar) y sus trabajos asignados. De los trabajos de otros prestadores solo ve el resumen. El resumen muestra título, oficio, zona y "Atendida por", sin fotos, descripción, código postal ni nombre del cliente. En las tarjetas completas el cliente aparece abreviado ("Martín S."). Ver la tabla "Visibilidad por rol" | `#/`, `#/solicitud/:id` |
| N.20 | Landing page simple con llamada a la acción | Portada pública que explica el sistema: propuesta de valor, **cómo funciona** en 4 pasos, beneficios **para clientes** y **para prestadores**, **qué necesita cada uno para operar** (cuenta con datos reales, medio de pago; para el prestador, matrícula y cuenta de Mercado Pago con KYC 6, cada requisito marcado como obligatorio u opcional), **garantías** (identidad, pago por etapa, arbitraje, calificaciones, tickets, contacto seguro) y oficios disponibles. Botones **"Crear cuenta gratis"** (abre el registro como cliente), **"Registrarme como prestador"** (abre el registro como prestador) e **"Ingresar"** (login). Es la pantalla inicial sin sesión, y también se abre desde el logo y desde "¿Qué es OficiosYa?" en el pie | `#/inicio` (y `#/` sin sesión) |
| N.21 | Estrategia de cobro (*reemplazada por N.23*) | Era "pago primero, liberación por etapas" con custodia de la plataforma y plazo máximo de 90 días. Se reemplazó por el pago por etapa con split de Mercado Pago | — |
| N.22 | La comisión se suma al precio del cliente, no se descuenta al prestador, y es configurable | **El prestador cobra exactamente lo que presupuesta** y en su pantalla solo ve "Total a cobrar". **El cliente ve un único precio final** (por etapa y total) con la comisión incluida, **sin desglose ni mención**. La comisión se cobra en **todos los tipos de cobro** (etapas, visita, ajustes y materiales), con una tasa configurable para cada uno (ver N.24). El desglose solo aparece en recuadros **"SOLO DEMO"** (se pueden ocultar) y para admin/arbitraje. Cada trabajo guarda las tasas con las que se contrató | Presupuestos, checkout, expediente, `#/admin` |
| N.23 | **Pago por etapa con split de Mercado Pago** (sin custodia) | Al aceptar el presupuesto, el cliente paga **solo la etapa 1**. Cada etapa se paga **antes de que empiece**: al aprobar una etapa se abre el pago de la siguiente. Cada pago se crea a nombre del prestador y se acredita en el momento en su cuenta de Mercado Pago; OficiosYa cobra su comisión en el mismo pago (`application_fee`). El prestador no empieza una etapa sin el pago acreditado. Se eliminó el PIN (ver N.26). Los tickets se pagan uno por uno al aprobarlos. El arbitraje resuelve sobre el **pago de la etapa en curso**. Se eliminó el plazo de custodia de 90 días | `#/solicitud/:id`, `#/trabajo/:id`, `#/arbitraje/:id`, landing |
| N.24 | Costo de Mercado Pago y cuenta del prestador | **Todo lo paga el cliente:** la comisión de OficiosYa y el costo de procesamiento de Mercado Pago se suman al precio en cada cobro, así que el prestador cobra exactamente lo que presupuestó y OficiosYa su comisión completa (`application_fee`). La comisión se configura **por tipo de cobro** (etapas, visita, ajustes y materiales; 10% por defecto en todos) junto con el **costo de MP estimado (6%)**. En los tickets de materiales, la diferencia se muestra como "cargos del servicio y del medio de pago". Al registrarse, el prestador **vincula su cuenta de Mercado Pago** (OAuth simulado), obligatoria para cobrar | `#/registro`, `#/perfil`, `#/admin` |
| N.25 | Reembolsos sin saldo del prestador (*actualizado en N.29*) | No hay fondo de garantía: si un reembolso falla porque el prestador no tiene saldo en Mercado Pago, queda **pendiente**, el prestador se **suspende** hasta que se ejecute y se **reintenta** ("Demo: reintentar"). En el arbitraje hay una casilla **"Demo: simular que el prestador no tiene saldo"**. Los pendientes se ven en el expediente, el perfil del prestador, el encabezado, el admin y el centro de arbitraje | `#/arbitraje/:id`, `#/admin`, `#/perfil` |
| N.26 | Sin PIN: aprobación de la etapa final y aprobación automática | Se eliminó el PIN OTP. La **última etapa se aprueba como las demás** y al aprobarla el trabajo queda cerrado. Si el cliente no aprueba ni observa una etapa terminada en el **plazo configurable (7 días)**, se **aprueba automáticamente** (si es la última, cierra el trabajo). Las dos partes ven la fecha de aprobación automática; queda suspendida en disputa y registrada en el historial. Hay un botón **"Demo: simular que venció el plazo"** | `#/trabajo/:id`, `#/admin` |
| N.27 | Mediación, corrección y garantía (disputas con split) | Toda disputa empieza con una **mediación entre las partes** (72 h): cada una puede **proponer un acuerdo** (corregir la etapa en N días, compensar en las etapas sin pagar, reembolso total + recobro, reembolso total o sin reembolso) y la otra lo acepta o lo rechaza. Sin acuerdo, el caso **pasa al árbitro** (también se puede pasar antes), que tiene **10 días hábiles**. Nueva resolución **"Corregir la etapa"**: si el prestador no la termina en el plazo, se reembolsa sola. **Reclamo por garantía** después del cierre (90 días). **Reclamos y contracargos en Mercado Pago** (demo para el admin). Marcas **"Revisar"** por abuso. Todo configurable en el panel admin | `#/trabajo/:id`, `#/arbitraje/:id`, `#/admin` |
| N.28 | Visitas con confirmación, reprogramación y "no vino" con descargo | El prestador **marca la visita como realizada** y el cliente la confirma; si no responde en **48 h**, se confirma sola. Cualquiera puede **proponer otra fecha**. Si el cliente informa que **el prestador no vino**, el prestador tiene 48 h para aceptarlo (reembolso) o **negarlo con un descargo**: se abre una **mediación** (reembolso, sin reembolso porque el cliente no estaba, o reprogramar) y, sin acuerdo, un **árbitro** la resuelve desde "Visitas técnicas en disputa". Si el prestador no tiene saldo, el reembolso queda pendiente. El prestador puede ofrecer **descontar la visita** del presupuesto | `#/solicitud/:id`, `#/arbitraje`, `#/admin` |
| N.29 | Arbitraje revisado para el split 1:1 (sin reembolsos parciales ni cobros posteriores) | **Solo reembolsos totales por pago** y **sin fondo de garantía**. Resoluciones: corregir la etapa, **compensar** en las etapas sin pagar (descuento sin mover dinero), **reembolso total + recobro** de lo hecho en la etapa siguiente, reembolso total o a favor del prestador. Sin etapas sin pagar, la decisión es binaria. **Todo se paga antes**: las compras de materiales antes de hacerlas y los aumentos de precio antes del trabajo extra; con todo pagado no hay rebajas. Reclamo por garantía con reembolso **total de la última etapa**. **Tamaño máximo por etapa: 40%** de la mano de obra (configurable) | `#/trabajo/:id`, `#/arbitraje/:id`, `#/solicitud/:id`, `#/admin` |
| N.17 | Matrícula para oficios regulados | Al registrarse, el prestador marca **uno o varios oficios**. Si incluye **Gas** o **Electricidad**, el **número de matrícula es obligatorio** y la **foto de la matrícula es opcional**. En los demás oficios, la credencial es opcional. El admin ve si la matrícula es obligatoria y la foto | `#/registro`, `#/admin` → Prestadores |

---

## RF01 — Identidad, perfiles y confianza

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| 1.1 | Registro con datos reales obligatorios: nombre, apellido, DNI/CUIT (valida 7-8 u 11 dígitos), teléfono de contacto, email, contraseña y repetición de la contraseña | `#/registro` |
| 1.2 | Aceptación obligatoria de términos y condiciones y política de privacidad | `#/registro` |
| 1.3 | Elección de rol al registrarse: Cliente o Prestador. El prestador marca uno o varios oficios. **Gas y Electricidad exigen número de matrícula**, con foto de la matrícula opcional. En el resto, la credencial es opcional | `#/registro` |
| 1.3b | El prestador **vincula su cuenta de Mercado Pago** para cobrar (obligatorio; la autorización OAuth está simulada). La cuenta debe tener la **identidad validada en nivel KYC 6**: el botón "Demo: probar con una cuenta sin identidad validada" muestra el rechazo. El perfil y el admin muestran la cuenta vinculada, el nivel KYC y los reembolsos pendientes, si los hay | `#/registro`, `#/perfil`, `#/admin` |
| 1.4 | Foto de rostro obligatoria: se sube o se toma desde el celular, con vista previa. Sin foto no se puede registrar | `#/registro` |
| 1.5 | Verificación de email con código de 6 dígitos (el email llega simulado como notificación en pantalla), con opciones de reenviar código y corregir datos | `#/registro` paso 2 |
| 1.6 | Se activa la cuenta después de verificar el email. El cliente queda **activo** y el prestador **pendiente de aprobación** | `#/registro` paso 3 |
| 1.6b | **Landing page** pública: explica el sistema y lleva al registro (como cliente o como prestador) o al login. Sin sesión, cualquier ruta privada muestra la landing | `#/inicio` |
| 1.7 | **Login** con email y contraseña. Rechaza credenciales incorrectas y cuentas suspendidas o rechazadas. Enter envía el formulario | `#/login` |
| 1.8 | **Recuperar contraseña**: código de 6 dígitos al email (simulado) y contraseña nueva | `#/login` → Olvidé mi contraseña |
| 1.9 | **Cerrar sesión** desde el perfil o el ícono del encabezado. Sin sesión solo se ven el login y el registro | `#/perfil` |
| 1.10 | El prestador pendiente puede ver los pliegos, pero no puede enviar presupuestos hasta que lo aprueben | `#/`, `#/solicitud/:id` |
| 1.11 | Perfil propio con identidad, contacto, insignias de verificación (email, DNI, foto) y estado | `#/perfil` |
| 1.12 | Prestador: **aclaraciones destacadas** (agregar y quitar) y **calificaciones recibidas** | `#/perfil` |
| 1.13 | **ABM de prestadores**: valida la credencial de oficio, la matrícula (con aviso si es obligatoria y foto ampliable) y la foto de rostro. Muestra si tiene la cuenta de Mercado Pago vinculada, sus reembolsos pendientes y las denuncias abiertas. Permite aprobar, rechazar, suspender o reactivar. Filtros: pendientes, activos, suspendidos y todos | `#/admin` → Prestadores |
| 1.14 | **ABM de solicitantes**: lista con contacto y solicitudes, suspender o reactivar, y moderación de reportes (marcar resuelto) | `#/admin` → Solicitantes |
| 1.14b | **Denuncias**: lista de denuncias abiertas y resueltas (acoso, agresiones, amenazas, ausencias a visitas, etc.) con denunciante, denunciado, solicitud, relato y evidencia. Acciones: marcar resuelta o suspender al denunciado | `#/admin` → Denuncias |
| 1.15 | **ABM de árbitros/soporte**: alta (nombre y email), baja o reactivación, y casos asignados a cada uno | `#/admin` → Árbitros |
| 1.16 | **ABM de administradores**: alta y permisos globales editables (métricas financieras, ABM de usuarios, arbitraje, gestión de permisos). Los permisos limitan lo que ve cada admin (por ejemplo, *Sofía Paz* no ve métricas) | `#/admin` → Administradores |
| 1.17 | Los usuarios suspendidos desaparecen del selector y no pueden operar ni iniciar sesión | Barra demo, `#/login` |

## RF02 — Publicación de solicitudes y evidencias

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| 2.1 | **Instructivo** desplegable para cargar una buena solicitud: título concreto, situación, medidas, accesos y fotos de detalle, con un ejemplo poco específico al lado de uno específico | `#/publicar` |
| 2.2 | Publicar una solicitud con título, categoría de oficio y ubicación manual (dirección opcional, barrio/zona y código postal). No usa GPS | `#/publicar` |
| 2.3 | Detalle de la situación con **mínimo de 500 caracteres** y contador en vivo. Puede incluir pasos, etapas o partes a hacer | `#/publicar` |
| 2.4 | Campo de **medidas y datos técnicos** (metros, alturas, diámetros, potencia, marcas) | `#/publicar` |
| 2.5 | Lista opcional de partes/tareas que identifica el cliente | `#/publicar` |
| 2.6 | Aviso según la categoría: herramientas a cargo del prestador o, en limpieza de interiores, posibles elementos a cargo del cliente | `#/publicar` |
| 2.7 | Fotos de la parte a reparar (varias, con vista previa y opción de quitar), con guía de qué subir y qué no. Si hay fotos, el cliente confirma que son de detalle. Hay un botón con fotos de ejemplo para la presentación | `#/publicar` |
| 2.8 | Validación del formulario con mensajes por campo | `#/publicar` |
| 2.9 | Explorador de solicitudes con buscador (oficio, tarea, zona, CP o nombre del prestador), filtro por estado y por categoría, orden por más recientes o mejor calificados, y tarjetas con fotos, partes, postulaciones, rango cotizado y visitas ofrecidas | `#/` |
| 2.9b | **"Atendida por"** en cada solicitud adjudicada: prestador (foto, nombre y oficio), **calificación en esta solicitud** (estrellas y comentario, o "en curso" / "aún no calificó"), **calificación general** (puntaje y cantidad de trabajos) y **promedio en el oficio** de la solicitud (ej. "En Plomería ★ 3 · 1 reseña") | `#/` |
| 2.9c | **Ranking de prestadores**: con "Todos", el mejor valorado de cada oficio. Al filtrar un oficio, el top 5 de ese oficio. Sirve para ver qué tipo de trabajo hace mejor cada prestador (ej. Roberto: Electricidad 5, Gas 5, Plomería 3) | `#/` (columna derecha) |
| 2.10 | Lista "Mis solicitudes" del cliente con estado, cantidad de presupuestos y visitas, y calificación pendiente | `#/mis-solicitudes` |
| 2.11 | Privacidad: los trabajos en curso o cerrados solo los ven el cliente, el prestador asignado y el equipo admin/arbitraje. El explorador aplica la visibilidad por rol (ver tabla siguiente) | `#/`, `#/trabajo/:id` |

### Visibilidad por rol

| Qué | Cliente | Prestador | Admin / Árbitro |
|---|---|---|---|
| Sus propias solicitudes o trabajos asignados | Completas | Completos | — |
| Solicitudes **abiertas** de otros clientes | No se muestran | **Completas** (pliego con fotos, para cotizar) | Completas |
| Trabajos **en curso, en disputa o rescindidos** de otros | No se muestran | No se muestran | Completos |
| Trabajos **terminados** de otros | **Resumen**: título, oficio, zona, prestador y calificaciones | **Resumen** | Completos |
| Detalle de una solicitud ajena (`#/solicitud/:id`) | Bloqueado | Solo si está abierta o la tiene asignada. Si cotizó y no lo eligieron, ve un aviso | Visible |
| Expediente del trabajo (`#/trabajo/:id`) | Solo el suyo | Solo los asignados | Visible |
| Nombre del cliente en las tarjetas | Completo en las suyas | Abreviado ("Martín S.") | Completo |
| Presupuestos de otros prestadores (montos) | Solo en sus solicitudes | Nunca | Visible |

## RF03 — Presupuestos del prestador

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| 3.1 | El prestador ve toda la información del cliente: detalle, medidas, partes y fotos (ampliables) | `#/solicitud/:id` (como prestador) |
| 3.2 | Dos modalidades: **Presupuesto directo** (sin visita) o **Cobrar visita primero**. Si una visita ofrecida y no pagada se reemplaza por un presupuesto directo, queda como "retirada" en el historial | idem |
| 3.3 | Presupuesto con **etapas definidas por el prestador**: nombre, detalle y monto de cada una. Agregar, quitar o usar las etapas sugeridas para el oficio. Subtotal de mano de obra en vivo. **Ninguna etapa puede superar el 40%** de la mano de obra (configurable) | idem |
| 3.4 | **Materiales**: "¿Comprás vos los materiales?" con detalle y monto estimado, y aviso de que se rinden con ticket | idem |
| 3.5 | **Herramientas**: las aporta el prestador. Solo en limpieza de interiores puede indicar que el cliente provea elementos | idem |
| 3.6 | **Aclaraciones destacadas**: las del perfil más una propia del presupuesto | idem |
| 3.7 | **Total a cobrar** del prestador, calculado en vivo: es exactamente lo que presupuesta. Recuadro "SOLO DEMO" con el precio final que verá el cliente | idem |
| 3.8 | **Visita técnica**: monto, qué incluye, días/horarios propuestos y la opción **"le descuento la visita"** si el cliente acepta el presupuesto. Al pagarse se acredita en la cuenta de Mercado Pago del prestador. El prestador la **marca como realizada**; el cliente la confirma o se confirma sola a las 48 h, y se habilita el presupuesto, que queda registrado como **"presupuesto tras visita"** | idem |
| 3.8b | **"El prestador no vino"**: el cliente lo informa y el prestador tiene 48 h para aceptarlo (reembolso y reporte) o **negarlo con un descargo** (mediación y, sin acuerdo, arbitraje). Sin respuesta, se reembolsa sola ("Demo: simular que el prestador no respondió en 48 h"). Las partes también pueden **reprogramar** la visita | idem |
| 3.9 | Enviar o actualizar la postulación mientras la solicitud siga abierta. Si había una visita no pagada, el presupuesto la reemplaza | idem |
| 3.10 | "Mis postulaciones" con tipo (presupuesto o visita) y estado: enviada, aceptada, no seleccionada, visita pagada o visita realizada | `#/mis-postulaciones` |
| 3.11 | El cliente compara las cotizaciones: prestador, foto, matrícula, calificación y cantidad de reseñas, insignias, aclaraciones resaltadas, etapas con montos, materiales, herramientas y nota | `#/solicitud/:id` (como cliente) |
| 3.12 | Tarjeta de visita para el cliente con el aviso "son dos pagos separados" (y si el prestador descuenta la visita), aceptar y pagar, confirmar la visita, proponer otra fecha o informar que el prestador no vino. En la cotización posterior se ve el **descuento por la visita** | idem |
| 3.13 | Cada presupuesto muestra su origen: **directo (sin visita previa)** o **tras visita realizada el …** | idem |
| 3.14 | **Historial de la solicitud**: publicación, visitas (ofrecida, pagada, realizada, cancelada, retirada), presupuestos (directo o tras visita), pago y accesos a los datos de contacto. El prestador solo ve sus eventos | Solicitud y trabajo |

## Contacto entre las partes y seguridad

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| C.1 | Después de pagar una **visita** o un **presupuesto**, cliente y prestador acceden a los datos de contacto de la otra parte para coordinar: teléfono, email y, del cliente, la dirección completa | Solicitud (visita), `#/trabajo/:id` |
| C.2 | Los datos están ocultos hasta aceptar las **advertencias**: usarlos solo para este trabajo, no pagar ni cobrar por fuera, aprobar las etapas solo después de revisarlas, coordinar en horarios razonables y qué hacer ante una agresión (911) | Modal "Antes de ver los datos de contacto" |
| C.3 | Ver el contacto **queda registrado en el historial** de la solicitud | Historial |
| C.4 | **Denunciar acoso o agresión**: tipo (acoso, insultos, agresión física, amenazas, discriminación, pago por fuera, otro), relato y **evidencia en fotos o capturas** | Tarjeta de contacto |
| C.5 | El denunciante puede pedir que **se oculten sus datos** al denunciado mientras se revisa | idem |
| C.6 | Administración revisa las denuncias con su evidencia y puede suspender al denunciado | `#/admin` → Denuncias |

## RF05 — Pago por etapa con split de Mercado Pago

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| 5.1 | "Aceptar y pagar la etapa 1" abre un checkout de Mercado Pago **simulado** que cobra solo la etapa 1 y muestra el resto de la mano de obra, los materiales estimados y el precio total estimado | Panel de la solicitud |
| 5.2 | Al pagar, el pago se acredita en la cuenta del prestador (split). La solicitud pasa a "En curso", las etapas del presupuesto pasan al seguimiento y el resto de los presupuestos queda no seleccionado | idem → `#/trabajo/:id` |
| 5.3 | **Pago de visita** independiente, también con split: el cliente paga la visita con la comisión incluida y se acredita al prestador. Si el prestador no vino, se reembolsa según el circuito de 3.8b; sin saldo del prestador, el reembolso queda pendiente | Panel de la solicitud |
| 5.4 | **Pago de cada etapa** antes de que empiece: botón "Pagar etapa N" para el cliente, y "Aprobar y pagar la etapa N+1" al aprobar la anterior. El prestador ve "Esperando que el cliente pague esta etapa" | `#/trabajo/:id` |
| 5.5 | **Pago de cada compra de materiales antes de hacerla**: el prestador pide el pago, el cliente paga el monto más la comisión de materiales y el costo de MP ("cargos del servicio y del medio de pago"), el prestador compra y sube el ticket. Más barato: crédito en la próxima etapa sin pagar; más caro: "Pedir pago complementario" | `#/trabajo/:id` |
| 5.6 | **Ajuste de precio**: se aplica a las etapas sin pagar. Con todo pagado, un aumento se paga antes del trabajo extra (la etapa final no se puede marcar terminada hasta el pago) y una rebaja no es posible | `#/trabajo/:id` |
| 5.7 | **Rechazo del trabajo**: sin etapa pagada en curso, se cancelan las etapas sin pagar; si rescinde el prestador con una etapa pagada en curso, se reembolsa esa etapa; si rescinde el cliente o hay una etapa terminada sin aprobar, pasa a arbitraje | `#/trabajo/:id` |
| 5.8 | Panel **"Pagos del trabajo"** con cada pago (concepto, ID, fecha, reembolsos). El cliente ve lo que pagó y lo que le falta pagar; el prestador, lo que cobró y lo que le falta cobrar; admin/arbitraje, el desglose de cada pago (prestador, costo MP y `application_fee`) | `#/trabajo/:id` |
| 5.9 | **Escenario 1, servicio exitoso**: el cliente aprueba las etapas (o se aprueban solas); al aprobarse la última, el trabajo se cierra sin movimiento de dinero | `#/trabajo/:id` |
| 5.10 | **Escenario 2, trabajo parcial**: **compensar** un monto en las etapas sin pagar (sin mover dinero) o **reembolso total + recobro** de lo hecho en la etapa siguiente. Deshabilitadas si no quedan etapas sin pagar | `#/arbitraje/:id` |
| 5.11 | **Escenario 3, trabajo mal hecho**: reembolso total del pago de la etapa en curso | `#/arbitraje/:id` |
| 5.12 | **Escenario 4, cliente malintencionado**: resolución a favor del prestador, sin reembolso | `#/arbitraje/:id` |
| 5.13 | **Prestador sin saldo**: casilla de demo en el arbitraje. El reembolso queda **pendiente**, el prestador se suspende hasta que se ejecute y se reintenta ("Demo: reintentar" en el expediente y en el centro de arbitraje). Sin fondo de garantía | `#/arbitraje/:id` |
| 5.13b | **Mediación**: al abrir una disputa, las partes tienen 72 h para acordar. Propuestas con tipo (corregir, compensar, reembolso total + recobro, reembolso total, sin reembolso), aceptar o rechazar, "Pasar el caso a un árbitro ahora" y "Demo: simular que venció la mediación" | `#/trabajo/:id` |
| 5.13c | **Corregir la etapa**: la etapa vuelve a ejecución con plazo. Si el prestador la marca como terminada a tiempo, se cumple; si no, se reembolsa sola ("Demo: simular que venció el plazo de corrección") | `#/trabajo/:id`, `#/arbitraje/:id` |
| 5.13d | **Reclamo por garantía** en trabajos cerrados (90 días): el cliente lo inicia con fotos; el prestador acepta corregir, ofrece un reembolso o lo rechaza; el cliente lo cierra como resuelto o sin resolver (impacta en la reputación) | `#/trabajo/:id` |
| 5.13e | **Reclamos en Mercado Pago**: el admin simula un reclamo o un contracargo y el fallo de Mercado Pago. Si falla a favor del cliente, se le descuenta al prestador; si contradice un dictamen de OficiosYa, queda marcado | `#/trabajo/:id` (admin/árbitro) |
| 5.14 | Cada dictamen muestra antes de ejecutarse la llamada simulada a la API (`POST /v1/payments/{id}/refunds`), y el error de saldo si corresponde | Modal de confirmación |
| 5.15b | **Disputas, garantías y etapas** en el panel admin: plazos de visitas, mediación, árbitro, corrección y reclamo por garantía, y el tamaño máximo por etapa | `#/admin` |
| 5.15 | **Configuración** en el panel admin (permiso de métricas): comisión por tipo de cobro (etapas, visita, ajustes, materiales), costo de Mercado Pago estimado, ejemplo de reparto y opción para mostrar u ocultar los recuadros "SOLO DEMO" | `#/admin` |
| 5.16 | Registro de movimientos: cada pago con su split (`POST /v1/payments` con `application_fee`), reembolsos totales, reembolsos rechazados por falta de saldo, reintentos y disputas | `#/admin` → Movimientos MP |
| 5.17 | Métricas financieras: cobrado con split, falta cobrar en etapas, acreditado a prestadores, comisiones, costo de MP, reembolsos, reembolsos pendientes, disputas y porcentaje de trabajos cerrados sin arbitraje | `#/admin` |

## RF04 — Ejecución, trazabilidad, aprobación de etapas y contra-evidencias

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| 4.1 | Trazabilidad de las **etapas definidas por el prestador**: aprobadas (con fecha y hora), la etapa en curso (por pagar, en ejecución o esperando aprobación) y las pendientes, con el monto de cada una y si ya está pagada | `#/trabajo/:id` |
| 4.2 | El prestador marca la etapa como terminada (solo si está pagada). El cliente la **aprueba** o la **observa**. Al aprobar la última, el trabajo queda cerrado | idem |
| 4.3 | El prestador sube fotos del trabajo terminado desde el celular (permite elegir cámara o galería) y las adjunta al expediente | idem |
| 4.4 | **Compras de materiales**: el prestador pide el pago de cada compra; el cliente la paga u observa; después el prestador sube el ticket (foto obligatoria) con el monto real. Resumen: estimado, pagado para comprar y rendido con ticket | idem |
| 4.5 | **Ajuste de precio después de la aceptación**: propuesta con nuevo total y motivo, aceptar o rechazar, y luego continuar con el precio original o rechazar el trabajo | idem |
| 4.6 | **Aprobación automática**: la etapa terminada se aprueba sola si el cliente no responde en el plazo configurado (7 días). Ambas partes ven la fecha; en disputa queda suspendida | idem |
| 4.7 | Tarjeta **"Aprobación de etapas y cierre"** con la etapa que espera aprobación, la fecha de aprobación automática y el botón "Demo: simular que venció el plazo" | idem |
| 4.8 | Al aprobarse la etapa final (manual o automáticamente), el trabajo queda completado y conforme. Las etapas aprobadas solas se marcan como "Aprobada automáticamente" | idem |
| 4.9 | **Abrir disputa** (cliente o prestador) con motivo, declaración y contra-evidencias fotográficas. Se suspenden el trabajo y la aprobación automática | idem |
| 4.10 | La contraparte presenta su descargo y sus contra-evidencias, y cualquiera de las dos puede agregar más mientras el caso siga abierto | idem |
| 4.11 | **Calificación post-pago**: 1 a 5 estrellas y comentario. Después, **comentarios posteriores** con fecha y fotos del cliente y respuestas del prestador | idem (trabajos completados o resueltos) |
| 4.12 | Lista de trabajos adjudicados con barra de progreso de etapas, precio del trabajo, aviso de etapa por pagar, calificación pendiente y ajuste pendiente | `#/trabajos` |

## Arbitraje (RF01 árbitros + RF05 disputas)

| # | Funcionalidad en la demo | Dónde |
|---|---|---|
| A.1 | Centro de arbitraje con los casos abiertos y resueltos | `#/arbitraje` |
| A.2 | El admin asigna un árbitro a cada caso. El árbitro ve sus casos y los que no tienen asignación, y puede "tomar caso" | idem |
| A.3 | Resumen del caso: pagos con split, monto en disputa (pago de la etapa en curso), reembolsos pendientes del prestador, motivo, quién lo abrió, etapas aprobadas (y cuántas se aprobaron automáticamente), presupuesto y ajuste de precio (si hubo) | idem |
| A.4 | Columna A (cliente): declaración, contra-evidencias y fotos iniciales. Columna B (prestador): descargo, contra-evidencias, evidencias post-trabajo y **tickets de materiales** | idem |
| A.5 | Comparación lado a lado: estado inicial contra trabajo entregado | idem |
| A.6 | Dictamen con fundamento y ejecución de las 4 resoluciones (corregir la etapa y 5.10 a 5.12), con la opción de demo "prestador sin saldo" (5.13). Solo puede resolver el árbitro asignado o un admin, y solo cuando el caso salió de la mediación. Muestra el plazo para resolver y avisa si venció | idem |
| A.6c | **Visitas técnicas en disputa**: reclamo del cliente, descargo del prestador y propuestas. El árbitro resuelve: reembolsar la visita (con la opción de demo "prestador sin saldo"), sin reembolso (cliente ausente) o reprogramar con una nueva fecha | `#/arbitraje` |
| A.6b | Casos en mediación: el árbitro ve el plazo y las propuestas, y puede pasarlos a arbitraje antes de tiempo. Marcas de **"Revisar"** para clientes con disputas perdidas y prestadores con fallos en contra | idem |
| A.7 | Las rescisiones con una etapa pagada en curso (o terminada sin aprobar) llegan como caso "Rescisión tras desacuerdo de precio" | idem |
| A.8 | El dictamen queda visible en el expediente para las dos partes | `#/trabajo/:id` |

## RNF (cómo se reflejan en la demo)

- **Responsive**: funciona en celular y en computadora. En celular aparece una barra de navegación inferior. Ver en el navegador con el modo dispositivo, o abrir desde el celular.
- **Privacidad**: las fotos y los datos de las solicitudes solo los ven su cliente, los prestadores que pueden cotizarla (mientras está abierta), el prestador asignado y administración/arbitraje. Los demás usuarios solo ven el resultado de los trabajos terminados (prestador y calificación), sin fotos ni datos del cliente. Las fotos de las solicitudes se limitan a la parte a reparar.
- **Seguridad** (Argon2/bcrypt, JWT, cookies HttpOnly): se menciona en el login y en el perfil. En la demo las contraseñas se guardan sin cifrar en el navegador porque no hay backend.

## Fuera del alcance de la demo

- No hay backend real, base de datos, Mercado Pago real, envío de emails ni almacenamiento en Object Storage. Todo se simula en el navegador.
- La vinculación de la cuenta de Mercado Pago (OAuth) y el split se simulan. El costo de Mercado Pago es un porcentaje estimado; en producción se toma de cada pago.
- El login es funcional dentro de la demo, pero sin cifrado ni sesión de servidor. La barra "Ver como" permite cambiar de usuario sin contraseña.
- No se agregaron funciones fuera del documento y de las actualizaciones (chat, notificaciones push, etc.).

---

## Guion sugerido para la presentación (≈30 min)

> Antes de empezar, tocar **"Reiniciar demo"** en la barra negra. Los pasos marcados como *(opcional)* se pueden saltear si falta tiempo. Los botones que empiezan con **"Demo:"** simulan algo que en la realidad tarda días o depende de Mercado Pago (vencimientos, falta de saldo, contracargos).

**Bloque 1 · Presentación y cuentas (≈5 min)**

0. **Landing**: al abrir la demo se ve la portada. Recorrer "Cómo funciona" (pagás por etapa y aprobás cada etapa), los beneficios para clientes y prestadores, **"Qué necesitás para operar"** (el cliente no necesita cuenta de Mercado Pago; el prestador sí, con identidad validada KYC 6) y las garantías → mostrar que "Registrarme como prestador" abre el registro con ese rol → volver con el logo.
1. **Login**: "Ingresar" → mostrar "Olvidé mi contraseña" → ingresar con el acceso rápido de *Martín Sommer*.
2. **Registro de prestador** *(opcional)*: "Crear cuenta" → "Soy prestador" → marcar *Pintura* (matrícula opcional) y después *Gas* (pide número de matrícula; foto opcional) → "Autocompletar datos de ejemplo" → "Demo: probar con una cuenta sin identidad validada" (se rechaza: falta KYC 6) → "Vincular cuenta de Mercado Pago" → crear cuenta → ingresar el código que llega por "email".

**Bloque 2 · Solicitud, visita y presupuesto (≈7 min)**

3. **Explorar** como *Martín Sommer*: ve sus solicitudes completas y los trabajos terminados de otros solo como resumen. Cambiar a *Carlos Méndez*: ve todas las solicitudes abiertas, pero no el trabajo en curso de Roberto. Volver a Martín: "Atendida por" en "Destapación de cañería de cocina" (Roberto: 3/5 en esta solicitud, 4.9 general, 3 en Plomería) → filtrar *Plomería* para ver el ranking.
4. **Publicar**: abrir el instructivo → escribir un detalle corto para mostrar el contador de 500 caracteres → "Autocompletar con un ejemplo" → guía de fotos y confirmación → publicar.
5. **Visita técnica**: como *Carlos Méndez*, abrir la solicitud nueva → "Cobrar visita primero" → marcar "le descuento la visita" → ofrecer. Como Martín → "Aceptar visita y pagar" → "Ver datos de contacto" (advertencias) → mostrar "Proponer otra fecha" y "Denunciar acoso o agresión". Como Carlos, "Marcar visita como realizada" → como Martín, ver la fecha de confirmación automática → "Confirmar que la visita se realizó" (o "Demo: simular que pasaron 48 h sin respuesta").
6. **Presupuesto tras visita**: como Carlos, armar etapas con montos (ninguna puede superar el 40% de la mano de obra: probar una más grande para ver el aviso), materiales comprados por él y una aclaración (ej. "No repongo azulejos"). El recuadro "SOLO DEMO" muestra el precio final que verá el cliente → enviar. Como Martín, ver la etiqueta "Presupuesto tras visita", el **descuento por la visita ya pagada** y el historial.
6b. **Prestador que no vino** *(opcional)*: como *Mariana Fernández*, en *SOL-8492* pagar la visita de Roberto → "El prestador no vino" → como Roberto, "Fui y no había nadie" con un descargo: se abre una mediación → "Demo: simular que venció la mediación" → como *Laura Benítez* (árbitro), en Arbitraje, sección "Visitas técnicas en disputa": resolver reembolso, sin reembolso o reprogramar. *Variante:* como Roberto, "Es cierto, no pude ir" → reembolso y reporte en Denuncias.
7. **Aceptar y pagar la etapa 1**: como Martín, comparar cotizaciones (aclaraciones resaltadas, reseñas, reclamos de garantía sin resolver si los hay). El precio ya incluye la comisión y el costo de Mercado Pago → "Aceptar y pagar la etapa 1": el checkout cobra **solo esa etapa** y muestra el resto como "se paga después".

**Bloque 3 · Pago por etapa y cierre (≈6 min)**

8. **Pagos y materiales**: en *SOL-7930* (tablero trifásico), mostrar "Pagos del trabajo" (con "SOLO DEMO": cuánto pagó el cliente, cuánto se quedó Mercado Pago, cuánto recibió el prestador y la comisión de OficiosYa) → como Martín, **observar** la etapa 3 → como Roberto, marcarla terminada otra vez: aparece la **fecha de aprobación automática** → como Martín, "Aprobar y pagar la etapa 4" → en Compras, pagar la compra C-2 **antes de que se haga** → como Roberto, subir el ticket (si sale más caro, "Pedir pago complementario"; si sale más barato, el crédito se descuenta de la etapa siguiente).
9. **Ajuste de precio** *(opcional)*: en el mismo trabajo, como Roberto, proponer cobrar más → como Martín, aceptarlo: se suma a la etapa que falta pagar. Con todo pagado, el aumento se paga antes del trabajo extra y una rebaja se rechaza (Mercado Pago no devuelve una parte de un pago). Mostrar también "Rechazar el trabajo".
10. **Cierre sin PIN**: como Roberto, "Marcar etapa final como terminada" → como Martín, ver la tarjeta "Aprobación de etapas y cierre" con la fecha de aprobación automática → "Demo: simular que venció el plazo": la etapa se aprueba sola y el trabajo queda cerrado (alternativa: "Aprobar etapa final y cerrar el trabajo").
11. **Calificación**: como Martín, calificar con estrellas y comentario → agregar un comentario posterior.

**Bloque 4 · Conflictos (≈8 min)**

12. **Mediación con acuerdo**: en el trabajo nuevo del paso 7, como Carlos, marcar la etapa 1 como terminada → como Martín, "Abrir mediación" (motivo y declaración): el trabajo se frena y empiezan las 72 h de mediación → como Carlos, "Proponer un acuerdo": mostrar las opciones (no hay reembolso parcial) → "Corregir la etapa" en 3 días, o "Compensar" un monto en las etapas sin pagar → como Martín, "Aceptar acuerdo".
13. **Sin acuerdo: árbitro y corrección incumplida** *(opcional)*: en el mismo trabajo, como Martín, "Abrir una nueva mediación" → "Demo: simular que venció la mediación": pasa al árbitro → como *Admin General*, en Arbitraje, "Ordenar corrección" (2 días) → como Martín, "Demo: simular que venció el plazo de corrección": se reembolsa sola la etapa en curso.
14. **Arbitraje con prestador sin saldo**: en *SOL-7104* (bomba), mostrar el caso en arbitraje: contra-evidencias, la propuesta de corrección que la clienta rechazó en la mediación, el plazo para resolver y que solo se discute el pago de la etapa 3 (las 1 y 2 ya están aprobadas). Como no quedan etapas sin pagar, **compensar** y **reembolso total + recobro** aparecen deshabilitados: la decisión es binaria → marcar "Demo: simular que el prestador no tiene saldo" → "Devolver el total de la etapa" → el reembolso queda **pendiente** y Marcelo **suspendido** → en el centro de arbitraje, "Demo: reintentar": se ejecuta el reembolso y Marcelo se reactiva.
15. **Reclamo por garantía**: en *SOL-7011* (pintura, "a un mes se brotó la pintura"), como Martín, "Iniciar reclamo por garantía" → como *Servicios Integrales BA*, "Acepto corregirlo" u "Ofrecer el reembolso total de la última etapa" → como Martín, aceptar o cerrar el reclamo. Si se cierra **sin resolver**, se ve en la reputación del prestador.
16. **Reclamo en Mercado Pago** *(opcional)*: como *Admin General*, en el expediente de un trabajo terminado (ej. *SOL-7502*), "Demo: contracargo del banco" → se envía el expediente como evidencia → "Demo: falla a favor del cliente": Mercado Pago le descuenta el monto al prestador, aunque OficiosYa no haya intervenido.

**Bloque 5 · Administración (≈4 min)**

17. **Panel admin**: como *Admin General*:
    - **Métricas**: cobrado con split, acreditado a prestadores, comisiones y costo de Mercado Pago, disputas en mediación y con plazo vencido y reembolsos pendientes por falta de saldo.
    - **Configuración**: comisión por tipo de cobro, costo de Mercado Pago, plazo de aprobación automática, y en "Disputas, garantías y etapas" los plazos de visitas, mediación, árbitro, corrección y garantía, y el tamaño máximo por etapa. Cambiar la comisión de etapas (ej. 15%) y mostrar que los presupuestos no aceptados cambian de precio, pero los trabajos ya contratados no.
    - **Prestadores**: aprobar a uno pendiente; ver "MP vinculada · KYC 6", reembolsos pendientes, suspensiones hasta reembolsar, fallos en contra y marcas "Revisar".
    - **Movimientos MP**: cada pago con su split (`application_fee`), reembolsos totales, reembolsos rechazados por falta de saldo, reintentos y contracargos.
    - **Permisos**: comparar con *Sofía Paz*, que no ve métricas ni configuración.
    - Destildar "Mostrar los recuadros SOLO DEMO" para ver la plataforma como la verían los usuarios reales.
18. **"Reiniciar demo"** para dejarla lista para la próxima vez.

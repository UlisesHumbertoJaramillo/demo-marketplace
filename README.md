# OficiosYa — Demo MVP

Demo navegable de **OficiosYa**, un marketplace de servicios de oficios (plomería, gas, electricidad, limpieza, etc.) que conecta **clientes** con **prestadores**, con **pago por etapa vía Mercado Pago**, validación de identidad y arbitraje.

> ⚠️ **Es una demo funcional sin servidor.** Todo corre en el navegador y los datos se guardan en `localStorage`. **Los pagos, emails y reembolsos son simulados** — no se mueve dinero real.

## 🚀 Cómo verla

**Opción 1 — Online (GitHub Pages):**
👉 https://uliseshumbertojaramillo.github.io/demo-marketplace/

**Opción 2 — Local:** abrí `index.html` con doble clic. No necesita servidor ni internet (fuentes, íconos, imágenes y CSS son locales).

## 🔑 Acceso

- Todas las cuentas de ejemplo usan la contraseña **`demo1234`**.
- La **barra negra superior** es exclusiva de la demo:
  - **Ver como** → cambia de usuario/rol sin contraseña (Cliente, Prestador, Administrador, Árbitro).
  - **+ Registrar usuario** → abre el registro.
  - **Reiniciar demo** → vuelve a los datos de ejemplo.

## 🧩 Roles

| Rol | Qué puede hacer |
|---|---|
| **Cliente** | Publica solicitudes, recibe presupuestos, paga por etapa, aprueba o observa el trabajo, califica. |
| **Prestador** | Cotiza en etapas, ofrece visita técnica, declara materiales con ticket, cobra en su cuenta de Mercado Pago. |
| **Administrador** | Configura comisiones, costo de MP, plazos y fondo de garantía; ve métricas, denuncias y contracargos. |
| **Árbitro** | Resuelve disputas de etapas y visitas tras la mediación. |

## 💳 Pagos — modelo de split de Mercado Pago (sin custodia)

El cobro usa el **modelo de marketplace / split de pagos** de Mercado Pago. No es un "paga primero y la plataforma retiene" (custodia): **cada pago va directo del cliente a la cuenta del prestador**, y OficiosYa se queda con su comisión dentro del mismo pago.

- **El prestador cobra exactamente lo que presupuesta.** La comisión de OficiosYa y el costo de procesamiento de Mercado Pago se **suman al precio del cliente**:

  ```
  precio al cliente = (presupuesto + comisión) / (1 − costo MP)
  application_fee   = precio al cliente − presupuesto − costo MP   (la comisión de OficiosYa)
  ```

- **Pago por etapa:** al aceptar el presupuesto se paga solo la **etapa 1**; cada etapa se paga **antes de empezarla**, al aprobar la anterior.
- **Acreditación inmediata:** cada cobro se crea a nombre del prestador (token OAuth de su cuenta MP) y se acredita en el momento. No hay custodia ni plazo de 90 días.
- **Reembolsos:** si falla por falta de saldo del prestador, OficiosYa reintegra al cliente con su **fondo de garantía** y lo registra como **deuda del prestador** (se recupera de sus próximos cobros).

> La comisión se cobra en todos los tipos de cobro (etapas, visita, ajustes, materiales), con tasa configurable por tipo (10% por defecto) y costo de MP estimado (6%) desde el panel admin. El cliente ve un único precio final sin desglose; el detalle solo aparece en recuadros **"SOLO DEMO"** y para admin/arbitraje.

## ✨ Funcionalidades destacadas

- Presupuestos **granulares por etapas** definidas por el prestador.
- **Visita técnica** cobrable aparte, con confirmación y reprogramación.
- **Materiales con ticket** (foto obligatoria), aprobados y pagados uno por uno.
- **Ajustes de precio** negociados entre las partes durante el trabajo.
- **Mediación (72 h) → arbitraje** para disputas, con resolución "corregir la etapa".
- **Reclamo por garantía** hasta 90 días después del cierre.
- **Validación de identidad (KYC)** y **matrícula obligatoria** para gas y electricidad.
- **Contacto seguro** con advertencias y sistema de denuncias.
- **Calificaciones** con comentarios posteriores y respuesta del prestador.

Ver [`FUNCIONALIDADES.md`](FUNCIONALIDADES.md) para el detalle completo por requerimiento.

## 🛠️ Stack

- HTML + CSS + JavaScript **vanilla** (sin framework, SPA con router por hash).
- **Tailwind CSS** (compilado a `assets/css/app.css`; fuente en `_build/`).
- Fuentes e íconos (Material Symbols) **locales**, sin CDN.
- Persistencia en **`localStorage`**.

## 📁 Estructura

```
demo/
├── index.html              # Punto de entrada (SPA)
├── assets/
│   ├── css/app.css         # Tailwind compilado
│   ├── js/
│   │   ├── core.js         # Lógica de pagos, comisiones, reembolsos
│   │   ├── data.js         # Datos de ejemplo
│   │   ├── app.js          # Router y render
│   │   └── views-*.js      # Vistas por rol/pantalla
│   ├── fonts/              # Fuentes e íconos locales
│   └── img/                # Imágenes de ejemplo
├── _build/                 # Config de Tailwind (solo para recompilar)
└── FUNCIONALIDADES.md      # Detalle funcional
```

---

*Demo MVP con fines de demostración. Marca, datos y pagos son ficticios.*

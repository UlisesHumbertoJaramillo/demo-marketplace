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
| **Prestador** | Cotiza en etapas (ninguna mayor al 40% del total), ofrece visita técnica, pide el pago de cada compra de materiales y después sube el ticket, cobra en su cuenta de Mercado Pago. |
| **Administrador** | Configura comisiones, costo de MP, plazos y tamaño máximo por etapa; ve métricas, reembolsos pendientes, denuncias y contracargos. |
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
- **Solo reembolsos totales por pago:** con el split no se devuelve una parte de un pago ni se le puede cobrar al cliente después. Por eso todo se paga **antes** (cada etapa, cada compra de materiales y cada aumento de precio).
- **Sin fondo de garantía:** si un reembolso falla por falta de saldo del prestador, queda **pendiente**, el prestador se suspende hasta que se ejecute y se reintenta.

> La comisión se cobra en todos los tipos de cobro (etapas, visita, ajustes, materiales), con tasa configurable por tipo (10% por defecto) y costo de MP estimado (6%) desde el panel admin. El cliente ve un único precio final sin desglose; el detalle solo aparece en recuadros **"SOLO DEMO"** y para admin/arbitraje.

## ✨ Funcionalidades destacadas

- Presupuestos **granulares por etapas** definidas por el prestador.
- **Visita técnica** cobrable aparte, con confirmación y reprogramación.
- **Materiales pagados antes de comprarlos**: el prestador pide el pago, el cliente paga y después se sube el ticket (crédito en la próxima etapa si sale más barato, pago complementario si sale más caro).
- **Ajustes de precio** negociados entre las partes durante el trabajo.
- **Mediación (72 h) → arbitraje** para disputas, sin reembolsos parciales: corregir la etapa, compensar en las etapas sin pagar, reembolso total + recobro de lo hecho, reembolso total o a favor del prestador.
- **Etapas acotadas:** ninguna etapa puede superar el 40% de la mano de obra (configurable).
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

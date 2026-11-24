// Configuración usada solo para compilar assets/css/app.css (no se necesita para ver la demo).
// Compilar:  npx tailwindcss@3.4.17 -c _build/tailwind.config.js -i _build/input.css -o assets/css/app.css --minify
//
// Estilo basado en el template "Apex" (apex-nextjs-template.vercel.app): fondo crema, verde muy oscuro como primario,
// acento verde, tipografía Nunito, detalles en Instrument Serif cursiva y etiquetas en Geist Mono, bordes muy redondeados,
// botones tipo píldora y sombras suaves. Los nombres de color se mantienen para no tocar las vistas.
module.exports = {
  content: ['./index.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        // Primario Apex (verde casi negro) para botones y navegación; "primary" se usa para textos e íconos de acento
        primary: '#0f7a2a',
        'primary-container': '#1a231b',
        'primary-fixed': '#e4eedb',
        // Acento verde (CTA secundarios y visitas)
        secondary: '#0f7a2a',
        'secondary-container': '#11a22f',
        'secondary-fixed': '#e4eedb',
        // Éxito
        tertiary: '#0f7a2a',
        'tertiary-container': '#11a22f',
        'tertiary-fixed': '#e4eedb',
        error: '#e40017',
        'error-container': '#ffe1e1',
        // Superficies cálidas
        surface: '#f2f1ea',
        'surface-container-lowest': '#fefdfc',
        'surface-container-low': '#f7f6f0',
        'surface-container': '#ecebe2',
        'surface-container-high': '#e4eedb',
        'surface-container-highest': '#dedfd5',
        'on-surface': '#19201a',
        'on-surface-variant': '#5c675c',
        'inverse-surface': '#1c291e',
        outline: '#8a948a',
        'outline-variant': '#dedfd5',
        // "Negro" de la demo = verde oscuro de las secciones dark de Apex
        slate: { 950: '#1c291e', 900: '#253327', 800: '#2e3e31' },
        // Los tonos azules de la demo pasan a la gama verde salvia de Apex
        blue: { 50: '#eef3e8', 100: '#e4eedb', 600: '#3f6e47', 700: '#2c4f33', 800: '#1f3a25' },
        ring: '#639564',
      },
      fontFamily: {
        head: ['Nunito', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      // Radios de Apex (base 1rem)
      borderRadius: { DEFAULT: '.6rem', sm: '.6rem', md: '.8rem', lg: '1rem', xl: '1.4rem', '2xl': '1.8rem', '3xl': '2.2rem', full: '9999px' },
      boxShadow: {
        hard: '0 18px 40px -18px rgba(26, 35, 27, .35)',
        'hard-sm': '0 6px 18px -8px rgba(26, 35, 27, .28)',
      },
    },
  },
  plugins: [],
};

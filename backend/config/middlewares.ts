module.exports = [
  "strapi::errors",
  {
    name: "strapi::cors",
    config: {
      origin: [
        "http://localhost:5173",       // Vite (Vue)
        "http://localhost:5174",       // Vite (Vue) port alternatif
        "http://10.68.251.163:5173",   // Vite (Vue) IP locale
        "http://10.68.251.163:5174",   // Vite (Vue) IP locale port alternatif
        "capacitor://localhost",        // iOS
        "http://localhost",             // Android
        "http://10.68.251.163",        // IP locale générale
      ],
      headers: "*",
      methods: ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"],
      credentials: true,
    },
  },
  "strapi::security",
  "strapi::poweredBy",
  "strapi::logger",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public",
];

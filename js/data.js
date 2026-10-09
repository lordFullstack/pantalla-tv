/* ============================================================
   DATOS DEL MENÚ — edita aquí precios, horarios, fotos y videos.
   Todo lo demás (diseño y animación) se genera a partir de esto.
   ============================================================ */
window.PT = {
  phone: "305 373 9928",

  /* Horarios en 24 h "HH:MM".
     dayFrom    → la pantalla se enciende (5:00 am, cuando abre el desayuno) y empieza a
                  avisar a los clientes lo que viene: jugos y asados
     juiceOpen  → abre la juguería (3:30 pm)
     kitchenOpen → entran asados, barril y canastas (6:00 pm)
     close      → cierre de todo (9:30 pm) */
  schedule: {
    dayFrom: "05:00",
    juiceOpen: "15:30",
    kitchenOpen: "18:00",
    close: "21:30"
  },

  /* Fotos y videos (carpeta assets/). Para cambiar una foto, reemplaza el archivo
     o cambia la ruta aquí. Videos: se reproducen en rotación, sin sonido. */
  img: {
    batidos: "assets/img/batidos.png",
    chorizo: "assets/img/chorizo-papas.png",
    michelada: "assets/img/michelada.jpg",
    laguna: "assets/img/laguna-azul.jpg",
    jugo1: "assets/img/jugo-rojo-1.jpg",
    jugo2: "assets/img/jugo-rojo-2.jpg",
    picada: "assets/img/picada-personal.png",
    canastas: "assets/img/canastas.jpg",
    acompanante: "assets/img/canastas.jpg",
    oreo: "assets/img/milo-oreo.jpg"
  },
  /* Logo de Pa'COMER (PNG con fondo transparente). Pa'TOMAR es la sección de
     juguería y se escribe junto al logo. Si el archivo no existe, usa letras. */
  logos: {
    comer: "assets/img/logo-comer.png",
    tomar: "assets/img/logo-tomar.png"   // opcional: si no existe, se escribe "Pa'TOMAR" en letras
  },
  videos: [
    { src: "assets/video/video-1.mp4" },
    { src: "assets/video/video-2.mp4" }
  ],
  videoMaxSeconds: 20,

  /* Video propio de cada sección de comida (opcional, vertical). Guarda el archivo con
     este nombre en assets/video/ y aparece solo; si no existe, se usa la foto. */
  sectionVideos: {
    asados: ["assets/video/asados.mp4", "assets/video/chorizo.mp4"],   // se alternan en cada vuelta
    barril: "assets/video/barril.mp4"
  },

  /* Qué se muestra en cada momento del día (en este orden, en bucle). */
  playlists: {
    promo:   ["abrimos", "club", "jugos", "premios", "cocina", "asados", "video", "cocteles", "barril"],
    tarde:   ["club", "jugos", "cocteles", "premios", "video", "cocina"],
    noche:   ["asados", "barril", "jugos", "cocteles", "club", "video", "premios"],
    cerrado: ["abrimos", "club", "premios", "video"]
  },

  /* Sabores: color del punto junto al nombre. */
  menu: {
    jugos: {
      title: "Jugos naturales",
      price: 8000,
      flavors: [
        ["Naranja", "#FF8A00"], ["Níspero", "#C98B3F"], ["Zapote", "#B5651D"], ["Mora", "#6B1F7A"],
        ["Maracuyá", "#F4C20D"], ["Fresa", "#E3262E"], ["Guanábana", "#E9E4C8"], ["Lulo", "#8DBF2E"]
      ]
    },
    limonadas: {
      title: "Limonadas",
      price: 8000,
      priceMax: 12000,
      flavors: [
        ["Natural", "#B8D93A"], ["Cerezada", "#B3122B"], ["Fresa", "#E3262E"], ["Coco", "#F2EEDD"], ["Corozo", "#5A1B3A"]
      ]
    },
    patillazo: {
      title: "Patillazo",
      price: 12000,
      desc: "Bebida refrescante de patilla, zumo de limón y leche condensada"
    },
    micheladas: {
      title: "Micheladas",
      price: 12000,
      flavors: ["Frutos rojos", "Maracumango", "Frutos verdes", "Tradicional"]
    },
    cocteles: {
      title: "Cócteles",
      price: 15000,
      items: [
        { name: "Cuba libre", desc: "Delicioso cóctel" },
        { name: "Mojito cubano", desc: "Con notas de hierbabuena y ron blanco" },
        { name: "Laguna azul", desc: "" }
      ]
    },
    asados: {
      title: "Asados",
      items: [
        { name: "Pechuga a la brasa", price: 20000, desc: "250 g · papas o patacón · ensalada verde" },
        { name: "Pechuga gratinada", price: 24000, desc: "250 g gratinada · papas o patacón · ensalada" },
        { name: "Carne a la parrilla", price: 20000, desc: "250 g · papas o patacón · ensalada verde" },
        { name: "Chorizo picado", price: 6000, desc: "Con patacón o bollo y ensalada" },
        { name: "Canastas de chicharrón x3", price: 15000, desc: "Patacón con chicharrón y pico de gallo" }
      ]
    },
    barril: {
      title: "El Barril",
      items: ["Costilla", "Chicharrón", "Costilla BBQ"],
      note: "Acompañadas con patacón o papas a la francesa y ensalada verde"
    }
  },

  club: {
    goal: 10,
    prizes: [
      { name: "Jugo gratis", img: "jugo1" },
      { name: "Picada personal", img: "picada" },
      { name: "El acompañante del jugo", img: "acompanante" }
    ]
  }
};

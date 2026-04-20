export interface CVSection {
  id: string;
  title: string;
  label: string;
  type: 'about' | 'experience' | 'skills' | 'projects';
  position: [number, number, number];
  content: any;
}

export const CV_DATA_ES: CVSection[] = [
  {
    id: 'about',
    title: 'DAVID ALVARADO',
    label: 'CONÓCEME',
    type: 'about',
    position: [0, 2, 0],
    content: {
      avatar: "assets/images/DavidAboutMe.jpg",
      role: "Full-Stack Developer (Front-end Focused)",
      location: "Ecuador",
      bio: [
        "Combino precisión técnica con creatividad artística. Cuento con más de 5 años de experiencia en desarrollo de software, me especializo en diseñar e implementar arquitecturas escalables utilizando tecnologías y frameworks modernos de FrontEnd y BackEnd, seleccionando cuidadosamente la mejor arquitectura en base a los requisitos específicos de cada proyecto.",
        "Más allá de la pantalla, me gusta cantar y crear contenido. En mi canal de YouTube, traduzco e interpreto canciones, aplicando la misma dedicación a mi producción musical que a la calidad del software.",
        "Valoro la autonomía y la confianza. Soy un líder responsable que fomenta la buena comunicación y un ambiente positivo, considero que el software de calidad es construido por equipos felices y auto-gestionados."
      ],
      socials: {
        youtube: "https://www.youtube.com/@D4veCovers",
        linkedin: "https://linkedin.com/in/david-alvarado-dev/",
        email: "frealvaradoc@gmail.com"
      },
      softSkills: ["Orientado al Detalle", "Buena Comunicación", "Autónomo", "Colaborativo"]
    }
  },
  {
    id: 'experience',
    title: 'EXPERIENCIA PROFESIONAL',
    label: 'EXPERIENCIA',
    type: 'experience',
    position: [-4, 0, 2], // Left
    content: [
      {
        company: "GoData Banco Internacional",
        role: "Líder Técnico",
        period: "2024 - 2025",
        desc: "Dirigí la digitalización de operaciones bancarias.",
        highlights: [
          "Lideré un equipo de 4 desarrolladores usando metodologías Agile/Scrum.",
          "Diseñé la arquitectura y desarrollé un sistema de gestión completo de manejo de pólizas bancarias.",
          "Desarrollo colaborativo en migración de Java Spring Boot desde arquitectura MCV a Hexagonal, con autenticación JWT, automatizaciones CRON, JPA Y APIs Rest.",
          "Desplegué componentes habilitantes (FE + BE) en JBoss (JAR, WAR y EAR), asegurando operación estable y segura del sistema."
        ]
      },
      {
        company: "StickerStoke S.A.S",
        role: "Líder Técnico Front-End",
        period: "2021 - 2025",
        desc: "Lideré la visión tecnológica para una plataforma de personalización de vehículos en tiempo real.",
        highlights: [
          "Colaboré en la arquitectura, diseño y desarrollo de un editor vectorial con visualización 3D, contribuyendo al desarrollo de un algoritmo patentable usando Babylon.js y Angular.",
          "Desarrollé e implementé herramientas internas que mejoraron la organización del trabajo, redujeron tiempos de desarrollo y aumentaron la productividad del equipo.",
          "Gestioné pipelines AWS/Docker para eficiencia CI/CD.",
          "Implementé un ecosistema de e-commerce completo: marketplace, carrito de compras, pagos, facturación y panel administrativo."
        ]
      },
      {
        company: "Full Stack Freelancer",
        role: "Desarrollador Full Stack",
        period: "2019 - 2020",
        desc: "Desarrollé y desplegué soluciones web personalizadas y transformaciones digitales.",
        highlights: [
          "Diseñé sitios web optimizados para SEO aumentando la visibilidad del cliente.",
          "Construí plugins de WordPress personalizados para flujos de trabajo automatizados.",
          "Desarrollé aplicaciones full-stack para gestión de inventario y facturación usando Angular/Node."
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'MIS PROYECTOS DESTACADOS',
    label: 'PROYECTOS',
    type: 'projects',
    position: [0, -3, 3], // Bottom
    content: [
      {
        name: "3DCAL",
        category: "Desarrollo de Producto Principal",
        description: "Desarrollé las funcionalidades principales del producto, incluyendo un ecosistema completo de e-commerce, sitio de administración y un configurador y editor de vehículos 3D en tiempo real.",
        image: "assets/images/projects/3dcalHero.jpg",
        stack: ["Angular", "Babylon.js", "Nest.js", "Docker", "AWS", "D3.js","Electron.js", "Astro"],
        link: "https://3dcal.com/"
      },
      {
        name: "SoundContent360",
        category: "DESARROLLO DE PRODUCTO PRINCIPAL",
        description: "Portfolio end-to-end para el ingeniero de sonido David Juarez. Incluye una experiencia de audio binaural basado en objetos (Binaural UI propio, control por objeto, EQ, js-ambisonics con HRTFs personalizados), SEO completo y formulario de contacto protegido con Turnstile y envío vía Cloudflare Worker + Resend.",
        image: "assets/images/projects/soundContentHero.jpg",
        stack: ["React", "TypeScript", "Vite", "Web Audio", "Cloudflare Worker", "Turnstile", "Resend"],
        link: "https://soundcontent360.com/"
      },
      {
        name: "ROTTU Systems",
        category: "Sitio Corporativo",
        description: "Desarrollé un sitio orientado a conversión para una software house que presenta servicios de software a medida, aplicaciones móviles, desarrollo web, UX/UI y nube para empresas que buscan optimizar procesos y acelerar su crecimiento digital.",
        image: "assets/images/projects/rottu.jpg",
        stack: ["React", "Vite", "React Router", "Tailwind CSS"],
        link: "https://www.rottusystems.com/"
      },
      {
        name: "ChatPage",
        category: "Producto Propio",
        description: "Creé y lancé mi propio servicio: una página profesional simple para WhatsApp, Instagram y TikTok, pensada para que negocios y creadores en LATAM conviertan visitas en conversaciones, leads y ventas.",
        image: "assets/images/projects/chatpage.jpg",
        stack: ["Angular", "Tailwind CSS", "RxJS","Hono","Cloudflare","Cloudflare workers"],
        link: "https://chatpage.me/"
      },
      {
        name: "AMPDC",
        category: "Trabajo Voluntario",
        description: "Fui voluntario de la ONU para mantenimiento del sitio, actualización de secciones/paletas de colores, e integración de pagos. Implementación de analytics (Clarify, GA, FB Pixel) y publicación de artículos.",
        image: "assets/images/projects/AMPDCHero.jpg",
        stack: ["WordPress", "Analytics", "Plugins"],
        link: "https://psicologiaydesarrollocomunitario.com/"
      },
      {
        name: "PBYA",
        category: "Soluciones Web",
        description: "Resolví problemas críticos de migración de hosting, diagnostiqué y reparé errores de código con refactoring profundo, y desarrollé un nuevo módulo personalizado para el sector industrial.",
        image: "assets/images/projects/PBYAHero.jpg",
        stack: ["Headless WP", "Gatsby", "React"],
        link: "https://pbya.com/"
      },
    ]
  },
  {
    id: 'skills',
    title: 'HABILIDADES TECNOLÓGICAS',
    label: 'HABILIDADES',
    type: 'skills',
    position: [4, 0, 2], // Right
    content: {
      core: [
        { name: "Angular & TS", level: 98 },
        { name: "Babylon.js", level: 96 },
        { name: "Nest.js", level: 90 },
        { name: "Three.js", level: 93 },
        { name: "Vue.js", level: 80 },
        { name: "React", level: 70 },
        { name: "Astro", level: 85 }
      ],
      languages: [
        "Java", "C#", "Python", "Javascript", "HTML/CSS", "TypeScript", "PHP"
      ],
      frameworks: [
        "Angular", "Vue 3", "Astro", "Electron.js", "Microservicios", "API REST", "Node.js", "Nest.js", "Express.js"
      ],
      data: [
        "PostgreSQL", "MongoDB", "MySQL", "SQLite"
      ],
      tooling: [
        "Puppeteer", "Jira", "Github", "Slack", "Postman", "Figma", "Mongo Express"
      ],
      devops: [
        "Docker", "AWS", "Azure", "Git Flow", "GitHub Actions"
      ]
    }
  }
];

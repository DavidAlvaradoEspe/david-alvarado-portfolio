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
      avatar: "assets/images/david_tp.jpg",
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
        stack: ["Angular", "Babylon.js", "NestJS", "Docker", "AWS", "D3.js","Electron.js", "Astro"],
        link: "https://3dcal.com/"
      },
      {
        name: "Plugins WP Personalizados",
        category: "Herramientas de Desarrollo",
        description: "Desarrollé un plugin para Calculador Costos de Envío en tiempo real para couriers ecuatorianos, integrado en la tienda de Woocommerce.",
        stack: ["PHP", "WordPress API", "REST", "WOOCOMMERCE"]
      },
      {
        name: "AMPDC",
        category: "Trabajo Voluntario",
        description: "Fui voluntario de la ONU para mantenimiento del sitio, actualización de secciones/paletas de colores, e integración de pagos. Implementación de analytics (Clarify, GA, FB Pixel) y publicación de artículos.",
        stack: ["WordPress", "Analytics", "Plugins"],
        link: "https://psicologiaydesarrollocomunitario.com/"
      },
      {
        name: "PBYA",
        category: "Soluciones Web",
        description: "Resolví problemas críticos de migración de hosting, diagnostiqué y reparé errores de código con refactoring profundo, y desarrollé un nuevo módulo personalizado para el sector industrial.",
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
        { name: "NestJs", level: 90 },
        { name: "Three.js", level: 93 },
        { name: "Vue.js", level: 80 },
        { name: "React", level: 70 },
        { name: "Astro", level: 85 }
      ],
      languages: [
        "Java", "C#", "Python", "Javascript", "HTML/CSS", "TypeScript", "PHP"
      ],
      frameworks: [
        "Angular", "Vue 3", "Astro", "Electron.js", "Microservicios", "API REST", "NodeJs", "NestJS", "Express.js"
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

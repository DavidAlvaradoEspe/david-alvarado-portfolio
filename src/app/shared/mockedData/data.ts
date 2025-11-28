export interface CVSection {
  id: string;
  title: string;
  label: string;
  type: 'about' | 'experience' | 'skills' | 'projects';
  position: [number, number, number];
  content: any;
}

export const CV_DATA: CVSection[] = [
  {
    id: 'about',
    title: 'DAVID ALVARADO',
    label: 'KNOW ME',
    type: 'about',
    position: [0, 2, 0],
    content: {
      avatar: "assets/images/david_tp.jpg",
      role: "SWE Front-End Tech Lead",
      location: "Ecuador",
      bio: [
        "I blend technical precision with artistic creativity. With over 5 years of software development experience, I specialize in designing and implementing scalable architectures using modern FrontEnd and BackEnd technologies and frameworks, carefully selecting the best architecture based on each project's specific requirements.",
        "Beyond the screen, I enjoy singing and creating content. On my YouTube channel, I translate and perform songs, applying the same dedication to my musical production as I do to software quality.",
        "I value autonomy and trust. I'm a responsible leader who fosters good communication and a positive environment, believing that quality software is built by happy, self-managed teams."
      ],
      socials: {
        youtube: "https://www.youtube.com/@D4veCovers",
        linkedin: "https://linkedin.com/in/david-alvarado-dev/",
        email: "frealvaradoc@gmail.com"
      },
      softSkills: ["Detail Oriented", "Good Communication", "Autonomous", "Team Player"]
    }
  },
  {
    id: 'experience',
    title: 'CAREER LOG',
    label: 'CAREER',
    type: 'experience',
    position: [-4, 0, 2], // Left
    content: [
      {
        company: "StickerStoke S.A.S",
        role: "Front-End Tech Lead",
        period: "2021 - 2025",
        desc: "Led the technological vision for a real-time vehicle customization platform.",
        highlights: [
          "Collaborated in the architecture, design and development of a vector editor with 3D visualization, contributing to the development of a patentable algorithm using Babylon.js & Angular.",
          "Developed and implemented internal tools that improved work organization, reduced development times and increased team productivity.",
          "Managed AWS/Docker pipelines for CI/CD efficiency.",
          "Implemented a complete e-commerce ecosystem: marketplace, shopping cart, payments, billing and administrative panel."
        ]
      },
      {
        company: "GoData Ecuador",
        role: "Tech Lead",
        period: "2020 - 2021",
        desc: "Directed banking operations digitalization.",
        highlights: [
          "Led a squad of 4 developers using Agile/Scrum methodologies.",
          "Designed the architecture and developed a complete management system for banking policy handling.",
          "Supervised JBoss deployments and backend integration coordination with Java-Spring Boot, ensuring stable and secure system operation."
        ]
      },
      {
        company: "Full Stack Freelancer",
        role: "Full Stack Developer",
        period: "2019 - 2020",
        desc: "Developed and deployed custom web solutions and digital transformations.",
        highlights: [
          "Designed SEO-optimized websites increasing client visibility.",
          "Built custom WordPress plugins for automated workflows.",
          "Developed full-stack apps for inventory management and billing using Angular/Node."
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'MY FEATURED PROJECTS',
    label: 'PROJECTS',
    type: 'projects',
    position: [0, -3, 3], // Bottom
    content: [
      {
        name: "3DCAL",
        category: "Core Product Development",
        description: "Developed the main product functionalities, including a complete e-commerce ecosystem, administration site and a real-time 3D vehicle configurator and editor.",
        stack: ["Angular", "Babylon.js", "NestJS", "Docker", "AWS", "D3.js", "Electron.js", "Astro"],
        link: "https://3dcal.com/"
      },
      {
        name: "Custom WP Plugins",
        category: "Development Tools",
        description: "Developed a real-time Shipping Cost Calculator plugin for Ecuadorian couriers, integrated with WooCommerce store.",
        stack: ["PHP", "WordPress API", "REST", "WooCommerce"]
      },
      {
        name: "AMPDC",
        category: "Volunteer Work",
        description: "Volunteered for UN to maintain the site, updated sections/color palettes, and integrated payments. Implemented analytics (Clarify, GA, FB Pixel) and published articles.",
        stack: ["WordPress", "Analytics", "Plugins"],
        link: "https://psicologiaydesarrollocomunitario.com/"
      },
      {
        name: "PBYA",
        category: "Web Solutions",
        description: "Solved critical hosting migration issues, diagnosed and repaired code errors with deep refactoring, and developed a new custom module for the industrial sector.",
        stack: ["Headless WP", "Gatsby", "React"],
        link: "https://pbya.com/"
      },
    ]
  },
  {
    id: 'skills',
    title: 'TECH SKILLS',
    label: 'SKILLS',
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
        "Angular", "Vue 3", "Astro", "Electron.js", "Microservices", "REST API", "NodeJs", "NestJS", "Express.js"
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

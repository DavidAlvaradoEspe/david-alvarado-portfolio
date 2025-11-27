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
        "I blend technical precision with artistic creativity. With over 5 years of experience, I specialize in designing and implementing high-performance architectures using modern FrontEnd and BackEnd technologies and frameworks, carefully selecting the architecture to match each project's specific requirements. My attention to detail ensures that every pixel and every line of code serves a purpose.",
        "Beyond the screen, I am a passionate singer and content creator. On my YouTube channel, I translate and perform songs, applying the same dedication to musical nuances as I do to software quality.",
        "I value autonomy and trust. I'm a responsible leader who fosters good communication and a positive environment, believing that great software is built by happy, self-managed teams."
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
        desc: "Led the technological vision for a real-time visual customization platform.",
        highlights: [
          "Architected a patent-pending 3D vector editor using Babylon.js & Angular.",
          "Optimized rendering performance, reducing load times by 40%.",
          "Managed AWS/Docker pipelines for CI/CD efficiency.",
          "Mentored the frontend team, establishing SOLID principles."
        ]
      },
      {
        company: "GoData Ecuador",
        role: "Tech Lead",
        period: "2020 - 2021",
        desc: "Directed banking operations digitalization.",
        highlights: [
          "Led a squad of 4 developers using Agile/Scrum methodologies.",
          "Modernized legacy banking interfaces improving UX for internal staff.",
          "Orchestrated Java Spring Boot backend integration."
        ]
      },
      {
        company: "Freelance Developer",
        role: "Full Stack Developer",
        period: "2019 - 2020",
        desc: "Delivered custom web solutions and digital transformations.",
        highlights: [
          "Designed SEO-optimized websites increasing client visibility.",
          "Built custom WordPress plugins for automated workflows.",
          "Developed full-stack apps for warehouse management using Angular/Node."
        ]
      }
    ]
  },
  {
    id: 'projects',
    title: 'INNOVATION HUB',
    label: 'PROJECTS',
    type: 'projects',
    position: [0, -3, 3], // Bottom
    content: [
      {
        name: "3DCAL",
        category: "Core Product",
        description: "A complex e-commerce ecosystem featuring a real-time 3D vehicle configurator. Migrated from WordPress to a custom Angular/NestJS architecture.",
        stack: ["Angular", "Babylon.js", "NestJS"],
        link: "https://3dcal.com/"
      },
      {
        name: "Custom WP Plugins",
        category: "Development Tools",
        description: "Built a real-time Shipping Cost Calculator for Ecuadorian couriers and an Auto-Image Optimizer API integration to preserve quality while reducing file size.",
        stack: ["PHP", "WordPress API", "REST"]
      },
      {
        name: "AMPDC",
        category: "Volunteer Work",
        description: "Maintained the site, updated sections/color palettes, and integrated payments. Implemented analytics (Clarify, GA, FB Pixel), published articles, and collaborated on a custom appointment scheduling plugin.",
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
    title: 'TECH ARSENAL',
    label: 'SKILLS',
    type: 'skills',
    position: [4, 0, 2], // Right
    content: {
      core: [
        { name: "Angular & TS", level: 98 },
        { name: "Babylon.js / Three.js 3D", level: 90 },
        { name: "Vue.js", level: 80 },
        { name: "React / Astro", level: 85 }
      ],
      backend: [
        "Node.js", "NestJS", "PostgreSQL", "PHP / WordPress", "Electron.js"
      ],
      devops: [
        "Docker", "AWS (ECS/S3)", "Azure", "Git Flow", "CI/CD"
      ]
    }
  }
];

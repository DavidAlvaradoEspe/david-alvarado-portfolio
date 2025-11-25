export interface CVSection {
  id: string;
  title: string;
  type: 'about' | 'experience' | 'skills' | 'education';
  position: [number, number, number]; // X, Y, Z coordinates in 3D space
  content: any;
}

export const CV_DATA: CVSection[] = [
  {
    id: 'about',
    title: 'ABOUT ME',
    type: 'about',
    position: [0, 2, 0], // Center Top
    content: {
      summary: "I have over 5 years of experience developing web applications using Angular, TypeScript, Astro, and multiple frameworks. I specialize in solving complex problems, optimizing high-performance front-end architectures, and applying SOLID principles.",
      role: "Front-End Tech Lead",
      location: "Quito, Ecuador",
      contact: "frealvaradoc@gmail.com"
    }
  },
  {
    id: 'experience',
    title: 'EXPERIENCE',
    type: 'experience',
    position: [-4, 0, 2], // Left side
    content: [
      {
        company: "StickerStoke S.A.S",
        role: "Front-End Tech Lead",
        period: "11/2021 - 07/2025",
        achievements: [
          "Designed a real-time visual customization platform with 3D visualization.",
          "Implemented e-commerce ecosystem (marketplace, payments, admin).",
          "Managed Docker/AWS environments for reliable deployments."
        ]
      },
      {
        company: "GoData Ecuador",
        role: "Tech Lead",
        period: "01/2020 - 10/2021",
        achievements: [
          "Led a team of 4 developers using Agile methodologies.",
          "Modernized legacy interface components for banking systems."
        ]
      }
    ]
  },
  {
    id: 'skills',
    title: 'SKILLS',
    type: 'skills',
    position: [4, 0, 2], // Right side
    content: {
      frontend: ["Angular", "TypeScript", "React", "HTML5/CSS3", "Astro"],
      backend: ["Node.js", "NestJS", "PHP", "REST APIs"],
      graphics: ["Babylon.js", "WebGL", "D3.js"],
      cloud: ["Docker", "AWS (ECS, S3)", "PostgreSQL"]
    }
  },
  {
    id: 'education',
    title: 'ACADEMIC',
    type: 'education',
    position: [0, -3, 3], // Bottom
    content: {
      degree: "B.Sc. in Computer Science",
      school: "Universidad de las Fuerzas Armadas E.S.P.E",
      period: "2014-2021",
      publications: [
        "ICEIT 2021: Active Learning of Programming",
        "WORLDS4 2023: Problem-Based Learning for Computational Thinking"
      ]
    }
  }
];

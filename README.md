# 🚀 David Alvarado - Interactive Portfolio

Welcome to my personal portfolio! This isn't just another static CV – it's an **immersive 3D experience** inspired by the treasure-hunting adventure from Disney's *Treasure Planet*. Every line of code here reflects my passion for creating engaging, performant web applications.

> *"If you want something done right, you do it yourself."* – This portfolio is my playground for experimenting with cutting-edge web technologies while showcasing my work in a memorable way.

## 🎮 The Experience

This portfolio is designed as an interactive journey:

1. **Language Selection** - Choose your preferred language (English/Spanish)
2. **Map Puzzle Mini-Game** - Solve a swipe-based puzzle to unlock the portfolio
3. **Holographic Room** - Explore my CV in a 3D holographic interface floating in space

### 🗺️ Mini-Game Instructions

The treasure map puzzle is the gateway to my portfolio:

- **Swipe RIGHT** on the map to unlock it
- The map provides visual feedback with color-coded pulses:
  - 🟢 **Green pulse** = Correct swipe
  - 🔴 **Red pulse** = Wrong direction (resets progress)
- Haptic feedback (vibration) enhances the experience on mobile devices
- Once unlocked, you'll transition to the main holographic interface

**Pro Tip:** The map rotates as you progress through the sequence!

## 🛠️ Tech Stack

This portfolio leverages modern web technologies to deliver a seamless 3D experience:

### Core Framework
- **Angular 21** - Latest version with signals and standalone components
- **TypeScript 5.9** - Type-safe development
- **RxJS 7.8** - Reactive programming patterns

### 3D Graphics Engine
- **Babylon.js 8.38** - WebGL-based 3D rendering engine
  - `@babylonjs/core` - Core rendering engine
  - `@babylonjs/loaders` - GLTF model loading
  - `@babylonjs/materials` - Advanced material systems (Grid, PBR)

### Internationalization
- **ngx-translate** - Multi-language support (EN/ES)

### Build & Deployment
- **Angular CLI 21** - Build optimization and bundling
- **angular-cli-ghpages** - GitHub Pages deployment
- **Vitest 4** - Fast unit testing

## 🏗️ Architecture

The project follows a **modular, scalable architecture** inspired by enterprise-level applications:

```
src/app/
├── @core/                  # Core business logic (singleton services)
│   ├── services/          # Babylon scene, Nebula, Shield systems
│   ├── store/             # State management (Puzzle store)
│   ├── guards/            # Route protection
│   ├── utils/             # Utility functions
│   └── interceptors/      # HTTP interceptors
├── pages/                 # Feature modules (Map Puzzle, Holographic Room)
├── shared/                # Shared components and data
│   ├── components/        # Splash screen, etc.
│   └── mockedData/        # CV data providers
├── i18n/                  # Internationalization module
└── translations/          # Language files (en-US.json, es-ES.json)
```

### Key Architectural Patterns

- **Standalone Components** - Modern Angular architecture without NgModules
- **Signal-based State** - Leveraging Angular's reactive primitives
- **Service-oriented Design** - Separation of concerns with specialized services
- **Route Reusability Strategy** - Custom routing for optimal performance
- **Lazy Loading** - On-demand resource loading

## ✨ Special Features

### 🌌 Procedural Nebula Generation

The nebula background is **procedurally generated** using a particle system with two layers:

- **Stars Layer**: 2,000 particles simulating distant stars
  - Random sizes (0.2 - 0.8 units)
  - Green-tinted color palette
  - Infinite lifetime with smart texture reuse
  
- **Nebula Layer**: 200 volumetric particles creating depth
  - Large, semi-transparent particles (40 - 80 units)
  - Low opacity for atmospheric effect
  - Strategic emission box placement

**Optimization Techniques:**
- Single shared DynamicTexture for all particles (memory efficient)
- 3-hour particle lifetime (10,800s) to avoid recreation overhead
- Configurable particle counts for performance scaling

### 🛡️ Dynamic Shield System

The holographic shield surrounding the CV cards is **procedurally generated** with:

- **Geometric Glyphs**: Random circular patterns with rings and connectors
- **Instanced Rendering**: Base meshes reused via instancing (ENABLE_INSTANCING)
- **Adaptive Detail**: Mobile vs Desktop tessellation levels
  - Mobile: 4-segment tubes, 4-segment spheres
  - Desktop: 8-segment tubes, 8-segment spheres
- **Continuous Rotation**: Smooth Y-axis rotation at 0.001 rad/frame

**Performance Features:**
- Mesh instance pooling to reduce draw calls
- Device detection for adaptive quality
- Configurable glyph counts (20 mobile / 50 desktop)

### 🎯 Performance Optimizations

1. **Angular Zone Management**
   - Babylon rendering runs outside Angular's change detection
   - Manual zone entry only for UI updates

2. **Asset Management**
   - AssetContainer pattern for efficient GLTF loading
   - Proper disposal of resources on component destroy
   - Texture reuse across particle systems

3. **Rendering Pipeline**
   - Selective glow layers with custom intensity
   - Rendering group IDs for proper layering
   - Post-process effects only when needed

4. **Code Splitting**
   - Lazy imports of Babylon.js modules
   - Tree-shaking friendly imports

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 10.9+

### Installation

```bash
# Clone the repository
git clone https://github.com/DavidAlvaradoEspe/david-alvarado-portfolio.git

# Navigate to project directory
cd david-alvarado-portfolio

# Install dependencies
npm install
```

### Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload when you modify source files.

### Production Build

```bash
npm run build
# or
ng build
```

Build artifacts will be stored in the `dist/` directory, optimized for production deployment.

### Testing

```bash
npm test
# or
ng test
```

Runs unit tests using Vitest.

## 📱 Device Optimization

The portfolio automatically adapts to your device:

- **Desktop**: Full visual fidelity with maximum particle counts and detail
- **Mobile**: Optimized rendering with reduced tessellation and particle counts
- **Touch Devices**: Haptic feedback during puzzle interactions
- **Responsive UI**: Adaptive layouts and font sizes

## 🎨 Modular System Design

### BabylonSceneService
Centralized 3D scene management that handles:
- Scene initialization with configurable parameters
- Camera setup (ArcRotateCamera) with custom controls
- Environment texture loading
- Model loading via AssetContainer pattern
- Resource lifecycle management

### NebulaBackgroundService
Standalone service for creating atmospheric space environments:
- Configurable fog density and color
- Dual-layer particle system (stars + nebula clouds)
- Memory-efficient texture sharing
- Easy integration into any Babylon scene

### ShieldSystemService  
Procedural generation system for sci-fi UI elements:
- Device-aware quality settings
- Reusable mesh instances for performance
- Configurable parameters (color, size, complexity)
- Self-contained animation system

### PuzzleStore
Signal-based state management for the map puzzle:
- Tracks puzzle unlock status
- Persists state across navigation
- Loading state management
- Type-safe state access

## 🌐 Internationalization

The portfolio supports multiple languages through a custom i18n system:

- **Supported Languages**: English (en-US), Spanish (es-ES)
- **Translation Files**: JSON-based language files in `src/app/translations/`
- **Language Selector**: Dedicated component for language switching
- **Service Layer**: `I18nService` for centralized translation management

## 📂 Project Structure Highlights

```
public/assets/
├── models/              # GLTF 3D models
│   ├── inner_sphere.glb      # Map puzzle inner sphere
│   ├── treasure_map.glb      # Treasure map 3D model
│   ├── nebula_dome.glb       # Nebula environment
│   └── solar_system.glb      # (unused, future feature)
├── textures/            # Material textures
│   └── environmentSpecular.env  # HDR environment map
└── images/              # Static images
    └── david_tp.jpg     # Profile photo
```

## 🚀 Deployment

This project is configured for easy deployment to GitHub Pages:

```bash
# Build and deploy to GitHub Pages
ng build --configuration production --base-href "/david-alvarado-portfolio/"
npx angular-cli-ghpages --dir=dist/t-p-portfolio/browser
```

## 💡 Design Philosophy

This portfolio embodies several principles I believe in:

1. **Performance First** - Every optimization matters for user experience
2. **Modular Architecture** - Code should be reusable and maintainable  
3. **Progressive Enhancement** - Works on all devices, enhanced on capable ones
4. **Attention to Detail** - Small touches like haptics and animations matter
5. **Clean Code** - TypeScript types, clear naming, and documentation

## 🎯 Future Enhancements

Ideas I'm exploring for future iterations:

- [ ] Solar system exploration mode
- [ ] Interactive project showcases in 3D space
- [ ] WebGL shader-based effects
- [ ] Voice navigation support
- [ ] AR/VR viewing modes
- [ ] Advanced particle effects system

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### About Using This Code

While this code is open source under MIT License, I kindly ask that you:

- ✅ **Learn from it** - Study the architecture, techniques, and patterns
- ✅ **Get inspired** - Use concepts and ideas in your own projects
- ✅ **Give credit** - If you use significant portions, please attribute the source
- ✅ **Make it yours** - Create your own unique portfolio experience

**Please don't:**
- ❌ Clone this portfolio and present it as your own work
- ❌ Use it as-is for professional purposes without significant modifications
- ❌ Remove copyright notices or authorship information

> **Note for Recruiters & Employers**: This is 100% my original work. Every line of code, design decision, and optimization was implemented by me from scratch. The procedural generation systems (nebula, shield), the puzzle mechanism, and the 3D interactive experience are all custom-built.

Remember: Your portfolio should showcase **your** skills and creativity, not mine. Use this as a learning resource to build something even better! 🚀

## 🤝 Connect With Me

If you made it this far, you're exactly the kind of person I'd love to connect with!

- **Portfolio**: [david-alvarado.com](https://david-alvarado.com)
- **LinkedIn**: [linkedin.com/in/david-alvarado-dev](https://www.linkedin.com/in/david-alvarado-dev/)
- **GitHub**: [github.com/DavidAlvaradoEspe](https://github.com/DavidAlvaradoEspe)
- **Email**: [frealvaradoc@gmail.com](mailto:frealvaradoc@gmail.com)

---

**Built with ❤️ and lots of ☕ by David Alvarado**

*"The best way to predict the future is to create it."*

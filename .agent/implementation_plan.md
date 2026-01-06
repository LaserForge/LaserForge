# LaserForge Implementation Plan

This plan outlines the roadmap for building **LaserForge**, a web-based, offline-capable laser control and design software alternative to LightBurn. The immediate focus is creating a professional landing page deployed to `LaserForge.io` via GitHub Pages, followed by the iterative development of the core application.

## User Review Required

> [!IMPORTANT] > **Domain Configuration**: To finalize the deployment to `LaserForge.io`, you will need to configure the DNS records (A Records and CNAME) at your domain registrar to point to GitHub Pages. This plan handles the code side (CNAME file), but the registrar configuration is manual.

> [!NOTE] > **Tech Stack Selection**:
>
> - **Frontend**: React (Vite) + TypeScript for type safety and performance.
> - **UI Framework**: TailwindCSS for styling the Landing Page and App UI.
> - **Graphics Engine**: Pixi.js (WebGL) for high-performance 2D vector rendering (handling 20k+ paths).
> - **State Management**: Zustand (lightweight, flexible).
> - **Hardware**: Web Serial API (GRBL) & WebUSB (Galvo - future).

## Proposed Changes

### Phase 1: Foundation & Landing Page (Immediate Priority)

**Goal**: Establish the project structure and deploy a high-quality landing page to secure the domain. We will structure this as a **Single Page Application (SPA)** where the Landing Page is the default route (`/`), allowing us to add the App later at `/app` without replacing the site.

#### [NEW] [Project Structure]

- Initialize React + Vite + TypeScript.
- **Routing**: Install `react-router-dom`. Define routes:
  - `/`: `<LandingPage />`
  - `/app`: `<AppLayout />` (Future)
- Configure `TailwindCSS` for shared styling.

#### [NEW] [Landing Page Components]

- `src/pages/LandingPage.tsx`: Main marketing page.
- `src/layouts/MarketingLayout.tsx`: Header/Footer wrapper.
- `src/components/Hero.tsx`: "LaserForge: Open Source Laser Control".
- `src/components/Features.tsx`: Highlight Web-based, Offline, GRBL/Ruida support.

#### [NEW] [Deployment Configuration]

- `public/CNAME`: File containing `LaserForge.io`.
- `.github/workflows/deploy.yml`: GitHub Action to build and deploy the SPA to `gh-pages`.

### Phase 2: Core Architecture & PWA Enablement

**Goal**: Build the application "Shell" at the `/app` route and enable offline capabilities.

#### [NEW] [App Routing & Layout]

- `src/pages/AppPage.tsx`: The main entry point for the laser software.
- `src/layouts/AppLayout.tsx`: The "Desktop-like" UI shell (Sidebar, Toolbar, Canvas).
- Isolate "App" styles from "Marketing" styles if necessary.

#### [NEW] [PWA Configuration]

- `vite-plugin-pwa`: Configure for offline caching.
- **Strategy**: Cache both the Landing Page and the App Shell.
- `public/manifest.json`: "LaserForge", `start_url: "/app"`.
- Service Workers: Ensure offline functionality for the Editor.

#### [NEW] [Graphics Engine Setup]

- Integrate **Pixi.js** within the `/app` route components.
- Create a basic "Canvas" component that handles Zoom/Pan (affine transformations).
- Implement a coordinate system mapping (World Space <-> Screen Space).

### Phase 3: Hardware Communication (GRBL)

**Goal**: Connect to a physical laser (Longer Ray5 reference) via Web Serial.

#### [NEW] [Serial Connection Manager]

- `src/lib/drivers/grbl/SerialConnection.ts`: Wrapper around `navigator.serial`.
- **Handshake**: implement `\r\n\r\n` wake up.
- **Buffer Management**: Implement "Character Counting" protocol to prevent buffer overflow.

#### [NEW] [Machine Control UI]

- Jog Controls (X/Y/Z arrows).
- Console Log (visible G-Code stream).
- Device Settings Modal (Baud rate, S-Value Max).

### Phase 4: Vector Design & Manipulation

**Goal**: Enable creating and editing designs.

#### [NEW] [Vector Engine]

- **WASM Integration**: Compile `Clipper2` (or use `js-clipper`) for Boolean operations (Union, Intersect, Difference).
- **Tools**: Select, Pen (Bezier), Rectangle, Ellipse.
- **Selection Logic**: Implement Quadtree/R-Tree for efficient hit-testing.

### Phase 5: Image Processing & G-Code Generation

**Goal**: Turn designs into laser instructions.

#### [NEW] [Image Pipeline]

- Web Worker for image processing (off-main-thread).
- Implement Dithering algorithms (Floyd-Steinberg, Jarvis).
- **G-Code Generator**: Convert vectors and images to `.gcode` (G0/G1/M4 commands).

### Phase 6: Refinement & Data Persistence

**Goal**: Professional polish and saving work.

#### [NEW] [Storage & Library]

- **IndexedDB**: Store "Material Library" (Cut settings for Wood, Acrylic, etc.).
- **File System Access API**: Implement `Save Project` and `Open Project` (native file picker).

## Verification Plan

### Automated

- **Build Checks**: Ensure `npm run build` passes for the PWA.
- **Linting**: No ESLint errors.

### Manual Implementation Verification

- **Landing Page**: Verify `LaserForge.io` loads the specific design.
- **Offline Test**: Disconnect internet, refresh page (Service Worker should serve app).
- **Serial Loopback**: (If hardware unavailable) Use a virtual serial port or mock object to verify G-Code streaming logic.

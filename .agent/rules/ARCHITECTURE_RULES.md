# LaserForge Architectural Rules & Guidelines

## 1. Architectural Boundaries

To maintain a clean separation between the Marketing site and the Application logic:

- **Strict Separation**: Components in `src/pages/LandingPage` MUST NOT import from `src/pages/AppPage` or `src/lib/drivers`.
- **Shared UI**: reusable UI components (Buttons, Inputs) should live in `src/components/ui` and be perfectly generic.
- **Routing**: Use `react-router-dom`.
  - `/` -> `MarketingLayout`.
  - `/app` -> `AppLayout` (The "Editor" Shell).

## 2. Hardware Abstraction Layer (HAL)

- **No Direct Hardware Access**: UI components must NEVER call `navigator.serial` directly.
- **Driver Pattern**: All machine communication must go through the `MachineDriver` interface.
  - `connect()`
  - `disconnect()`
  - `stream(gcode: string[])`
  - `jog(x, y, z)`
- **Safety**: All driver implementations must implement a `softLimit` check before sending G-code coordinates.

## 3. State Management (Zustand)

- **Store Segmentation**: Split stores by domain.
  - `useMachineStore`: connection status, position, alarms.
  - `useDesignStore`: vectors, layers, selection.
  - `usePreferencesStore`: theme, units, grid settings.
- **No Prop Drilling**: Use stores for state shared across more than 2 levels of depth.

## 4. Graphics Engine (Pixi.js)

- **Coordinate Systems**:
  - **World Space**: Millimeters (Physical machine coordinates).
  - **Screen Space**: Pixels (Viewport coordinates).
- **Transforms**: Always use the `ViewportService` to convert between World/Screen space before rendering or hit-testing.
- **Performance**: Use `ParticleContainer` or high-performance equivalents for rendering >1000 vectors.

## 5. File System

- **Native Persistence**: Prefer the File System Access API (`showSaveFilePicker`) over automatic downloads.
- **Format**: Project files (`.lfg`) should be JSON containing:
  - Version info.
  - Metadata (Material, Date).
  - Layers (Array of objects).
  - Design Data (Vectors/Images).

## 6. Testing

- **Hardware Mocking**: All tests involving hardware must support a `MockDriver` to run in CI environments.

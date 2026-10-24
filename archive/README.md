# eMilap Code Archive

This folder stores unused, experimental, and legacy components moved out of `src/` to keep the production codebase clean, fast, and lightweight.

---

## Catalog of Archived Code

### 1. Canvas & 3D Shaders (`archive/canvas/`)
* **`Topography.jsx` & `Topography.css`**:
  * Interactive 3D cursor-reactive topographic contour map rendered with Three.js / WebGL.
  * *Useful features*: Custom terrain vertex elevation shaders, elevation contour line rendering, and smooth mouse inertia damping.
* **`GridScan.jsx` & `GridScan.css`**:
  * 3D perspective grid scanning line shader with radar/beacon pulse effects.
  * *Useful features*: Raycasting grid intersections, mobile orientation tracking, and WebGL context restoration handling.

### 2. UI & Interaction Components (`archive/components/`)
* **`ScrollExpand.jsx` & `ScrollExpand.css`**:
  * Expanding media hero card component.
  * *Useful features*: Smoothstep interpolation, clip-path inset expansion (`inset(y% x% ... round r px)`), zoom animation on scroll, and support for both container and window scroll modes.
* **`OrbitImages.jsx` & `OrbitImages.css`**:
  * 3D elliptical revolving carousel.
  * *Useful features*: Elliptical orbital projection (`radiusX`, `radiusY`, `rotation`), z-index depth sorting, drag-to-spin interaction, and SVG orbital ring guide lines.
* **`SpatialTransition.jsx` & `SpatialTransition.css`**:
  * Shared-element FLIP transition that zooms a clicked card to fill the viewport before revealing the section page.
  * *Useful features*: Dynamic bounding rect calculation and coordinate translation in GSAP.
* **`SectionOrbit.jsx` & `SectionOrbit.css`**:
  * Section selector screen that configured `OrbitImages` with SVG badge generators for each lost-and-found section.
* **`DashboardView.jsx`**:
  * Earlier static card dashboard layout before the editorial pinned horizontal carousel in `HomePage.jsx` was introduced.

### 3. Hooks (`archive/hooks/`)
* **`useFlowerGrowth.js`**:
  * GSAP ScrollTrigger hook that scales, tilts, and adjusts brightness/saturation of a hero flower artwork as the page scrolls.
* **`useLenis.js`**:
  * Reusable React hook for binding Lenis smooth scrolling to a container ref with reduced-motion support.

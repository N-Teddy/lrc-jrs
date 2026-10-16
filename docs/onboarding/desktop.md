# Desktop Application Onboarding Guide

> **Package:** `@jrs/desktop` (`apps/desktop/`)  
> **Stack:** Tauri v2 + React 19 + TypeScript + Tailwind CSS + Biome

---

## 1. Architecture & Feature Organization

The desktop application uses **Tauri v2** with a Webview frontend running on WebKitGTK (Linux) or WebView2 (Windows).

```
apps/desktop/
├── src/
│   ├── components/      # Universal UI components (CustomSelect, DatePicker, Avatar, etc.)
│   ├── features/        # Feature-driven slices
│   │   ├── access/      # Account access, password resets & jurisdiction
│   │   ├── activities/  # Activities calendar, detail page & attendance roster
│   │   ├── auth/        # Login, password reset & authentication screens
│   │   ├── dashboard/   # Sidebar, layout shell & workspace metrics
│   │   ├── drive/       # Drive file explorer & PDF canvas previewer
│   │   ├── members/     # Official member directory, passport & attendance
│   │   ├── towns/       # Hub switcher modal & Cameroon map
│   │   └── transfers/   # Town transfer ledger & relocation modals
│   │
│   ├── App.tsx          # Root React component & routing
│   ├── main.tsx         # React bootstrap & query client initialization
│   └── index.css        # Tailwind CSS and sanctuary design tokens
│
├── src-tauri/           # Rust Tauri v2 core
│   ├── Cargo.toml       # Rust crate dependencies
│   ├── src/main.rs      # Tauri application entry point
│   └── tauri.conf.json  # Window configuration, security capabilities & plugins
```

---

## 2. The 4-Layer Feature Pattern

Every feature directory strictly separates logic from UI:

1. **`types/`**: Strict TypeScript interfaces and enums for all component props.
2. **`utils/`**: 100% pure functions (formatting, date calculations, validation).
3. **`hooks/`**: Headless React hooks containing all state, queries, and mutation logic.
4. **`components/`**: Pure presentational "dumb" components without data-fetching side effects.

---

## 3. Native PDF & Document Previewer

Because Linux WebKitGTK does not include an embedded Chromium PDF reader, the desktop app uses a custom high-performance canvas renderer powered by `pdfjs-dist`:

- Located at: `apps/desktop/src/features/activities/components/PdfViewer.tsx`.
- Dynamically loads and renders PDF pages onto an HTML5 `<canvas>` element with zoom and page controls.
- For external viewing, the Tauri Opener plugin (`@tauri-apps/plugin-opener`) opens Google Drive links in the user's default browser.

---

## 4. Running the Desktop App

### Linux Graphics Compatibility Flags
On Linux with Wayland or proprietary NVIDIA drivers, hardware acceleration issues can occur. The dev script is pre-configured with the required environment flags:

```bash
# Launch the desktop app in development mode
pnpm desktop
```

Which executes:
```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 WEBKIT_DISABLE_SANDBOX_THIS_IS_DANGEROUS=1 pnpm --filter @jrs/desktop tauri dev
```

---

## 5. Verification Commands

```bash
# Check formatting & linting
pnpm biome check apps/desktop

# TypeScript compile check
pnpm --filter @jrs/desktop check-types
```

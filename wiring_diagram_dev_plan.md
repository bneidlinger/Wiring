# Interactive Wiring‑Diagram Builder – Development Plan

## 1 — Project Charter

| Goal | Build a self‑contained, browser‑based tool that lets technicians lay out oversized “cabinet” diagrams, drop boards/readers/supplies, drag‑route color‑coded wires, label everything, then export to SVG/PNG/HTML. |
| Scope limits | Pure front‑end SPA (no server), schematic‑level accuracy (not millimeter‑perfect mechanical CAD). |
| Success metric | Techs create a 12‑board mock‑up with 80 connections in < 15 min, export to PNG, and a coworker can understand it without extra notes. |

## 2 — Tech‑Stack Decisions

| Concern | Choice | Alternatives / notes |
| --- | --- | --- |
| Canvas | Plain SVG in the DOM | Keeps code inspectable; every element is addressable. Konva.js or Fabric.js if later needed. |
| Pan + Zoom | `svg-pan-zoom` (1 kB gz) | D3 `zoom` if you already pull D3. |
| Drag + Drop | `interact.js` | Native PointerEvents + manual math if desired. |
| Wire routing | Orthogonal (Manhattan) paths with simple A* around obstacles. | jsPlumb / Rappid for pre‑baked connectors. |
| State storage | Single JSON → `localStorage` | IndexedDB for very large jobs. |
| Export to PNG | `canvg` to render SVG onto canvas | `html2canvas` but misses defs/markers. |
| UI framework | Vanilla + lit‑html or React | Bootstrap only for modals if speed > purity. |

## 3 — Domain Model
```yaml
Project
 └─ CanvasSettings {width, height, backgroundImage}
 └─ Elements[]
      ├─ Board (type: 'GCM' | 'ACM' | 'PSU', id, x, y, rotation, config:{})
      ├─ Reader (id, x, y, facing)
      ├─ TerminalBlock (parentId, id, x, y, size)
 └─ Wires[]
      └─ {id, from:{elementId,pin}, to:{elementId,pin}, color, gauge, label}
```

## 4 — Feature Breakdown

| # | User Story | Key Tasks |
| --- | --- | --- |
| F‑1 | Zoomable sandbox: pan/zoom over brushed‑steel background and see cabinet limits. | Load 10 000 × 6 000 SVG; apply `svg-pan-zoom`; draw boundary with drop‑shadow. |
| F‑2 | Palette + placement: drag boards/readers/PSUs onto canvas. | Build sidebar; clone template; grid snap. |
| F‑3 | Dynamic terminal blocks: right‑click board → add terminal. | Inject sub‑group; increment pin index. |
| F‑4 | Wire tool: choose gauge & color, drag from pin A to pin B. | Live rubber‑band; finalize & push to `Wires[]`. |
| F‑5 | Auto‑routing around obstacles (Phase 2). | Maintain bounding boxes; Manhattan dog‑leg unless collision. |
| F‑6 | Label editor: double‑click element/wire → modal. | Type‑specific form; float `<text>` above target. |
| F‑7 | Persist & load | JSON download; reload & rehydrate. |
| F‑8 | Export | PNG & standalone HTML via `canvg`. |

## 5 — Implementation Phases

1. **Boot‑strap (Week 0)** – Repo, ESLint/Prettier, Vite; skeleton HTML; stainless background.  
2. **Core canvas (Week 1)** – SVG viewport + pan/zoom; draw cabinet boundary at low zoom.  
3. **Palette & placement (Week 2)** – Drag/drop; grid snap; selection handles.  
4. **Wire MVP (Week 3)** – Basic wires; color/gauge chooser.  
5. **Metadata UI (Week 4)** – Modal editor; floating labels.  
6. **Persistence & export (Week 5)** – JSON save/load; PNG/HTML export.  
7. **Polish & QA (Week 6)** – Collision‑free routing v1; shortcuts; browser testing.  
8. **Stretch Goals (Post‑MVP)** – Netlist CSV export; wire bundles; dark mode.

## 6 — File/Module Skeleton
```
/public
  index.html
/src
  main.js
  svgCanvas.js
  elementFactory.js
  wireTool.js
  stateStore.js
  ui/
    palette.js
    modalEditor.js
/assets
  textures/steel.jpg
  icons/*.svg
```

## 7 — Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Large jobs lag | Virtual rendering; unmount hidden nodes. |
| Impossible wiring loops | Validate on save; highlight illegal nets. |
| Printing fidelity | 300 DPI PDF export via `svg2pdf.js`. |

## 8 — Kick‑off Checklist

- [ ] Confirm stakeholder sign‑off on scope & cabinet size  
- [ ] Source brushed‑steel texture (license‑free)  
- [ ] Gather board/reader pin‑maps (CSV)  
- [ ] Decide color palette for common gauges  
- [ ] Create three sample projects for QA scripts  

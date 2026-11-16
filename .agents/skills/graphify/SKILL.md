---
name: graphify
description: "Turns any codebase, documentation folder, SQL schemas, or configurations into an interactive, queryable knowledge graph with community clustering, architecture reports, and visual maps (graph.html, GRAPH_REPORT.md, graph.json). Use when exploring complex architecture, tracing dependencies, or mapping project structure."
risk: low
source: community
date_added: "2026-11-13"
tags:
  - domain/architecture
  - artifact/skill
  - tool/knowledge-graph
---

# Graphify Agent Skill

Transform codebases and documentation into persistent, queryable knowledge graphs with deterministic AST parsing and community detection.

> **Core Philosophy:** Graph-first context. Instead of grepping through dozens of raw files or reading endless lines sequentially, query the structural architectural map.

---

## 1. Capabilities & Output Artifacts

When run, Graphify scans the target folder and outputs structured artifacts to the `graphify-out/` directory:

| Artifact | Purpose |
|---|---|
| `graphify-out/graph.html` | Force-directed interactive visual graph you can open and explore in your browser. |
| `graphify-out/GRAPH_REPORT.md` | Human- and AI-readable architectural overview detailing community clusters, high-connectivity "god nodes", and structural relationships. |
| `graphify-out/graph.json` | NetworkX-compatible serialized node-link graph data for direct semantic and programmatic queries. |

---

## 2. CLI Prerequisites

Graphify requires the `graphifyy` CLI package (published as `graphifyy` on PyPI to prevent namespace collision):

### Installation via uv (Recommended)
```bash
uv tool install graphifyy
```

### Installation via pip
```bash
pip install graphifyy
```

---

## 3. Workflow Steps for Agents

### Step 1: Environment & Tool Verification
Verify that `graphify` is accessible in the terminal:
```bash
graphify --version
```
If not installed, prompt the user or install via `uv tool install graphifyy`.

### Step 2: Deterministic AST Parsing
Graphify uses Tree-sitter under the hood to parse classes, functions, interfaces, imports, and calls deterministically across TypeScript, JavaScript, Python, Go, Rust, and ~40 other languages without sending code to an external LLM.

### Step 3: Graph Construction & Community Detection
Clusters code into functional communities using Leiden/Louvain algorithms, identifies architectural bottlenecks and circular dependencies, and links related documentation.

### Step 4: Common Commands

#### Build the Full Knowledge Graph:
```bash
graphify .
```

#### Incremental Update (Modified files only):
```bash
graphify . --update
```

#### Query the Knowledge Graph:
```bash
graphify query "How does authentication link to the database schema?"
```

#### Trace Relationship Paths:
```bash
graphify path <source-entity> <target-entity>
```

#### Deep Semantic Mode:
```bash
graphify . --mode deep
```

---

## 4. Best Practices
* Add large binaries, generated build outputs (`dist/`, `build/`, `node_modules/`), and temp files to `.graphifyignore` or standard `.gitignore`.
* Open `graphify-out/graph.html` directly in the browser to visually inspect dependencies between monorepo apps and packages.


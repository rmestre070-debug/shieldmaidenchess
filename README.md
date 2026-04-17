# shieldmaidenchess
Shield Maiden Chess — Web Implementation

Shield Maiden Chess is a modern 10×8 chess variant featuring the Shield Maiden, a new defensive infantry piece with unique movement and Shield Wall mechanics.  
This repository contains a complete, modular JavaScript engine and a classical wood‑themed web interface with custom SVG pieces.

Features
- 10×8 board with full variant geometry  
- Complete rules engine: movement, legality, attack maps, Shield Wall, king safety  
- Drag‑and‑drop play in any modern browser  
- Classical mahogany/ebony board theme  
- Custom SVG piece set (white/black, including Shield Maiden)  
- Move highlighting and last‑move indicators  
- Promotion popup with all valid promotion options  
- Move history panel  
- Pure JavaScript, no dependencies

Engine Architecture
- board.js — board geometry, coordinates, starting position  
- movement.js — pseudo‑legal move generation  
- shieldwall.js — Shield Wall rule enforcement  
- attackmap.js — attack generation and king‑safety logic  
- legality.js — full legality filtering  
- engine.js — game state, move application, public API

The engine is fully modular and can be reused for analysis tools, bots, or alternate UIs.

UI
- 10×8 responsive board renderer  
- Classical wood styling (mahogany light squares, ebony dark squares)  
- Custom SVG piece set designed for clarity and thematic consistency  
- Drag‑and‑drop interaction  
- Highlighting for selected pieces and legal moves  
- Promotion popup  
- Move history display

Running the Game
Because the project uses ES modules, it must be served from a local or hosted web server.

Examples:
`
python3 -m http.server
`
or any lightweight static server.

Then open:
`
http://localhost:8000
`

About the Variant
Shield Maiden Chess introduces the Shield Maiden, a disciplined infantry unit that moves 1–2 squares orthogonally (no jumping) and enables the Shield Wall, a defensive mechanic that alters capture legality and creates new tactical structures.  
The variant preserves the spirit of classical chess while opening new strategic dimensions.


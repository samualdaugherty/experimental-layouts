# EXPERI-MENTAL — Print Layout Text Flow

A static web experiment that recreates magazine-style print layouts using JavaScript-based text flow across responsive regions.

## Tech
- Static HTML
- Tailwind CSS 4 via CDN
- Custom JS library: `js/text-flow.js`

## Structure
```
print-layouts/
├── index.html
├── content/
│   └── intro.json
├── styles/
│   └── intro.css
├── js/
│   ├── text-flow.js
│   └── intro.js
└── README.md
```

## JSON Content Format
```
{
  "title": "Page Title",
  "blocks": [
    {
      "id": "unique-id",
      "type": "paragraph|heading",
      "level": 4,
      "text": "Content text...",
      "keepWithNext": true,
      "orphanProtection": 2
    }
  ]
}
```

## Local Development
- Open `index.html` directly in a modern browser, or serve the folder:
  - Python: `python3 -m http.server 5050` (then open `http://localhost:5050/print-layouts/`)
  - Node: `npx http-server -p 5050` (then open `http://localhost:5050/print-layouts/`)

## Deployment
- Deploy the `print-layouts` directory as a static site on Vercel.

## Notes
- Replace the header logo with the provided R&D LABS SVG when available.
- Typography: Anton (hero/headings), Anybody 700 (titles), Assistant (body).
- Colors: primary #0D0E0E, background #FEFEFE, accent #FDC628.


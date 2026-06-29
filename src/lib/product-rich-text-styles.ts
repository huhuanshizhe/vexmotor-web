export const PRODUCT_RICH_TEXT_STYLES = `
:host {
  display: block;
  color: #102942;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

.product-rich-text {
  margin: 0;
}

.product-rich-text > *:first-child {
  margin-top: 0;
}

.product-rich-text > *:last-child {
  margin-bottom: 0;
}

.product-rich-text p {
  margin: 0 0 0.85em;
}

.product-rich-text h1,
.product-rich-text h2,
.product-rich-text h3,
.product-rich-text h4,
.product-rich-text h5,
.product-rich-text h6 {
  margin: 1.2em 0 0.45em;
  font-weight: 700;
  line-height: 1.35;
  color: #102942;
}

.product-rich-text h1 { font-size: 1.5rem; }
.product-rich-text h2 { font-size: 1.3rem; }
.product-rich-text h3 { font-size: 1.15rem; }
.product-rich-text h4 { font-size: 1.05rem; }

.product-rich-text ul,
.product-rich-text ol {
  margin: 0 0 0.85em;
  padding-left: 1.4em;
}

.product-rich-text li {
  margin: 0.25em 0;
}

.product-rich-text strong,
.product-rich-text b {
  font-weight: 700;
}

.product-rich-text em,
.product-rich-text i {
  font-style: italic;
}

.product-rich-text a {
  color: #2563a8;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.product-rich-text blockquote {
  margin: 0.85em 0;
  padding: 0.65em 0 0.65em 1em;
  border-left: 3px solid #c5d4e4;
  color: #3d5568;
}

.product-rich-text table {
  width: 100%;
  border-collapse: collapse;
  margin: 0.85em 0;
  font-size: 0.95em;
}

.product-rich-text th,
.product-rich-text td {
  border: 1px solid #d5dee8;
  padding: 0.5em 0.7em;
  text-align: left;
  vertical-align: top;
}

.product-rich-text th {
  background: #f4f7fb;
  font-weight: 600;
}

.product-rich-text img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0.85em 0;
  border-radius: 8px;
}

.product-rich-text hr {
  border: 0;
  border-top: 1px solid #d5dee8;
  margin: 1.1em 0;
}

.product-rich-text pre,
.product-rich-text code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
}

.product-rich-text pre {
  margin: 0.85em 0;
  padding: 0.75em 1em;
  overflow-x: auto;
  background: #f4f7fb;
  border-radius: 8px;
}
`.trim();

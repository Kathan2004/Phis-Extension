import DOMPurify from "dompurify"

export const sanitizeHtml = (dirty: string) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "a",
      "p",
      "div",
      "span",
      "strong",
      "em",
      "br",
      "ul",
      "ol",
      "li",
      "table",
      "thead",
      "tbody",
      "tr",
      "td"
    ],
    ALLOWED_ATTR: ["href", "title", "target", "rel"],
    FORBID_TAGS: ["script", "style", "iframe", "form"],
    FORBID_ATTR: ["onerror", "onclick", "onload"]
  })
}

// Sanitization function helper to clean clipboard HTML from Microsoft Outlook/Word
export default function sanitizeHtml(htmlString) {
  if (!htmlString) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  function cleanNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.nodeValue);
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const tagName = node.tagName.toLowerCase();
    
    // Allowed tags list
    const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'p', 'br', 'ul', 'ol', 'li', 'img', 'font'];
    
    if (!allowedTags.includes(tagName)) {
      // If tag is not allowed, recursively keep children
      const fragment = document.createDocumentFragment();
      Array.from(node.childNodes).forEach(child => {
        const cleaned = cleanNode(child);
        if (cleaned) fragment.appendChild(cleaned);
      });
      return fragment;
    }

    const cleanEl = document.createElement(tagName);
    
    // Process styling (keep color and set proper lists margins/types)
    const style = node.getAttribute('style');
    let inlineStyle = '';
    if (style) {
      const colorMatch = style.match(/color\s*:\s*([^;]+)/i);
      if (colorMatch) {
        inlineStyle += `color: ${colorMatch[1]}; `;
      }
    }
    
    if (tagName === 'ul') {
      inlineStyle += 'list-style-type: disc; margin-left: 20px; padding-left: 0; ';
    } else if (tagName === 'ol') {
      inlineStyle += 'list-style-type: decimal; margin-left: 20px; padding-left: 0; ';
    }
    
    if (inlineStyle) {
      cleanEl.setAttribute('style', inlineStyle.trim());
    }

    // Specially handle img attributes (src, style)
    if (tagName === 'img') {
      const src = node.getAttribute('src');
      if (src) {
        cleanEl.setAttribute('src', src);
      }
      cleanEl.setAttribute('style', 'max-width: 100%; border-radius: 8px; margin: 8px 0;');
    }

    // Recursively clean children
    Array.from(node.childNodes).forEach(child => {
      const cleaned = cleanNode(child);
      if (cleaned) cleanEl.appendChild(cleaned);
    });

    return cleanEl;
  }

  const fragment = document.createDocumentFragment();
  Array.from(doc.body.childNodes).forEach(child => {
    const cleaned = cleanNode(child);
    if (cleaned) fragment.appendChild(cleaned);
  });

  const tempDiv = document.createElement('div');
  tempDiv.appendChild(fragment);
  return tempDiv.innerHTML;
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Search, X, List, ExternalLink, Printer, 
  ZoomIn, ChevronRight, FileText, ArrowUp
} from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './UserManualModal.css';

/**
 * Slug generator matching GitHub markdown and TOC anchor links
 */
function slugify(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function UserManualModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [rawMarkdown, setRawMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTocVisible, setIsTocVisible] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null); // { src, alt }

  const contentRef = useRef(null);

  // Fetch markdown on open
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);

    fetch('/docs/manual_formacion_usuarios.md')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        setRawMarkdown(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching user manual:', err);
        setError(t('manual.error', 'No se pudo cargar el manual de usuario.'));
        setLoading(false);
      });
  }, [isOpen, t]);

  // Extract Table of Contents structure from markdown
  const tocItems = useMemo(() => {
    if (!rawMarkdown) return [];
    const lines = rawMarkdown.split('\n');
    const items = [];

    lines.forEach((line) => {
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h2Match) {
        const title = h2Match[1].trim();
        // Skip the initial TOC section itself in sidebar if desired
        if (title.includes('Tabla de Contenidos')) return;
        items.push({
          level: 2,
          title,
          slug: slugify(title)
        });
      } else if (h3Match) {
        const title = h3Match[1].trim();
        items.push({
          level: 3,
          title,
          slug: slugify(title)
        });
      }
    });

    return items;
  }, [rawMarkdown]);

  // Configure marked renderer & compile HTML
  const parsedHtml = useMemo(() => {
    if (!rawMarkdown) return '';

    const renderer = new marked.Renderer();

    // Custom Image renderer
    renderer.image = function ({ href, title, text }) {
      let resolvedHref = href;
      if (resolvedHref.startsWith('images/')) {
        resolvedHref = `/docs/${resolvedHref}`;
      } else if (!resolvedHref.startsWith('http') && !resolvedHref.startsWith('/')) {
        resolvedHref = `/docs/${resolvedHref}`;
      }

      const captionHtml = text ? `<figcaption class="manual-img-caption"><span style="opacity:0.7">📷</span> ${text}</figcaption>` : '';

      return `<figure class="manual-img-container" data-img-src="${resolvedHref}" data-img-alt="${text || ''}">
        <img src="${resolvedHref}" alt="${text || ''}" title="${title || ''}" class="manual-zoomable-img" loading="lazy" />
        <span class="manual-img-zoom-badge">🔍 ${t('manual.zoomHint', 'Clic para ampliar')}</span>
        ${captionHtml}
      </figure>`;
    };

    // Custom Heading renderer with anchor slugs
    renderer.heading = function ({ tokens, depth, raw }) {
      const text = this.parser.parseInline(tokens);
      const slug = slugify(raw);
      return `<h${depth} id="${slug}" class="manual-heading manual-h${depth}">
        <span>${text}</span>
        <a href="#${slug}" class="manual-anchor-link" data-slug="${slug}" title="Enlace directo">#</a>
      </h${depth}>`;
    };

    // Custom Table renderer wrapped in responsive container
    renderer.table = function (header, body) {
      return `<div class="manual-table-wrapper">
        <table>
          <thead>${header}</thead>
          <tbody>${body}</tbody>
        </table>
      </div>`;
    };

    marked.setOptions({
      renderer,
      gfm: true,
      breaks: true
    });

    const rawHtml = marked.parse(rawMarkdown);

    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['figure', 'figcaption', 'mark'],
      ADD_ATTR: ['target', 'loading', 'data-img-src', 'data-img-alt', 'data-slug']
    });
  }, [rawMarkdown, t]);

  // Search highlighting in HTML
  const displayHtml = useMemo(() => {
    if (!searchQuery.trim() || !parsedHtml) return parsedHtml;

    try {
      const query = searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?![^<]*>)(${query})`, 'gi');
      return parsedHtml.replace(regex, '<mark class="manual-search-highlight">$1</mark>');
    } catch {
      return parsedHtml;
    }
  }, [parsedHtml, searchQuery]);

  // Handle in-content clicks (Lightbox images, internal TOC links)
  const handleContentClick = (e) => {
    // 1. Check if clicked on a zoomable image
    const imgContainer = e.target.closest('.manual-img-container');
    if (imgContainer) {
      e.preventDefault();
      const src = imgContainer.getAttribute('data-img-src') || imgContainer.querySelector('img')?.src;
      const alt = imgContainer.getAttribute('data-img-alt') || imgContainer.querySelector('img')?.alt;
      if (src) {
        setLightboxImage({ src, alt });
      }
      return;
    }

    // 2. Check if clicked on internal anchor or link
    const anchor = e.target.closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        scrollToSection(targetId);
      }
    }
  };

  const scrollToSection = (slug) => {
    if (!contentRef.current) return;
    const targetElement = contentRef.current.querySelector(`#${CSS.escape(slug)}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(slug);
    }
  };

  // Keyboard shortcut: Escape to close modal or lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (lightboxImage) {
          setLightboxImage(null);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, lightboxImage, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="user-manual-overlay" onClick={onClose}>
      <div className="user-manual-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="user-manual-header">
          <div className="user-manual-header-title">
            <BookOpen size={20} color="var(--md-sys-color-primary)" />
            <h2>{t('manual.title', 'Manual de Usuario y Formación')}</h2>
            <span className="user-manual-badge">PMO v4.1</span>
          </div>

          {/* Search bar */}
          <div className="user-manual-search-box">
            <Search size={15} className="user-manual-search-icon" />
            <input
              type="text"
              placeholder={t('manual.searchPlaceholder', 'Buscar en el manual...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={false}
            />
            {searchQuery && (
              <button
                className="user-manual-search-clear"
                onClick={() => setSearchQuery('')}
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="user-manual-actions">
            <button
              className="user-manual-btn-icon"
              onClick={() => setIsTocVisible(!isTocVisible)}
              title={isTocVisible ? 'Ocultar índice' : 'Mostrar índice'}
            >
              <List size={16} />
              <span className="hide-on-mobile">{t('manual.toc', 'Índice')}</span>
            </button>

            <button
              className="user-manual-btn-icon"
              onClick={() => window.open('/docs/manual_formacion_usuarios.md', '_blank')}
              title={t('manual.openInTab', 'Abrir archivo original')}
            >
              <ExternalLink size={16} />
            </button>

            <button
              className="user-manual-btn-icon"
              onClick={() => window.print()}
              title="Imprimir Manual"
            >
              <Printer size={16} />
            </button>

            <button
              className="user-manual-btn-close"
              onClick={onClose}
              title={t('manual.close', 'Cerrar')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="user-manual-body">
          
          {/* TOC Sidebar */}
          <aside className={`user-manual-toc-sidebar ${isTocVisible ? '' : 'collapsed'}`}>
            <div className="user-manual-toc-header">
              {t('manual.toc', 'Índice de Contenidos')}
            </div>
            <ul className="user-manual-toc-list">
              {tocItems.map((item, idx) => (
                <li 
                  key={idx} 
                  className={`user-manual-toc-item ${item.level === 3 ? 'user-manual-toc-subitem' : ''}`}
                >
                  <a
                    className={`user-manual-toc-link ${activeSection === item.slug ? 'active' : ''}`}
                    onClick={() => scrollToSection(item.slug)}
                    title={item.title}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* Markdown Content Area */}
          <main 
            className="user-manual-content-wrapper" 
            ref={contentRef}
            onClick={handleContentClick}
          >
            {loading && (
              <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--md-sys-color-outline)' }}>
                <p>{t('manual.loading', 'Cargando manual de formación...')}</p>
              </div>
            )}

            {error && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--md-sys-color-error)' }}>
                <p>{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div 
                className="manual-markdown-body"
                dangerouslySetInnerHTML={{ __html: displayHtml }} 
              />
            )}
          </main>
        </div>
      </div>

      {/* Lightbox for Zoomable Image */}
      {lightboxImage && (
        <div className="manual-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button 
            className="manual-lightbox-close" 
            onClick={() => setLightboxImage(null)}
            title="Cerrar ampliación"
          >
            ✕
          </button>
          <img 
            src={lightboxImage.src} 
            alt={lightboxImage.alt || 'Captura'} 
            className="manual-lightbox-img" 
            onClick={(e) => e.stopPropagation()} 
          />
          {lightboxImage.alt && (
            <div className="manual-lightbox-caption" onClick={(e) => e.stopPropagation()}>
              {lightboxImage.alt}
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}

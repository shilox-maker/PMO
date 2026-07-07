const { sanitizeHTML } = require('../utils/helpers');

describe('Función sanitizeHTML (Seguridad WYSIWYG)', () => {
  it('debe retornar string vacío si el input no es un string', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
    expect(sanitizeHTML(123)).toBe('');
    expect(sanitizeHTML({})).toBe('');
  });

  it('debe eliminar etiquetas script enteras y su contenido', () => {
    const input = 'Texto normal <script>alert("XSS")</script> y más texto';
    expect(sanitizeHTML(input)).toBe('Texto normal  y más texto');
  });

  it('debe eliminar atributos de eventos on* (onload, onerror, onclick, etc.)', () => {
    const input = '<img src="x" onerror="alert(1)" onload="console.log(2)" /> <p onclick="run()">Click</p>';
    const output = sanitizeHTML(input);
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('onload');
    expect(output).not.toContain('onclick');
    expect(output).toContain('<img src="x" />');
    expect(output).toContain('<p>Click</p>');
  });

  it('debe limpiar URLs con protocolo javascript:', () => {
    const input = '<a href="javascript:alert(1)">Click me</a> <iframe src="javascript:alert(2)"></iframe>';
    const output = sanitizeHTML(input);
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('iframe');
    expect(output).toContain('<a>Click me</a>');
  });

  it('debe mantener formato seguro: negrita, cursiva, subrayado, párrafos y saltos de línea', () => {
    const input = '<p>Texto en <strong>negrita</strong> e <em>itálica</em> con un <br /> salto.</p>';
    expect(sanitizeHTML(input)).toBe(input);
  });

  it('debe mantener listas ordenadas y desordenadas con estilos', () => {
    const input = '<ul style="list-style-type: disc; margin-left: 20px; padding-left: 0;"><li>Elemento</li></ul>';
    const output = sanitizeHTML(input);
    expect(output).toContain('list-style-type:disc');
    expect(output).toContain('margin-left:20px');
    expect(output).toContain('padding-left:0');
  });

  it('debe mantener spans con colores', () => {
    const input = '<span style="color: #ff453a;">Texto en rojo</span>';
    const output = sanitizeHTML(input);
    expect(output).toContain('color:#ff453a');
  });

  it('debe permitir imágenes embebidas en base64 (data:image/...)', () => {
    const base64Img = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==';
    const input = `<img src="${base64Img}" style="max-width: 100%; border-radius: 8px; margin: 8px 0;" />`;
    const output = sanitizeHTML(input);
    expect(output).toContain('src="' + base64Img + '"');
    expect(output).toContain('max-width:100%');
    expect(output).toContain('border-radius:8px');
    expect(output).toContain('margin:8px 0');
  });
});

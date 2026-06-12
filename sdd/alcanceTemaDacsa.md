# Alcance: Implementación de "Tema Dacsa" Corporativo

## 1. Objetivo de la Mejora
Añadir un tercer tema visual ("Tema Dacsa") que coexista con los modos claro y oscuro existentes en el frontend [2]. El objetivo es aplicar la identidad corporativa extraída de la marca (verde oscuro principal y acentos en amarillo/naranja) [1], manteniendo intacto el estilo *glassmorphic* premium del panel [2].

## 2. Impacto en la Base de Datos / Backend
*   **Ninguno.** La base de datos SQLite [2] no sufrirá cambios. La preferencia de visualización se gestionará de forma persistente en el `localStorage` del cliente.

## 3. Impacto en el Frontend (React 19 & CSS Puro)
*   **CSS Puro:** Se inyectará un nuevo bloque `[data-theme="dacsa"]` con las variables de color correspondientes [2].
*   **Gestión de Estado:** El hook del tema pasará de ser binario a cíclico (`'light'`, `'dark'`, `'dacsa'`).
*   **Iconografía:** Se utilizará el icono `Building2` de Lucide React para representar el tema corporativo en el botón de cambio [2].

## 4. Reglas de Negocio
*   El tema debe aplicarse globalmente a todas las vistas, incluyendo el *Executive Portfolio Dashboard* y el editor WYSIWYG del muro de comentarios [3, 4].
*   Los elementos preventivos y semánticos (semáforos RAG, alertas de consumo rojo/verde) no deben verse alterados por el CSS corporativo [5, 6].
*   El badge de "Preferente" en el Combobox de Key Users (que marca a los empleados internos de Dacsa) debe destacar especialmente [4, 5].

---

## 5. Instrucciones y Código Exacto para el IDE

### Paso 1: Inyectar en CSS Global (`index.css` o `App.css`)
Añade este bloque justo debajo de tu tema oscuro actual:

```css
/* TEMA DACSA CORPORATIVO */
[data-theme="dacsa"] {
  /* Fondos generales */
  --bg-color: #F4F5F7; 
  --card-bg: rgba(255, 255, 255, 0.85); 
  
  /* Colores Corporativos Dacsa */
  --primary-color: #1A5B36; /* Verde oscuro (Logo y Banner) */
  --accent-color: #FFB800;  /* Amarillo/Naranja (Botón Aceptar y Topbar) */
  
  /* Textos y Bordes */
  --text-main: #333333;     
  --text-muted: #666666;
  --border-color: rgba(26, 91, 54, 0.15); 
  
  /* Sombras glassmorphic adaptadas a fondos claros */
  --shadow-sm: 0 4px 6px rgba(26, 91, 54, 0.05);
  --shadow-md: 0 10px 15px rgba(26, 91, 54, 0.08);
}

Paso 2: Actualizar la Lógica de Estado en React
Localiza el archivo donde controlas el tema (ej. App.jsx o ThemeContext.jsx) y reemplaza la lógica binaria por esta cíclica:

import { useState, useEffect } from 'react';

// 1. Inicialización leyendo el localStorage
const [theme, setTheme] = useState(() => {
  return localStorage.getItem('app-theme') || 'light';
});

// 2. Efecto para aplicar la clase al HTML
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('app-theme', theme);
}, [theme]);

// 3. Función cíclica para alternar temas
const toggleTheme = () => {
  setTheme((prevTheme) => {
    if (prevTheme === 'light') return 'dark';
    if (prevTheme === 'dark') return 'dacsa';
    return 'light';
  });
};

Paso 3: Actualizar el Componente Toggle de la Interfaz
Localiza el botón de cambio de tema en tu Header o menú lateral y actualízalo para usar los iconos correspondientes de Lucide React:

import { Sun, Moon, Building2 } from 'lucide-react';

// Reemplazar el botón actual de cambio de tema por este:
<button 
  onClick={toggleTheme} 
  className="theme-toggle-btn"
  title="Cambiar tema visual"
  style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
>
  {theme === 'light' && <Sun size={22} color="var(--text-main)" />}
  {theme === 'dark' && <Moon size={22} color="var(--text-main)" />}
  {theme === 'dacsa' && <Building2 size={22} color="#1A5B36" />}
</button>

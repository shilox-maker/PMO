const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Op } = require('sequelize');
const sanitizeHtml = require('sanitize-html');

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (month < 1 || month > 12) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

function sanitizeHTML(html) {
  if (typeof html !== 'string') return '';
  
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'strong', 'em', 'br', 'ul', 'ol', 'li', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'b', 'i', 'u', 's', 'font', 'img', 'a'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'style'],
      img: ['src', 'style', 'alt', 'width', 'height'],
      font: ['color', 'size', 'face'],
      span: ['style'],
      div: ['style'],
      p: ['style'],
      ul: ['style'],
      ol: ['style']
    },
    allowedStyles: {
      '*': {
        'color': [/.*/],
        'list-style-type': [/^(disc|decimal)$/],
        'margin-left': [/^[-\d\s\w\.\-%]+$/],
        'padding-left': [/^[-\d\s\w\.\-%]+$/],
        'max-width': [/^[-\d\s\w\.\-%]+$/],
        'border-radius': [/^[-\d\s\w\.\-%]+$/],
        'margin': [/^[-\d\s\w\.\-%]+$/]
      }
    },
    allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data'],
    allowedSchemesByTag: {
      img: ['data', 'http', 'https']
    }
  });
}

function sanitizeExcelValue(val) {
  if (typeof val !== 'string') return val;
  if (val.startsWith('=') || val.startsWith('+') || val.startsWith('-') || val.startsWith('@')) {
    return `'${val}`;
  }
  return val;
}

async function generateNextId(Model, prefix, keyName) {
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  
  const lastRecord = await Model.findOne({
    where: {
      [keyName]: {
        [Op.like]: pattern
      }
    },
    order: [[keyName, 'DESC']]
  });

  let nextNum = 1;
  if (lastRecord) {
    const lastId = lastRecord[keyName];
    const parts = lastId.split('-');
    if (parts.length === 3) {
      const lastNum = parseInt(parts[2], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
  }
  
  const paddedNum = String(nextNum).padStart(3, '0');
  return `${prefix}-${year}-${paddedNum}`;
}

const handleErr = (res, error, status = 400) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Error del servidor' });
};

module.exports = {
  hashPassword,
  isValidISODate,
  sanitizeHTML,
  sanitizeExcelValue,
  generateNextId,
  handleErr
};

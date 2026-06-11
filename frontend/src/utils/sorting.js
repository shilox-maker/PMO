// Reusable utility for sorting array data on the client side

export function getValueByPath(obj, path) {
  if (!path) return null;
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

export function getSortedData(data, sortConfig) {
  if (!sortConfig || !sortConfig.key) return data;
  
  const sorted = [...data].sort((a, b) => {
    let aValue = getValueByPath(a, sortConfig.key);
    let bValue = getValueByPath(b, sortConfig.key);
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
    if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
    
    // Convert boolean to number/string representation for comparison
    if (typeof aValue === 'boolean') aValue = aValue ? 1 : 0;
    if (typeof bValue === 'boolean') bValue = bValue ? 1 : 0;

    // Check if both are numeric (either numbers or numeric strings)
    const aNum = Number(aValue);
    const bNum = Number(bValue);
    const isANum = !isNaN(aNum) && String(aValue).trim() !== '';
    const isBNum = !isNaN(bNum) && String(bValue).trim() !== '';
    
    if (isANum && isBNum) {
      return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // Check if it's a date (YYYY-MM-DD pattern)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const isADate = typeof aValue === 'string' && datePattern.test(aValue);
    const isBDate = typeof bValue === 'string' && datePattern.test(bValue);
    if (isADate && isBDate) {
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Default: alphabetical text sort (localeCompare handles accents correctly)
    const aStr = String(aValue);
    const bStr = String(bValue);
    
    return sortConfig.direction === 'asc' 
      ? aStr.localeCompare(bStr, 'es', { sensitivity: 'base' })
      : bStr.localeCompare(aStr, 'es', { sensitivity: 'base' });
  });
  
  return sorted;
}

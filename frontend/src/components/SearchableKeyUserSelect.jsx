import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export default function SearchableKeyUserSelect({ 
  keyUsers = [], 
  selected = [], // Can be a single ID (number/string) or an array of IDs
  onChange, 
  multiple = false, 
  placeholder = "Seleccione Key User..." 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalize selected value to an array for easier lookup
  const selectedIds = useMemo(() => {
    if (multiple) {
      return Array.isArray(selected) ? selected.map(id => Number(id)) : [];
    } else {
      return selected ? [Number(selected)] : [];
    }
  }, [selected, multiple]);

  // Group and sort key users: Dacsa first, others alphabetical. In-group alphabetical by name
  const groupedKeyUsers = useMemo(() => {
    // 1. Filter by search query
    const query = search.toLowerCase().trim();
    const filtered = keyUsers.filter(ku => {
      const fullName = `${ku.nombre} ${ku.apellidos}`.toLowerCase();
      const company = (ku.Proveedore?.nombre_razon_social || ku.Proveedor?.nombre_razon_social || '').toLowerCase();
      return fullName.includes(query) || company.includes(query);
    });

    // 2. Group by company
    const groups = {};
    filtered.forEach(ku => {
      const company = ku.Proveedore?.nombre_razon_social || ku.Proveedor?.nombre_razon_social || 'Sin Empresa';
      if (!groups[company]) {
        groups[company] = [];
      }
      groups[company].push(ku);
    });

    // 3. Sort key users in each company alphabetically by name + surname
    Object.keys(groups).forEach(company => {
      groups[company].sort((a, b) => {
        const nameA = `${a.nombre} ${a.apellidos}`.toLowerCase();
        const nameB = `${b.nombre} ${b.apellidos}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });

    // 4. Sort company groups (Dacsa always on top, others alphabetically)
    const sortedCompanies = Object.keys(groups).sort((a, b) => {
      if (a.toLowerCase() === 'dacsa') return -1;
      if (b.toLowerCase() === 'dacsa') return 1;
      return a.localeCompare(b);
    });

    return sortedCompanies.map(company => ({
      company,
      users: groups[company]
    }));
  }, [keyUsers, search]);

  const handleSelect = (user) => {
    const id = Number(user.id_ku);
    if (multiple) {
      const newSelected = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id];
      onChange(newSelected);
    } else {
      onChange(id);
      setIsOpen(false);
    }
  };

  // Find label of selected item(s)
  const displayValue = useMemo(() => {
    if (multiple) {
      if (selectedIds.length === 0) return placeholder;
      return `${selectedIds.length} seleccionado(s)`;
    } else {
      const selectedId = selectedIds[0];
      const user = keyUsers.find(ku => Number(ku.id_ku) === selectedId);
      if (user) {
        const companyName = user.Proveedore?.nombre_razon_social || user.Proveedor?.nombre_razon_social;
        const compStr = companyName ? ` (${companyName})` : '';
        return `${user.nombre} ${user.apellidos}${compStr}`;
      }
      return placeholder;
    }
  }, [selectedIds, keyUsers, multiple, placeholder]);

  return (
    <div className="combobox-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Toggle button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
          borderRadius: 'var(--md-shape-corner-medium)',
          cursor: 'pointer',
          minHeight: '40px',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'var(--transition-smooth)',
          userSelect: 'none'
        }}
      >
        <span style={{ 
          whiteSpace: 'nowrap', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          maxWidth: '90%',
          color: selectedIds.length === 0 ? 'var(--md-sys-color-outline)' : 'inherit'
        }}>
          {displayValue}
        </span>
        <ChevronDown size={16} style={{ 
          color: 'var(--md-sys-color-outline)', 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.2s ease',
          flexShrink: 0
        }} />
      </div>

      {/* Dropdown panel */}
      {isOpen && (
        <div 
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: 'var(--md-sys-color-surface-container-highest)',
            border: '1px solid var(--md-sys-color-outline-variant)',
            borderRadius: 'var(--md-shape-corner-medium)',
            boxShadow: 'var(--md-elevation-3)',
            padding: '8px',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {/* Search bar inside dropdown */}
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Buscar por nombre o empresa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                backgroundColor: 'var(--md-sys-color-surface-container)',
                color: 'var(--md-sys-color-on-surface)',
                border: '1px solid var(--md-sys-color-outline-variant)',
                borderRadius: '8px',
                fontSize: '0.85rem',
                outline: 'none'
              }}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
            <Search size={14} style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--md-sys-color-outline)' 
            }} />
          </div>

          {/* List grouped */}
          <div style={{ overflowY: 'auto', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
            {groupedKeyUsers.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--md-sys-color-outline)', padding: '8px', textAlign: 'center' }}>
                Sin resultados
              </div>
            ) : (
              groupedKeyUsers.map(group => (
                <div key={group.company} style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Company header */}
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.05em',
                    color: group.company.toLowerCase() === 'dacsa' ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-outline)',
                    padding: '4px 8px',
                    backgroundColor: group.company.toLowerCase() === 'dacsa' ? 'rgba(168, 199, 250, 0.08)' : 'transparent',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{group.company}</span>
                    {group.company.toLowerCase() === 'dacsa' && (
                      <span style={{ fontSize: '0.6rem', padding: '1px 6px', backgroundColor: 'var(--md-sys-color-primary-container)', color: 'var(--md-sys-color-on-primary-container)', borderRadius: '100px' }}>
                        Preferente
                      </span>
                    )}
                  </div>

                  {/* Users under this company */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                    {group.users.map(user => {
                      const isSelected = selectedIds.includes(Number(user.id_ku));
                      return (
                        <div 
                          key={user.id_ku}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(user);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: isSelected ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface)',
                            backgroundColor: isSelected 
                              ? 'rgba(168, 199, 250, 0.12)' 
                              : 'transparent',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = isSelected 
                              ? 'rgba(168, 199, 250, 0.18)' 
                              : 'var(--md-sys-color-surface-container-high)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = isSelected 
                              ? 'rgba(168, 199, 250, 0.12)' 
                              : 'transparent';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {multiple && (
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="m3-checkbox"
                                style={{ width: '14px', height: '14px', marginRight: '4px', pointerEvents: 'none' }}
                              />
                            )}
                            <span>{user.nombre} {user.apellidos}</span>
                          </div>
                          {isSelected && !multiple && <Check size={14} style={{ color: 'var(--md-sys-color-primary)' }} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Render selected badges underneath for MULTIPLE selection to show selected users clearly */}
      {multiple && selectedIds.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {selectedIds.map(id => {
            const user = keyUsers.find(ku => Number(ku.id_ku) === id);
            if (!user) return null;
            return (
              <span 
                key={id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  backgroundColor: 'var(--md-sys-color-surface-container-highest)',
                  color: 'var(--md-sys-color-on-surface)',
                  borderRadius: '100px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--md-sys-color-outline-variant)'
                }}
              >
                {user.nombre} {user.apellidos}
                <X 
                  size={12} 
                  style={{ cursor: 'pointer', color: 'var(--md-sys-color-outline)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newSelected = selectedIds.filter(selectedId => selectedId !== id);
                    onChange(newSelected);
                  }}
                />
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

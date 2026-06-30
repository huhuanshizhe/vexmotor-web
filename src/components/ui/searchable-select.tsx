'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  emptyLabel?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  disabled = false,
  emptyLabel = 'No matches',
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const selected = options.find((option) => option.value === value) ?? null;

  useEffect(() => {
    if (!isEditing) {
      setQuery(selected?.label ?? '');
    }
  }, [selected?.label, value, isEditing]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized || (selected && !isEditing && query === selected.label)) {
      return options;
    }
    return options.filter((option) => {
      const haystack = `${option.label} ${option.value}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [options, query, selected, isEditing]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setIsEditing(false);
        setQuery(selected?.label ?? '');
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [selected?.label]);

  function pickOption(option: SearchableSelectOption) {
    onChange(option.value);
    setQuery(option.label);
    setIsEditing(false);
    setOpen(false);
  }

  function closeList() {
    setOpen(false);
    setIsEditing(false);
    setQuery(selected?.label ?? '');
  }

  return (
    <div className={`searchable-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <input
        className="form-input searchable-select__input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => {
          if (disabled) return;
          setOpen(true);
          setIsEditing(false);
        }}
        onChange={(event) => {
          setIsEditing(true);
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            closeList();
          }
          if (event.key === 'Enter' && filtered[0]) {
            event.preventDefault();
            pickOption(filtered[0]);
          }
        }}
      />
      {open && !disabled ? (
        <ul className="searchable-select__list" id={listId} role="listbox">
          {filtered.length ? (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`searchable-select__option${option.value === value ? ' is-selected' : ''}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pickOption(option)}
                >
                  {option.label}
                </button>
              </li>
            ))
          ) : (
            <li className="searchable-select__empty">{emptyLabel}</li>
          )}
        </ul>
      ) : null}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';

/** Carrusel accesible con gesto/touch y un control de desplazamiento siempre visible. */
export function HorizontalScrollSection({ label, className = '', tour, children }) {
  const contentRef = useRef(null);
  const [position, setPosition] = useState({ left: 0, max: 0 });

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return undefined;
    const update = () => setPosition({
      left: Math.round(element.scrollLeft),
      max: Math.max(0, Math.round(element.scrollWidth - element.clientWidth)),
    });
    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(element);
    [...element.children].forEach((child) => observer?.observe(child));
    const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update);
    mutations?.observe(element, { childList: true, subtree: true });
    return () => {
      element.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, []);

  const onSliderChange = (event) => {
    const left = Number(event.target.value);
    if (contentRef.current) contentRef.current.scrollLeft = left;
    setPosition((current) => ({ ...current, left }));
  };

  const max = position.max;
  const value = Math.min(position.left, max);
  const progress = max > 0 ? `${(value / max) * 100}%` : '100%';

  return (
    <div className={`sc-scroll-section ${className}`}>
      <div ref={contentRef} className="sc-hscroll" role="group" aria-label={label} data-tour={tour}>
        {children}
      </div>
      <input
        className="sc-scrollbar"
        type="range"
        min="0"
        max={max}
        step="1"
        value={value}
        disabled={max === 0}
        aria-label={`Desplazar ${label}`}
        aria-valuetext={max === 0 ? 'Todas las opciones están visibles' : `Desplazamiento ${Math.round((value / max) * 100)} por ciento`}
        onChange={onSliderChange}
        style={{ '--sc-progress': progress }}
      />
    </div>
  );
}

'use client';

type QuoteImageLightboxProps = {
  url: string;
  alt: string;
  onClose: () => void;
};

export function QuoteImageLightbox({ url, alt, onClose }: QuoteImageLightboxProps) {
  return (
    <div className="quote-lightbox" role="dialog" aria-modal="true" aria-label="Product image preview" onClick={onClose}>
      <button type="button" className="quote-lightbox__close" onClick={onClose} aria-label="Close preview">
        ×
      </button>
      <div className="quote-lightbox__frame" onClick={(event) => event.stopPropagation()}>
        <img src={url} alt={alt} className="quote-lightbox__image" />
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import type { Locale } from '@/lib/i18n';
import { withLocalePath } from '@/lib/i18n';

type HomeHeroSlide = {
  label: string;
  href: string;
  imageSrc: string;
  alt: string;
  description: string;
};

type HomeHeroSliderProps = {
  slides: HomeHeroSlide[];
  locale?: Locale;
};

export function HomeHeroSlider({ slides, locale = 'en' }: HomeHeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((previousIndex) => (previousIndex + 1) % slides.length);
    }, 6000);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length]);

  if (!slides.length) {
    return null;
  }

  const activeSlide = slides[currentIndex]!;

  const moveTo = (nextIndex: number) => {
    setCurrentIndex((nextIndex + slides.length) % slides.length);
  };

  return (
    <section className="home-legacy-slider-shell" aria-label="Homepage banners">
      <div className="home-legacy-slider-stage">
        {slides.map((slide, index) => {
          const isActive = index === currentIndex;

          return (
            <Link
              key={`${slide.label}-${slide.imageSrc}`}
              href={slide.href.startsWith('/') ? withLocalePath(slide.href, locale) : slide.href}
              className={`home-legacy-slide${isActive ? ' is-active' : ''}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              <Image src={slide.imageSrc} alt={slide.alt} fill sizes="(max-width: 820px) 100vw, 1200px" unoptimized priority={index === 0} className="home-legacy-slide-image" />
            </Link>
          );
        })}
      </div>

      <div className="home-legacy-slider-toolbar">
        <div className="home-legacy-slider-dots" role="tablist" aria-label="Banner slides">
          {slides.map((slide, index) => (
            <button
              key={`${slide.label}-${index}`}
              type="button"
              className={`home-legacy-slider-dot${index === currentIndex ? ' is-active' : ''}`}
              onClick={() => moveTo(index)}
              aria-label={`Show slide ${index + 1}: ${slide.label}`}
              aria-selected={index === currentIndex}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="home-legacy-slider-nav">
          <button type="button" className="home-legacy-slider-nav-button" onClick={() => moveTo(currentIndex - 1)}>
            Previous
          </button>
          <button type="button" className="home-legacy-slider-nav-button" onClick={() => moveTo(currentIndex + 1)}>
            Next
          </button>
        </div>

        <Link href={activeSlide.href.startsWith('/') ? withLocalePath(activeSlide.href, locale) : activeSlide.href} className="home-legacy-slider-caption">
          <span className="card-kicker">{activeSlide.label}</span>
          <span>{activeSlide.description}</span>
        </Link>
      </div>
    </section>
  );
}
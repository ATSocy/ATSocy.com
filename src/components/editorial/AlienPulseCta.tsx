import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export interface AlienPulseCtaProps {
  href: string;
}

export function AlienPulseCta({ href }: AlienPulseCtaProps) {
  const plusRef = useRef<HTMLSpanElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const plus = plusRef.current;
    if (!plus) return;

    gsap.set(plus, { rotate: 0, scale: 1, transformOrigin: 'center center' });
    tlRef.current = gsap.timeline({ paused: true });
    tlRef.current
      .to(plus, {
        rotate: 300,
        scale: 1.18,
        duration: 0.26,
        ease: 'power2.in',
      })
      .to(plus, {
        rotate: 360,
        scale: 1,
        duration: 0.42,
        ease: 'power2.out',
      });

    return () => {
      tlRef.current?.kill();
    };
  }, []);

  const play = () => {
    tlRef.current?.restart();
  };

  const external = /^https?:\/\//.test(href);

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onMouseEnter={play}
      onFocus={play}
      className="inline-flex items-center rounded-[24px] corner-squircle bg-accent px-4 py-2 text-body-sm font-medium text-on-accent no-underline"
    >
      <span ref={plusRef} className="mr-1.5 inline-block will-change-transform">+</span>
      <span>Create Post</span>
    </a>
  );
}

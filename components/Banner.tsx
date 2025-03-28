import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Banner() {
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const banner: HTMLElement | null = document.querySelector('.banner-content');
      if (banner) {
        banner.style.transform = `translateY(${scrolled * 0.3}px)`;
        banner.style.opacity = `${1 - scrolled / 700}`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden bg-black min-h-[100svh]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-700/30 via-black to-black z-0" />
      <div className="banner-content relative z-10 flex flex-col items-center justify-center min-h-[100svh] px-4 sm:px-6 py-16 sm:py-24 md:py-32 text-center transition-transform duration-300 ease-out">
        <h3 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-4 sm:mb-6 max-w-5xl mx-auto leading-[1.1]">
          Split expenses
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 px-2 sm:px-3">
            effortlessly
          </span>
        </h3>
        <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl text-gray-300 mb-8 sm:mb-10 md:mb-12 max-w-3xl mx-auto leading-relaxed font-light px-4">
          Whether it&apos;s a group trip or dinner, experience the simplicity of tracking and settling expenses with a single tap.
        </p>
        <Link href="/group" className="group relative inline-flex items-center justify-center w-full sm:w-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur group-hover:blur-xl transition-all duration-300" />
          <Button
            size="lg"
            className="relative w-[90%] sm:w-auto bg-black hover:bg-black/80 text-white border border-purple-500/30 text-base sm:text-lg md:text-xl px-6 sm:px-8 py-4 sm:py-6 rounded-full transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  );
}


import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: string; // e.g. 'fadeInUp', 'fadeIn'
  delay?: string;     // e.g. '0.1s'
  duration?: string;  // e.g. '1s'
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  animation = 'fadeIn',
  delay = '0.1s',
  duration = '1s',
  className = '',
  style = {},
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (elementRef.current) {
            observer.unobserve(elementRef.current);
          }
        }
      },
      {
        threshold: 0.05,
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, []);

  const animatedStyle: React.CSSProperties = {
    ...style,
    visibility: isVisible ? 'visible' : 'hidden',
    animationDelay: delay,
    animationDuration: duration,
  };

  const animationClass = isVisible ? `animate__animated animate__${animation}` : '';

  return (
    <div
      ref={elementRef}
      className={`${className} ${animationClass}`}
      style={animatedStyle}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;

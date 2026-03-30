import React from 'react';
import styles from './GlowingShadow.module.css';

/**
 * GlowingShadow Component
 * A highly interactive card component with a glowing shadow and rotating background effect.
 * Uses CSS Houdini (@property) for smooth animations.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to be rendered inside the glow.
 * @param {string} [props.className] - Optional additional class names.
 */
export function GlowingShadow({ children, className = "" }) {
  return (
    <div 
      className={`${styles['glow-container']} ${className}`} 
      role="button"
    >
      <span className={styles.glow}></span>
      <div className={styles['glow-content']}>
        {children}
      </div>
    </div>
  );
}

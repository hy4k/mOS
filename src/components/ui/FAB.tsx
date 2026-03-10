import React from 'react';
import { Plus } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { CATEGORIES } from '../../lib/constants';

export const FAB: React.FC = () => {
  const { activeCategory, setAddItemOpen, setMagicModeOpen } = useAppStore();
  const category = CATEGORIES[activeCategory];

  return (
    <div
      className="fab-dock"
      style={{ '--fab-accent': category.color, '--fab-accent-glow': `${category.color}40` } as React.CSSProperties}
    >
      <input
        id="fab-add"
        name="fab-mode"
        type="radio"
        defaultChecked
      />
      <label
        htmlFor="fab-add"
        onClick={() => {
          setMagicModeOpen(false);
          setAddItemOpen(true);
        }}
      >
        <span className="fab-icon">
          <Plus size={10} strokeWidth={3} />
        </span>
        Add
      </label>

      <input
        id="fab-ai"
        name="fab-mode"
        type="radio"
      />
      <label
        htmlFor="fab-ai"
        onClick={() => {
          setMagicModeOpen(true);
          setAddItemOpen(true);
        }}
      >
        <span className="fab-icon">
          <Plus size={10} strokeWidth={3} />
        </span>
        Add with AI
      </label>

      <div className="glider-track">
        <div className="glider-pill" />
      </div>
    </div>
  );
};

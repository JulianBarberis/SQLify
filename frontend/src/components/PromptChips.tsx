import React from 'react';
import './PromptChips.css';

interface Props {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const DEFAULT_PROMPTS = [
  'Top 10 canciones más reproducidas',
  'Artistas de Rock más populares',
  'Canciones lanzadas en 2023',
  'Usuarios con plan premium',
  'Álbumes con más de 10 canciones',
];

export const PromptChips: React.FC<Props> = React.memo(({ onSelectPrompt, disabled }) => {
  return (
    <div className="prompt-chips-container" aria-label="Sugerencias de consultas">
      <span className="prompt-chips-label">Prueba con alguna de estas consultas:</span>
      <div className="prompt-chips-list" role="group" aria-label="Lista de consultas sugeridas">
        {DEFAULT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="prompt-chip-button"
            disabled={disabled}
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
});

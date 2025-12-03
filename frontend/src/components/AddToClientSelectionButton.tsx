'use client';

import { useState, useRef, useEffect } from 'react';
import { useClientSelection } from '@/contexts/ClientSelectionContext';

interface Props {
  offerId: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function AddToClientSelectionButton({ offerId, className = '', size = 'md' }: Props) {
  const { activeSelectionCode, addToSelection, removeFromSelection, isInSelection } = useClientSelection();
  const [isLoading, setIsLoading] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const inSelection = isInSelection(offerId);

  // Focus input when shown
  useEffect(() => {
    if (showCommentInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCommentInput]);

  // Не показываем кнопку если нет активной подборки
  if (!activeSelectionCode) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inSelection) {
      setIsLoading(true);
      try {
        await removeFromSelection(offerId);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show comment input popup
      setShowCommentInput(true);
    }
  };

  const handleAddWithComment = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      await addToSelection(offerId, comment.trim() || undefined);
      setComment('');
      setShowCommentInput(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setComment('');
    setShowCommentInput(false);
  };

  const sizeClasses = size === 'sm'
    ? 'w-8 h-8 text-sm'
    : 'w-10 h-10';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          ${sizeClasses}
          rounded-full flex items-center justify-center
          transition-all duration-200
          ${inSelection
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-white/90 text-[var(--color-text)] hover:bg-white border border-[var(--color-border)]'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
          ${className}
        `}
        title={inSelection ? 'Удалить из подборки' : 'Добавить в подборку'}
      >
        {isLoading ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : inSelection ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        )}
      </button>

      {/* Comment Input Popup */}
      {showCommentInput && (
        <div
          className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border border-[var(--color-border)] p-3 w-64"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleAddWithComment}>
            <div className="text-sm font-medium mb-2">Добавить в подборку</div>
            <textarea
              ref={inputRef}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Комментарий (необязательно)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                {isLoading ? 'Добавляю...' : 'Добавить'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

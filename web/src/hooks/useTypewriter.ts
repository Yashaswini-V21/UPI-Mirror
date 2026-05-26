import { useEffect, useState } from 'react';

/**
 * Streams text character by character at `speed` ms per character.
 * Returns the progressively revealed text and a boolean indicating if still typing.
 */
export function useTypewriter(text: string, speed: number = 16) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    if (!text) {
      setIsTyping(false);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.substring(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayedText, isTyping };
}

import { useState, useEffect, useRef, useCallback } from "react";
import { words, shuffleArray } from "./words";
import type { Word } from "./words";
import "./App.css";

function normalizeRomaji(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[-ー]/g, "") // Remove hyphens/long vowel markers
    .replace(/ou/g, "oo") // Normalize long o
    .replace(/ō/g, "oo")
    .replace(/ū/g, "uu")
    .replace(/ā/g, "aa")
    .replace(/ē/g, "ee")
    .replace(/ī/g, "ii");
}

function checkAnswer(input: string, word: Word): boolean {
  const normalizedInput = normalizeRomaji(input);
  return word.romaji.some(
    (accepted) => normalizeRomaji(accepted) === normalizedInput
  );
}

function getFontSizeClass(text: string): string {
  const len = text.length;
  if (len <= 4) return "";
  if (len <= 6) return "katakana-md";
  if (len <= 8) return "katakana-sm";
  return "katakana-xs";
}

function App() {
  const [wordQueue, setWordQueue] = useState<Word[]>(() => shuffleArray(words));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [shake, setShake] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = wordQueue[currentIndex];

  // Focus input on mount and after advancing
  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const advance = useCallback(() => {
    setInput("");
    setCorrect(false);
    setRevealed(false);
    setShake(false);
    setWrongAttempts(0);

    if (currentIndex >= wordQueue.length - 1) {
      // Reshuffle and start over
      setWordQueue(shuffleArray(words));
      setCurrentIndex(0);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, wordQueue.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (correct || revealed) {
      // Already answered, advance to next
      advance();
      return;
    }

    if (!input.trim()) return;

    if (checkAnswer(input, currentWord)) {
      setCorrect(true);
      setStats((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      // Auto-advance after a brief delay
      setTimeout(advance, 600);
    } else {
      setShake(true);
      setWrongAttempts((w) => w + 1);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSkip = () => {
    if (!revealed && !correct) {
      setRevealed(true);
      setStats((s) => ({ ...s, total: s.total + 1 }));
    } else {
      advance();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleSkip();
    }
  };

  return (
    <div className="app">
      <div className="stats">
        {stats.total > 0 && (
          <span>
            {stats.correct}/{stats.total} (
            {Math.round((stats.correct / stats.total) * 100)}%)
          </span>
        )}
      </div>

      <main className={`card ${correct ? "correct" : ""} ${shake ? "shake" : ""}`}>
        <div className={`katakana ${getFontSizeClass(currentWord.katakana)}`}>{currentWord.katakana}</div>

        {currentWord.meaning && (correct || revealed) && (
          <div className="meaning">{currentWord.meaning}</div>
        )}

        {currentWord.meaning && !correct && !revealed && wrongAttempts >= 2 && (
          <div className="hint">Hint: {currentWord.meaning}</div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type the reading..."
            className={`input ${correct ? "input-correct" : ""} ${
              revealed ? "input-revealed" : ""
            }`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-gramm="false"
            disabled={correct}
          />
        </form>

        {revealed && (
          <div className="answer">
            <span className="answer-label">Answer:</span>{" "}
            <span className="answer-text">{currentWord.romaji[0]}</span>
          </div>
        )}

        <div className="actions">
          <button
            type="button"
            onClick={handleSkip}
            className="skip-button"
          >
            {revealed ? "Next →" : "Skip / Show Answer"}
          </button>
        </div>
      </main>

      <footer className="footer">
        <span>Press Enter to submit • Esc to skip</span>
      </footer>
    </div>
  );
}

export default App;

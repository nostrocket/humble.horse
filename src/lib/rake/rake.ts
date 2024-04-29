// Rapid Automatic Keyword Extraction (RAKE) https://patentimages.storage.googleapis.com/ae/f0/7f/bc099e8c71801e/US8131735.pdf

import { stopWords } from "./stopwords";

export class Rake {
    private stopWords: Set<string>;

    constructor() {
        this.stopWords = new Set(stopWords);
    }

    private isStopWord(word: string): boolean {
        return this.stopWords.has(word.toLowerCase());
    }

    private splitPhrases(text: string): string[] {
        const regex = /[^\p{L}\p{N}]+/gu;
        return text.split(regex).filter(word => !this.isStopWord(word) && word.trim() !== '');
    }

    private calculateWordScores(phrases: string[]): Map<string, number> {
        let wordFrequencies = new Map<string, number>();
        let wordDegrees = new Map<string, number>();

        for (let phrase of phrases) {
            let words = phrase.split(/\s+/);
            let wordsLength = words.length;
            let wordsDegree = wordsLength - 1;

            for (let word of words) {
                wordFrequencies.set(word, (wordFrequencies.get(word) || 0) + 1);
                wordDegrees.set(word, (wordDegrees.get(word) || 0) + wordsDegree);
            }
        }

        let wordScores = new Map<string, number>();
        wordFrequencies.forEach((freq, word) => {
            wordScores.set(word, (wordDegrees.get(word) || 0) + freq);
        });

        return wordScores;
    }

    private calculatePhraseScores(phrases: string[], wordScores: Map<string, number>): Map<string, number> {
        let phraseScores = new Map<string, number>();
        for (let phrase of phrases) {
            let words = phrase.split(/\s+/);
            let score = words.reduce((acc, word) => acc + (wordScores.get(word) || 0), 0);
            phraseScores.set(phrase, score);
        }
        return phraseScores;
    }

    public extractKeywords(text: string): string[] {
        const phrases = this.splitPhrases(text);
        const wordScores = this.calculateWordScores(phrases);
        const phraseScores = this.calculatePhraseScores(phrases, wordScores);

        // Sort phrases by score and return them
        return Array.from(phraseScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0]);
    }
}

// Example usage:




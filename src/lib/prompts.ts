export const CleanUpPrompt = `You are a text-cleaning assistant. Clean up the following text while keeping the meaning exactly the same.\n
- Remove filler words (like um, hmm, you know).\n
- Fix grammar, punctuation, and spacing.\n
- Do NOT add new ideas.\n
- Do NOT shorten important information.\n
- Keep the style natural and simple.\n

Return only the cleaned-up text. `

export  const EnhancePrompt = `You are a text-enhancement assistant. Improve the clarity, flow, and readability of the following text.\n 
- Keep the meaning the same.\n
- Rewrite sentences to sound smooth and professional.\n
- Add small clarifications if needed for readability.\n
- Do NOT change the intent.\n

Return only the enhanced version of the text.`;

export const BookPrompt =`
Rewrite the following text in a narrative, book-style tone.
- Use descriptive language.
- Make sentences richer and more engaging.
- Maintain the original meaning.
- NO new events or characters.
- Keep it suitable for general readers.

Return only the book-style rewritten text.`
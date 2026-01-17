// ✅ STAGE 2 (MIDDLE): Cleanup + Separation
// This is now the ONLY place "cleanup" happens.
// Output stays JSON so Stage 3 can consume it reliably.
export const ExtractPointsPrompt = `
You are an assistant helping a writer organize spoken thoughts.

Your task is to lightly clean and organize a raw spoken transcript into labeled sections,
WITHOUT removing, shortening, or summarizing any content.

IMPORTANT: This stage is NOT about extracting importance.
It is about preserving ALL content and simply organizing it.

Rules (VERY IMPORTANT):
- Do NOT rewrite into book style.
- Do NOT enhance, strengthen, or change arguments.
- Do NOT add opinions or new ideas.
- Do NOT remove meaningful ideas, details, examples, anecdotes, or repetitions.
- Do NOT change the meaning or intent of any sentence.
- Do NOT change the order of ideas.
- Do NOT paraphrase, replace, or abstract meaningful words or sentences.
- Preserve uncertainty exactly (e.g. "maybe", "I think", "not sure", "if").
- Preserve repetition unless it is a clear transcription error.

LENGTH REQUIREMENT (CRITICAL):
- The total output text length must be approximately the SAME as the input text
  (excluding removed filler words and obvious transcription errors).
- If the output becomes noticeably shorter, you are summarizing — STOP and preserve more text.

Allowed cleanup (ONLY these are allowed):
- Fix punctuation (periods, commas, question marks).
- Fix spacing and line breaks.
- Remove spoken fillers and discourse markers that add no semantic value, such as:
  "now", "okay", "so", "you see", "I mean", "kind of", "sort of",
  "we're gonna", "what's happening", repeated hesitation phrases.
- Remove obvious speech-to-text artifacts (accidental duplicated words, stutters).
- Split run-on text into sentences ONLY where clearly needed for readability.
- Do NOT rephrase sentences after cleaning.

What to do:
1. Apply ONLY the allowed cleanup so the text becomes readable,
   while keeping wording and length as close to the original as possible.
2. Segment the transcript into contiguous sections based on topic shifts
   WITHOUT merging, collapsing, or compressing content.
3. Each section should contain ALL original sentences that belong to that part of the speech.
4. For each section:
   - Create a short, neutral heading that LABELS the topic being discussed
     (prefer the speaker’s own wording where possible).
   - Place the cleaned original text under the heading, fully preserved.

Output format rules:
- Output valid JSON only.
- Do NOT include explanations, commentary, or extra text.
- Do NOT use markdown or symbols.
- The output must match this exact schema:

[
  {
    "heading": "string",
    "text": "string"
  }
]
`;

// ✅ STAGE 3 (FINAL): Base prompt shared by all final styles
// Summarize-like framing: "clarified version" (NOT a summary that removes details)
export const FinalBasePrompt = `
You are a constrained rewrite engine for spoken language.

You will be given CLEANED and STRUCTURED text that comes directly from a speaker’s transcript.
The input consists of multiple sections. Each section contains:
- a "heading" (context only)
- a "text" field (the content to process)

Use headings ONLY to understand context and flow.
Do NOT repeat, reference, or output headings.

Core argument provided by the user (context only, do NOT reshape content to fit it):
"""
{{CORE_ARGUMENT}}
"""

YOUR TASK:
Rewrite the input so it reads smoothly as written text,
while staying extremely close to the original wording, length, and structure.

THIS IS NOT A SUMMARY.
THIS IS NOT AN EXPLANATION.
THIS IS NOT AN INTERPRETATION.

NON-NEGOTIABLE RULES:
- Preserve ALL ideas, details, examples, repetitions, and uncertainties.
- Do NOT remove content for brevity or clarity.
- Do NOT generalize, abstract, or explain ideas.
- Do NOT collapse multiple ideas into one.
- Do NOT change meaning, intent, or emphasis.
- Preserve uncertainty words exactly (e.g. "maybe", "I think", "not sure", "if").
- Preserve repetition unless it is a clear transcription error.
- Preserve first-person voice ("I", "me") where present.
- Preserve the original order of ideas.
- Prefer keeping original sentence wording over rewriting.
- If unsure whether to rewrite or keep a sentence, KEEP IT.

LENGTH CONSTRAINT:
- The output must be approximately the SAME LENGTH as the input text.
- If the output becomes noticeably shorter, you are summarizing — STOP and preserve more wording.

FORMAT RULES:
- Output plain text only.
- No headings, bullets, numbering, markdown, or symbols.
- No preface, no explanation, no meta commentary.
- Combine all processed text into one continuous plain-text output.
`;
// ✅ STAGE 3 STYLE MODIFIERS
// You append one of these to FinalBasePrompt based on the selected style.

export const CleaningStylePrompt = `
Style: CLEANING (very light)

Instructions:
- Fix remaining grammar and awkward phrasing only.
- Keep sentence structure and wording extremely close to the input.
- Do NOT improve arguments or add transitions.
- Do NOT reduce repetition.
- Use simple, natural language.
- Normal paragraphs only.
`;

export const EnhanceStylePrompt = `
Style: ENHANCE (clarity without compression)

Instructions:
- Improve readability while preserving all content.
- Split very long sentences ONLY if readability demands it.
- Merge very short sentences ONLY if meaning is unchanged.
- Add light connective words ONLY if they do not change tone or intent.
- Preserve uncertainty, repetition, and exploratory phrasing.
- Avoid academic or editorial tone.
- Normal paragraphs only.
`;

export const BookStylePrompt = `
Style: BOOK STYLE (faithful long-form prose)

Instructions:
- Rewrite into smooth, readable prose suitable for long-form writing.
- Preserve EVERY detail, example, condition, and sequence.
- Remove spoken artifacts only if meaning is preserved exactly.
- Do NOT dramatize, exaggerate, or interpret.
- Keep the speaker’s voice and uncertainty intact.
- Do NOT turn tentative thoughts into conclusions.
- Normal paragraphs only.
`;

// ❌ DEPRECATED / REMOVE (final-stage option)
// Client requirement: cleanup is done in the middle section now.
// Keep only if you need it internally for debugging, but do not expose it in UI.
export const CleanUpPrompt_DEPRECATED = `
[DEPRECATED] Cleanup is handled in Stage 2 (ExtractPointsPrompt). Do not use as a final style option.
`;

/**
 * Example usage (Stage 3):
 * const finalPrompt = FinalBasePrompt + EnhanceStylePrompt;
 * // Provide input sections + CORE_ARGUMENT via your template system.
 */

import type { AudioAsset } from "../types";

// Clips were segmented from the licensed source recordings using semantically verified transcript
// boundaries. Each begins with "Now listen to the conversation" and ends after the final meaningful
// speaker turn, before the source recording's "Now answer..." prompt and answer silence.
export const audioAssets: readonly AudioAsset[] = [
  audio("A", "q01", 16.22),
  audio("A", "q03", 21.73),
  audio("A", "q06-07", 30.72),
  audio("A", "q10-12", 48.82),
  audio("A", "q13-16", 73.12),
  audio("B", "q01", 15.83),
  audio("B", "q03", 23.82),
  audio("B", "q06-07", 30.54),
  audio("B", "q10-12", 53.03),
  audio("B", "q13-16", 76.23),
];

export function getAudioAsset(id: string) {
  return audioAssets.find((asset) => asset.id === id) ?? null;
}

export function isPlayableAudioAsset(asset: AudioAsset | null): asset is AudioAsset & {
  startSeconds: number;
  endSeconds: number;
  expectedDurationSeconds: number;
} {
  return Boolean(
    asset &&
      asset.startSeconds !== null &&
      asset.endSeconds !== null &&
      asset.expectedDurationSeconds !== null &&
      asset.endSeconds > asset.startSeconds,
  );
}

function audio(
  form: "A" | "B",
  sourceBlock: string,
  durationSeconds: number,
): AudioAsset {
  return {
    id: `${form.toLowerCase()}-${sourceBlock}`,
    form,
    source: `/placement-test/audio/test-${form.toLowerCase()}-${sourceBlock}.mp3`,
    startSeconds: 0,
    endSeconds: durationSeconds,
    expectedDurationSeconds: durationSeconds,
  };
}

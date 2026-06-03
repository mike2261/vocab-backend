export type ReviewRating = "forgot" | "hard" | "good" | "easy";

type ReviewStateInput = {
  stage: number;
  repetitionCount: number;
  intervalDays: number;
  easeFactor: number;
};

export function calculateNextStage(stage: number, rating: ReviewRating): number {
  if (rating === "forgot") return Math.max(1, stage - 1);
  return Math.min(5, stage + 1);
}

export function calculateNextReview(state: ReviewStateInput, rating: ReviewRating) {
  let { repetitionCount, intervalDays, easeFactor } = state;

  if (rating === "forgot") {
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    repetitionCount = 0;
  } else if (rating === "hard") {
    intervalDays = Math.max(2, Math.ceil(intervalDays * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.1);
    repetitionCount += 1;
  } else if (rating === "good") {
    intervalDays = intervalDays === 0 ? 1 : Math.ceil(intervalDays * easeFactor);
    repetitionCount += 1;
  } else {
    intervalDays = intervalDays === 0 ? 3 : Math.ceil(intervalDays * easeFactor * 1.3);
    easeFactor = easeFactor + 0.15;
    repetitionCount += 1;
  }

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + intervalDays);

  return {
    stage: calculateNextStage(state.stage, rating),
    repetitionCount,
    intervalDays,
    easeFactor,
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

// Shared refs to persist UI state across component unmounts
export const pointsRef: {
  current: { heading: string; text: string }[] | null;
} = {
  current: null,
};

export const refineFinalTextRef: { current: string | null } = {
  current: null,
};

export const refineCoreArgumentRef: { current: string | null } = {
  current: null,
};

export const pointsOutputRef: { current: string | null } = {
  current: null,
};

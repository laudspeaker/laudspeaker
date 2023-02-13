export interface CancellablePromise {
  promise: Promise<unknown>;
  cancel: () => void;
}

export const createCancellablePromise = (
  promise: Promise<unknown>
): CancellablePromise => {
  let isCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (value) => (isCanceled ? reject({ isCanceled, value }) : resolve(value)),
      (error) => reject({ isCanceled, error })
    );
  });

  return {
    promise: wrappedPromise,
    cancel: () => (isCanceled = true),
  };
};

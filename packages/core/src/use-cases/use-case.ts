/**
 * Contract shared by every application use case: a single `execute` that maps a
 * typed input to a typed output. Use cases that take no input use `void` as `I`.
 */
export interface UseCase<I, O> {
  execute(input: I): Promise<O>;
}

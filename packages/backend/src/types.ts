export type Component<Input, Context, Output> = (
    input: Input,
    ctx: Context,
) => Promise<Output>;

export type Result<T, E> =
    | {
          value: T;
          error?: undefined;
      }
    | {
          value?: undefined;
          error: E;
      };

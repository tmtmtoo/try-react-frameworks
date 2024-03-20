export type Component<Input, Context, Output> = (
  input: Input,
  ctx: Context,
) => Promise<Output>;

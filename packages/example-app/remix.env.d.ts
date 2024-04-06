/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

import "@remix-run/node";
import type { DataFunctionArgs } from "@remix-run/node";

declare module "@remix-run/node" {
  export interface LoaderFunctionArgs extends DataFunctionArgs {
    context: { foo: string };
  }

  export interface ActionFunctionArgs extends DataFunctionArgs {
    context: { foo: string };
  }
}

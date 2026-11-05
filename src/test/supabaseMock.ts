/**
 * A tiny stand-in for the Supabase query builder, for unit tests.
 *
 * Every call made on a query is recorded, and awaiting a query resolves to the
 * next result queued with `respond`, so a test can check both what the code
 * asked for and how it handles each answer (rows, errors, empty results).
 */
export interface Call {
  method: string;
  args: unknown[];
}

export interface RecordedQuery {
  table: string;
  calls: Call[];
}

export type Result = { data?: unknown; error?: unknown; count?: number | null };

export function createSupabaseMock() {
  const queries: RecordedQuery[] = [];
  const results: Result[] = [];
  const rpcCalls: { fn: string; args: unknown }[] = [];

  const next = (): Result => {
    const r = results.shift() ?? {};
    return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
  };

  const builder = (query: RecordedQuery) => {
    const proxy: Record<string, unknown> = new Proxy(
      {},
      {
        get(_target, prop: string) {
          if (prop === 'then') {
            const result = next();
            return (resolve: (v: Result) => unknown, reject?: (e: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject);
          }
          return (...args: unknown[]) => {
            query.calls.push({ method: prop, args });
            return proxy;
          };
        },
      },
    );
    return proxy;
  };

  const client = {
    from(table: string) {
      const query: RecordedQuery = { table, calls: [] };
      queries.push(query);
      return builder(query);
    },
    rpc(fn: string, args?: unknown) {
      rpcCalls.push({ fn, args });
      return Promise.resolve(next());
    },
  };

  return {
    client,
    queries,
    rpcCalls,
    /** Queue the results of the next awaited queries, in order. */
    respond(...r: Result[]) {
      results.push(...r);
    },
    reset() {
      queries.length = 0;
      results.length = 0;
      rpcCalls.length = 0;
    },
    /** The arguments of the first call of `method` on a recorded query. */
    argsOf(query: RecordedQuery, method: string): unknown[] | undefined {
      return query.calls.find((c) => c.method === method)?.args;
    },
  };
}

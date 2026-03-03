/**
 * tRPC Compatibility Stub
 * 
 * tRPC has been removed. This stub prevents build errors for pages not yet migrated to REST.
 * Pages using `trpc.xxx.useQuery()` will receive empty data and loading=false.
 * Migrate pages one-by-one to use hrService.ts / authService.ts REST hooks instead.
 */

const createStubQuery = () => ({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data: undefined }),
});

const createStubMutation = () => ({
    mutate: (_data?: any, _opts?: any) => {
        console.warn('[tRPC Stub] mutate called - please migrate this component to REST');
        if (_opts?.onError) {
            _opts.onError(new Error('tRPC removed — migrate to REST'));
        }
    },
    mutateAsync: (_data?: any) => Promise.reject(new Error('tRPC removed — migrate to REST')),
    isPending: false,
    isLoading: false,
    isError: false,
    error: null,
    reset: () => { },
});

type StubQuery = ReturnType<typeof createStubQuery>;
type StubMutation = ReturnType<typeof createStubMutation>;

// Deep proxy that returns stubs for any property access chain ending in useQuery / useMutation
function createDeepProxy(): any {
    const proxy: any = new Proxy(
        () => proxy, // Make the proxy itself callable to handle useUtils() / useContext()
        {
            get(_target, prop) {
                const key = String(prop);
                if (key === 'useQuery') return createStubQuery;
                if (key === 'useMutation') return () => createStubMutation();
                if (key === 'useInfiniteQuery') return createStubQuery;
                if (key === 'useUtils') return () => createDeepProxy();
                if (key === 'useContext') return () => createDeepProxy();
                if (key === 'invalidate') return () => Promise.resolve();
                if (key === 'createClient') return () => ({});
                if (key === 'Provider') return ({ children }: { children: any }) => children;
                return createDeepProxy();
            },
        }
    );
    return proxy;
}

export const trpc = createDeepProxy();
export default trpc;

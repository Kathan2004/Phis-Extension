# Performance Optimization Strategy

## CPU Optimization

- Restrict heavy analysis to user-triggered scan and visible email context.
- Use lazy model initialization and reuse in-memory session pipeline.
- Bound loops for link and attachment analysis.

## Memory Optimization

- Store compact scan result documents only.
- Use Bloom filter for threat pre-check to reduce DB reads.
- Avoid retaining raw HTML in IndexedDB.

## Runtime Optimization

- Use WASM backend by default.
- Detect WebGPU and prefer accelerated path on supported endpoints.
- Batch threat feed checks by candidate set.

## Startup Optimization

- Do not preload NLP model during installation.
- Bootstrap threat feed once per install/update lifecycle.

## Monitoring (Local)

- Track per-scan timing in admin mode.
- Monitor model warm/cold latency and rule-engine execution time.

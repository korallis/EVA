// Service handlers for main process
export { authService } from './authHandlers';
export { esiHandlers } from './esiHandlers';
export { sdeHandlers } from './sdeHandlers';
export { fittingHandlers } from './fittingHandlers';
export { cacheHandlers } from './cacheHandlers';
export { recommendationHandlers } from './recommendationHandlers';

// Initialize all handlers
export function initializeHandlers() {
  // Handlers are initialized in their constructors
  console.log('✅ All IPC handlers initialized');
}
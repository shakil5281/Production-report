// Minimal service worker to prevent 404 errors
// This file exists to prevent Next.js from throwing 404 errors when looking for sw.js

// Basic install event
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Basic activate event
self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Basic fetch event - just pass through to network
self.addEventListener('fetch', (event) => {
  // Let the browser handle all requests normally
  // No caching or offline functionality needed for this app
});

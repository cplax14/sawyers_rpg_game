module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [
    [
      'babel-plugin-transform-import-meta',
      {
        module: 'ES6',
        replacements: {
          'import.meta.env': JSON.stringify({
            NODE_ENV: 'test',
            VITE_FIREBASE_API_KEY: 'mock-api-key',
            VITE_FIREBASE_AUTH_DOMAIN: 'mock-auth-domain',
            VITE_FIREBASE_PROJECT_ID: 'mock-project-id',
            VITE_FIREBASE_STORAGE_BUCKET: 'mock-storage-bucket',
            VITE_FIREBASE_MESSAGING_SENDER_ID: 'mock-sender-id',
            VITE_FIREBASE_APP_ID: 'mock-app-id',
            VITE_USE_FIREBASE_EMULATOR: 'false'
          })
        }
      }
    ]
  ]
};

declare module 'seek-bzip' {
  function decode(buffer: Buffer, totalSize?: number): Buffer;
  export = { decode };
}

interface Window {
  electronAPI: import('./src/preload').ElectronAPI;
}

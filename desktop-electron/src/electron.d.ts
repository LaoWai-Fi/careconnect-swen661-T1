export {}

declare global {
  interface Window {
    careConnectWindow?: {
      minimize: () => void
      maximize: () => void
      close: () => void
    }
  }
}

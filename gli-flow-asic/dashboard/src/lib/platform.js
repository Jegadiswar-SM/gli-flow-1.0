export const isElectron = typeof window !== "undefined" && Boolean(window.gliFlowDesktop?.platformInfo)

export function desktopPlatformInfo() {
  return isElectron ? window.gliFlowDesktop.platformInfo() : { isElectron: false, platform: "browser" }
}

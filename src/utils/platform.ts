type PlatformNavigator = Pick<Navigator, "platform" | "userAgent"> & {
  userAgentData?: { platform?: string };
};

export function isMacOS(
  browserNavigator: PlatformNavigator | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator,
): boolean {
  const platform =
    browserNavigator?.userAgentData?.platform ??
    browserNavigator?.platform ??
    browserNavigator?.userAgent ??
    "";
  return /mac/i.test(platform);
}

export function getAltGrModifierLabel(browserNavigator?: PlatformNavigator): string {
  return isMacOS(browserNavigator) ? "Option" : "Right Alt";
}

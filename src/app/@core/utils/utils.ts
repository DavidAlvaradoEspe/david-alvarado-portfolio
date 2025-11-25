export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent;
  let platform: string;
  if ('userAgentData' in navigator && navigator.userAgentData) {
    platform = (navigator.userAgentData as { platform: string }).platform;
  } else {
    platform = navigator.platform;
  }

  const isIpadOS = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  if (/android/i.test(userAgent)) return true;

  if (/iphone|ipod/i.test(userAgent)) return true;

  if (/ipad/i.test(userAgent)) return true;

  return isIpadOS;

}

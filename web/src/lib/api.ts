export const buildURLWithParams = (
  url: string,
  params?: Record<string, string | number>
): string => {
  if (!params) return url;
  const paramsString = new URLSearchParams(params as Record<string, string>).toString();
  return `${url}?${paramsString}`;
};

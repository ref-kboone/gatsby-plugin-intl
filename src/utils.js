export const normalize = url => {
  const set = url.match(/([^:]\/{2,3})/g) // Match (NOT ":") followed by (2 OR 3 "/")

  for (const str in set) {
    const replace_with = set[str].substr(0, 1) + "/"
    url = url.replace(set[str], replace_with)
  }
  return url
}

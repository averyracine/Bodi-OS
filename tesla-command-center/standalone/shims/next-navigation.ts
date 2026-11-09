export function usePathname() {
  return "/";
}
export function useSearchParams() {
  return new URLSearchParams();
}
export function useRouter() {
  return { push: (h: string) => (location.hash = h), refresh: () => {} };
}

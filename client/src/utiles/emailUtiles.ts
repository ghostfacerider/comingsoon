import disposableDomains from "disposable-email-domains";

export function isDisposableEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

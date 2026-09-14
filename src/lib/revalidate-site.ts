/**
 * Ask the server to refresh the public site after a catalogue change, so
 * product and collection links appear or disappear straight away.
 *
 * Fire-and-forget: the admin write already succeeded, and if this fails the
 * public pages still catch up on their own revalidate window.
 */
export function revalidatePublicSite() {
  fetch("/api/revalidate", { method: "POST" }).catch(() => undefined);
}

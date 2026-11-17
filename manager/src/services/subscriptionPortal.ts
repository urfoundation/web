/**
 * What the Account Settings "Open Subscription Portal" button does with the
 * answer to POST /stripe/customer-portal.
 *
 * The server makes a billing portal session for the signed-in network's own
 * Stripe customer, the way ur.io and the apps open the portal. Its link signs
 * the customer in and expires minutes after it is made, so it is asked for on
 * each press. The portal's email sign-in page, which the button used to link,
 * mails a link only to an address that is already a Stripe customer, while
 * telling every address that one was sent.
 */
import type { CustomerPortalResponse } from "./types";

/** The server's code for a network with no Stripe customer (SubscriptionErrorCodeNoCustomer). */
export const SUBSCRIPTION_PORTAL_NO_CUSTOMER_CODE = "no_customer";

export const SUBSCRIPTION_PORTAL_NO_CUSTOMER_MESSAGE =
  "This account has no Stripe subscription, so there is no billing portal to open. " +
  "A plan bought in the App Store or Google Play is managed in that store, " +
  "and a plan for another account is managed while signed in to that account.";

export const SUBSCRIPTION_PORTAL_FAILED_MESSAGE =
  "Could not open the billing portal. Please try again.";

export type SubscriptionPortalOutcome =
  | { kind: "open"; url: string }
  | { kind: "no_customer"; message: string }
  | { kind: "error"; message: string };

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Open the session link, or say why there is none. */
export function subscriptionPortalOutcome(
  answer: CustomerPortalResponse | null | undefined
): SubscriptionPortalOutcome {
  if (answer?.error) {
    if (answer.error.code === SUBSCRIPTION_PORTAL_NO_CUSTOMER_CODE) {
      return { kind: "no_customer", message: SUBSCRIPTION_PORTAL_NO_CUSTOMER_MESSAGE };
    }
    return {
      kind: "error",
      message: answer.error.message || SUBSCRIPTION_PORTAL_FAILED_MESSAGE,
    };
  }
  const url = answer?.url;
  if (typeof url === "string" && isHttpsUrl(url)) {
    return { kind: "open", url };
  }
  return { kind: "error", message: SUBSCRIPTION_PORTAL_FAILED_MESSAGE };
}

import type { LoaderFunctionArgs } from "react-router";
import { redirect, Link, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showLogin: Boolean(login) };
};

export default function App() {
  const { showLogin } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>Inner Image Zoom</h1>
        <p className={styles.text}>
          Let shoppers magnify product photos in place. Enable the app embed
          in the theme editor — no theme code edits required.
        </p>
        <p className={styles.note}>
          Install Inner Image Zoom from the Shopify App Store, then open the
          app from Shopify Admin.
        </p>
        {showLogin && (
          <p className={styles.login}>
            Already installed?{" "}
            <Link className={styles.loginLink} to="/auth/login">
              Log in to an existing store
            </Link>
          </p>
        )}
        <ul className={styles.list}>
          <li>
            <strong>In-place zoom.</strong> Click or hover to magnify the
            product image without replacing your gallery.
          </li>
          <li>
            <strong>Theme editor settings.</strong> Choose trigger, mobile
            fullscreen, zoom scale, and preload, then save.
          </li>
          <li>
            <strong>No theme file edits.</strong> Turn on the app embed under
            Theme settings → App embeds.
          </li>
        </ul>
      </div>
    </div>
  );
}

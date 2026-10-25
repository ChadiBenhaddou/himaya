import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";

/**
 * Meta Pixel base code, placed in <head> on every page exactly as Meta instructs.
 * Only difference from Meta's snippet: it's skipped on localhost so your own testing
 * doesn't pollute your ad data. The script loads fbevents.js asynchronously, so it doesn't
 * block the page from rendering.
 */
const SNIPPET = `if (!/^(localhost|127\\.0\\.0\\.1)$/.test(location.hostname)) {
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
}`;

/** Goes inside <head>. */
export function MetaPixelScript() {
  // Static snippet with a hard-coded numeric ID; no user input.
  return <script id="meta-pixel" dangerouslySetInnerHTML={{ __html: SNIPPET }} />;
}

/** Goes inside <body>: fallback for visitors with JavaScript disabled. */
export function MetaPixelNoScript() {
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}

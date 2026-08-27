/**
 * Utility helper for background bill printing without navigating away or opening new tabs.
 */
export function triggerPrintInvoice(billId: string, openInNewTab: boolean = false) {
  if (typeof window === "undefined") return;

  if (openInNewTab) {
    window.open(`/print/${billId}`, "_blank");
    return;
  }

  let iframe = document.getElementById("medishop-print-iframe") as HTMLIFrameElement | null;

  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "medishop-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);
  }

  iframe.src = `/print/${billId}`;
}

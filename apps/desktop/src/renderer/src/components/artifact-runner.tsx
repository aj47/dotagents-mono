import { useEffect, useMemo, useRef, useState } from "react"
import {
  isArtifactBridgeMessage,
  type ArtifactFiles,
} from "@dotagents/shared"
import { cn } from "@renderer/lib/utils"

interface ArtifactRunnerProps {
  files: ArtifactFiles
  className?: string
  onFormSubmit?: (payload: Record<string, unknown>) => void
  /** Upper bound for the auto-sized iframe height, in px. Defaults to 4000. */
  maxHeight?: number
  /** When true, fills the parent height instead of auto-sizing to content. */
  fill?: boolean
}

/**
 * Build the full srcdoc for an artifact: theme tokens + user files + bridge script.
 * The iframe is sandboxed (allow-scripts only, no allow-same-origin) which keeps
 * it in a null origin without access to host storage or cookies.
 */
function buildSrcDoc(files: ArtifactFiles): string {
  const style = files["style.css"] ?? ""
  const script = files["script.js"] ?? ""
  const body = files["index.html"] ?? ""

  const themeVars = [
    "--background", "--foreground", "--card", "--card-foreground",
    "--primary", "--primary-foreground", "--secondary", "--muted",
    "--muted-foreground", "--border", "--accent", "--accent-foreground",
  ]
    .map((name) => {
      try {
        const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
        return value ? `${name}:${value};` : ""
      } catch {
        return ""
      }
    })
    .join("")

  const bridgeScript = `
    (function(){
      function postHeight(){
        try{
          var h = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
          parent.postMessage({type:"resize", height:h}, "*");
        }catch(e){}
      }
      window.addEventListener("load", function(){
        postHeight();
        parent.postMessage({type:"ready"}, "*");
        if (typeof ResizeObserver !== "undefined") {
          try { new ResizeObserver(postHeight).observe(document.documentElement); } catch(e){}
        }
      });
      window.addEventListener("error", function(e){
        try { parent.postMessage({type:"error", message: String(e.message || e)}, "*"); } catch(_){}
      });
      document.addEventListener("submit", function(ev){
        var form = ev.target;
        if (!form || !form.matches || !form.matches("form[data-dotagents-submit]")) return;
        ev.preventDefault();
        var data = {};
        try {
          var fd = new FormData(form);
          fd.forEach(function(value, key){ data[key] = value; });
        } catch(e){}
        parent.postMessage({type:"form-submit", payload: data}, "*");
      }, true);
    })();
  `

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data: https:; font-src data: https:; connect-src 'none';"/>
<style>:root{${themeVars}}html,body{margin:0;padding:0;background:hsl(var(--background));color:hsl(var(--foreground));font-family:system-ui,-apple-system,sans-serif;}</style>
<style>${style}</style>
</head>
<body>
${body}
<script>${bridgeScript}</script>
<script>${script}</script>
</body>
</html>`
}

export function ArtifactRunner({ files, className, onFormSubmit, maxHeight = 4000, fill = false }: ArtifactRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(400)
  const srcDoc = useMemo(() => buildSrcDoc(files), [files])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) return
      if (!isArtifactBridgeMessage(event.data)) return
      const msg = event.data
      if (msg.type === "resize") {
        setHeight(Math.min(Math.max(msg.height, 120), maxHeight))
      } else if (msg.type === "form-submit") {
        onFormSubmit?.(msg.payload)
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [onFormSubmit, maxHeight])

  return (
    <iframe
      ref={iframeRef}
      title="Artifact"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      className={cn(
        "w-full rounded-md border border-border bg-background",
        fill && "h-full",
        className,
      )}
      style={fill ? undefined : { height }}
    />
  )
}

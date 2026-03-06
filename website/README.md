## DotAgents Website

This folder contains the static marketing site for `https://dotagents.app`.

### Local preview

Run a simple static server from this directory:

```bash
cd website
python3 -m http.server 4321
```

Then open `http://localhost:4321`.

### Deployment

- `index.html` is the entry point
- static assets live alongside it
- `wrangler.toml` is scoped to this folder for Cloudflare deployment
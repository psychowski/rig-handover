---
name: cloudflare-worker-preview
description: Publish or replace a single static HTML review preview on Cloudflare Workers using the connected Cloudflare MCP. Use whenever a user needs a public HTTPS preview, a marker-free replacement, or removal of a preview Worker.
---

# Cloudflare Worker preview

Use the connected Cloudflare MCP for Worker changes. Do not install Wrangler or put preview files in the repository, issues, or chat.

## Before publishing

1. Check that the Cloudflare MCP `search`, `execute`, and `whoami` tools are available. Confirm the authenticated account and inspect its existing Worker scripts. Never overwrite an unrelated script.
2. Save the page with a command to a local path outside the repository. Inspect it for private data and verify it contains only the approved sample content.
3. Before any public upload or replacement, ask the user to approve the exact page, purpose, Worker name and URL, public visibility, possible account usage or charges, and how to undo it. Do not treat approval for one upload as approval for a later replacement or deletion.

## Upload or replace

Use the Cloudflare MCP `search` tool to confirm the current API endpoint and request shape before calling `execute`. For a static HTML file:

1. Encode the exact file bytes as base64 locally. Do not include credentials or unrelated local files.
2. Build a small module that decodes the base64 and returns the HTML with `Content-Type: text/html; charset=utf-8`.
3. Upload the module using `PUT /accounts/{account_id}/workers/scripts/{script_name}` as multipart form data. Include JSON metadata with `main_module` and `compatibility_date`, plus the JavaScript module file.
4. Enable the public `workers.dev` address with `POST /accounts/{account_id}/workers/scripts/{script_name}/subdomain`, using `enabled: true` and `previews_enabled: false`. For an already-public Worker replacement, update the script without changing its URL.
5. Verify the subdomain state with the read endpoint and fetch the HTTPS URL. Compare its bytes or SHA-256 with the approved local file, and check the page for the expected marker or its requested absence.

Use a unique, descriptive script name. Do not enable Preview URLs unless the user specifically needs them.

## Remove a preview

Keep the preview available while reviewers need it. Only remove it after the user approves deletion and confirms the Worker name and URL. Search the current API schema, then delete only that Worker with `DELETE /accounts/{account_id}/workers/scripts/{script_name}`. Verify the public URL no longer serves the page. A marker-free replacement is not deletion; follow the user's requested lifecycle.

## Errors and records

Let Cloudflare API errors surface. Do not report success unless the upload, public-subdomain state, and public HTTPS fetch all succeed. Record the Worker name, URL, content hash, and result without logging credentials or account tokens.

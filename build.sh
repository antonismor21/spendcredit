#!/bin/sh
# Builds a zero-install index.html from SpendCredit.jsx (React + Babel via CDN)
cd "$(dirname "$0")"
{
cat <<'HEAD'
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SpendCredit prototype</title>
<style>body{margin:0}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.9/babel.min.js"></script>
</head><body><div id="root"></div>
<script type="text/babel">
const { useState, useEffect } = React;
HEAD
sed -e '/^import React/d' -e 's/^export default function/function/' SpendCredit.jsx
cat <<'TAIL'
ReactDOM.createRoot(document.getElementById("root")).render(<SpendCredit />);
</script></body></html>
TAIL
} > index.html

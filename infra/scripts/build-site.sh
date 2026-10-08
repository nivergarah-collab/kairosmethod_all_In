#!/usr/bin/env bash
# Arma el sitio completo en dist/: portal en la raíz y cada prototipo web en /prototypes/<nombre>/.
# Uso: BASE_PATH=/kairosmethod ./infra/scripts/build-site.sh   (BASE_PATH vacío si el sitio va en la raíz)
# Solo construye prototipos que ya tienen package.json. Falla si no hay sitio publicable.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASE_PATH="${BASE_PATH:-}"
REQUIRED_PROTOTYPES="${REQUIRED_PROTOTYPES:-}"
OUT="$ROOT/dist"

build_project() { # <dir> <base> <destino>
  local dir="$1" base="$2" dest="$3"
  echo "- construyendo: ${dir#"$ROOT"/} -> $base"
  (cd "$dir" && npm ci && npm run build -- --base="$base/")
  if [[ ! -s "$dir/dist/index.html" ]]; then
    echo "Error: el build de ${dir#"$ROOT"/} no generó dist/index.html." >&2
    return 1
  fi
  mkdir -p "$dest"
  cp -R "$dir/dist/." "$dest/"
}

if [[ ! -f "$ROOT/web/portal/package.json" ]]; then
  echo "Error: falta web/portal/package.json; no se publicará un sitio vacío." >&2
  exit 1
fi
if [[ -z "$REQUIRED_PROTOTYPES" ]]; then
  echo "Error: define REQUIRED_PROTOTYPES como lista separada por comas (por ejemplo: kaizen,pomodoro)." >&2
  exit 1
fi

IFS=',' read -r -a prototypes <<< "$REQUIRED_PROTOTYPES"
if [[ ${#prototypes[@]} -eq 0 ]]; then
  echo "Error: REQUIRED_PROTOTYPES no contiene prototipos." >&2
  exit 1
fi

for name in "${prototypes[@]}"; do
  name="${name#"${name%%[![:space:]]*}"}"
  name="${name%"${name##*[![:space:]]}"}"
  if [[ ! "$name" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    echo "Error: nombre de prototipo no válido en REQUIRED_PROTOTYPES: '$name'." >&2
    exit 1
  fi
  dir="$ROOT/apps/prototypes/$name"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "Error: el prototipo seleccionado '$name' no tiene apps/prototypes/$name/package.json." >&2
    exit 1
  fi
done

rm -rf "$OUT"
mkdir -p "$OUT/prototypes"
build_project "$ROOT/web/portal" "$BASE_PATH" "$OUT"

# Construir exactamente los prototipos elegidos para esta publicación.
for name in "${prototypes[@]}"; do
  name="${name#"${name%%[![:space:]]*}"}"
  name="${name%"${name##*[![:space:]]}"}"
  dir="$ROOT/apps/prototypes/$name"
  build_project "$dir" "$BASE_PATH/prototypes/$name" "$OUT/prototypes/$name"
  expected_path="$BASE_PATH/prototypes/$name/"
  anchors="$(grep -Eio '<a[[:space:]][^>]*>' "$OUT/index.html" || true)"
  if ! printf '%s\n' "$anchors" | grep -Fq " href=\"$expected_path" \
    && ! printf '%s\n' "$anchors" | grep -Fq " href='$expected_path"; then
    echo "Error: el portal no tiene un href al prototipo '$name' bajo '$expected_path'." >&2
    exit 1
  fi
done

# GitHub Pages: evita que Jekyll procese el sitio
touch "$OUT/.nojekyll"
echo "Sitio listo en dist/"

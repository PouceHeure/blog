# --- Build du site avec Hugo ---
FROM debian:bookworm-slim AS build

ARG HUGO_VERSION=0.128.0
ARG TARGETARCH
# Adresse publique du site (modifiable depuis Coolify)
ARG BASE_URL=https://blog.pouceheure.fr/

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && curl -fsSL -o /tmp/hugo.tgz \
    "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-${TARGETARCH:-amd64}.tar.gz" \
 && tar -xzf /tmp/hugo.tgz -C /usr/local/bin hugo \
 && rm /tmp/hugo.tgz

WORKDIR /src
COPY . .
RUN hugo --minify --baseURL "${BASE_URL}" -d /public

# --- Service des fichiers statiques ---
FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /public /usr/share/nginx/html
EXPOSE 80

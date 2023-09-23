#!/bin/bash

echo "jwtSecret = \"${JWT_SECRET}\"

[oauth]
clientId = \"${OAUTH_CLIENT_ID}\"
clientSecret = \"${OAUTH_CLIENT_SECRET}\"
baseUrl = \"${OAUTH_BASE_URL}\"
authorizeEndpoint = \"${OAUTH_AUTHORIZE_ENDPOINT}\"
tokenEndpoint = \"${OAUTH_TOKEN_ENDPOINT}\"
redirectUri = \"${OAUTH_REDIRECT_URI}\"
userInfoUri = \"${OAUTH_USER_INFO_URI}\"" > .config.toml

echo 'Config written from env vars'
exec "$@"

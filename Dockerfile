FROM node:18-bullseye-slim

USER node:node

WORKDIR /home/node

# Server environmental variables will be put into server/.env
ENV MAILGUN_API_KEY=api-key \
    MAILGUN_DOMAIN=darkwire.io \
    ABUSE_TO_EMAIL_ADDRESS=abuse@darkwire.io \
    ABUSE_FROM_EMAIL_ADDRESS="Darkwire <no-reply@darkwire.io>" \
    CLIENT_DIST_DIRECTORY='client/dist/'\
    ROOM_HASH_SECRET='17485ac3-a42d-4b1b-8d52-9271c82ae720'\
    STORE_BACKEND=memory \
    SITE_URL=https://dark.bubye.cyou 

# Client configuration will be put into client/.env
ENV TZ=UTC \
    VITE_API_HOST=localhost \
    VITE_API_PROTOCOL=http \
    VITE_API_PORT=3001 \
    VITE_COMMIT_SHA=some_sha \
    VITE_MAX_FILE_SIZE=20

COPY --chown=node:node . .

RUN yarn && yarn build

STOPSIGNAL SIGINT
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \ 
    CMD [ "curl", "-f", "${VITE_API_PROTOCOL}://localhost:${VITE_API_PORT}", "||", "exit", "1" ]

ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD ["yarn", "start"]

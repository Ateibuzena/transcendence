# databases/user-db/Dockerfile
FROM postgres:15

ENV POSTGRES_DB=user_db
ENV POSTGRES_USER=user_user
ENV POSTGRES_PASSWORD=user_pass

COPY init.sql /docker-entrypoint-initdb.d/

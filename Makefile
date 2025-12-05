COMPOSE_FILE=deployments/docker-compose.yml

.PHONY: user clean all

all:
	docker compose -f $(COMPOSE_FILE) up --build -d

clean:
	# Detener y eliminar contenedores si existen
	@if [ -n "$$(docker ps -aq)" ]; then \
		docker stop $$(docker ps -aq); \
		docker rm -f $$(docker ps -aq); \
	fi

	# Eliminar imágenes si existen
	@if [ -n "$$(docker images -q)" ]; then \
		docker rmi -f $$(docker images -q); \
	fi

	# Eliminar volúmenes si existen
	@if [ -n "$$(docker volume ls -q)" ]; then \
		docker volume rm $$(docker volume ls -q); \
	fi

	# Limpiar sistema (opcional)
	docker system prune -a --volumes -f
	docker builder prune -a -f

	# Asegurar que el proyecto se baja
	docker compose -f $(COMPOSE_FILE) down --rmi all --volumes --remove-orphans

	# Estado final
	docker system df

# Levantar solo el servicio user-service con build
user:
	docker compose -f $(COMPOSE_FILE) up --build user-service

 trascendence/
│
├── api-gateway/
│   ├── nginx.conf
│   ├── Dockerfile
│   └── config/
│
├── auth-service/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt / package.json
│   └── config/
│
├── user-service/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt / package.json
│   └── config/
│
├── chat-service/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── config/
│
├── game-service/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── config/
│
├── databases/               # cada servicio tendrá su DB independiente
│   ├── auth-db/
│   │   ├── init.sql
│   │   └── Dockerfile (opcional si usáis imagen oficial)
│   ├── user-db/
│   ├── chat-db/
│   └── game-db/
│
├── shared/
│   ├── proto/               # opcional, si más adelante usáis gRPC
│   ├── schemas/             # contratos OpenAPI
│   ├── utils/               # librerías comunes
│   └── config/              # variables comunes
│
├── deployments/
│   ├── docker-compose.yml   # MVP usa compose
│   ├── .env                 # variables globales
│   ├── dev/
│   └── prod/                # futuro: k8s manifests aquí
│
└── docs/
    ├── architecture.md
    ├── mvp.md
    └── api-contracts/

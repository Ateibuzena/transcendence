import fastify from 'fastify';

console.log('Auth service is starting...');

const app = fastify();

app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try
  {
    await app.listen({ port: 5002 });
    console.log('User service is running on port 5002');
  }
  catch (err)
  {
    console.error(err);
    process.exit(1);
  }
}

start();
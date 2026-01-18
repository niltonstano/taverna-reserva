# Testes Automatizados

## Estrutura

Os testes estão organizados em:
- `tests/` - Testes de integração e rotas
- `tests/utils/` - Testes unitários de utilitários

## Executar Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com cobertura
npm test -- --coverage
```

## Testes Implementados

### Health Check (`health.test.ts`)
- Verifica se o endpoint `/health` retorna status 200
- Verifica se retorna informações de versão e timestamp
- Verifica status do banco de dados

### Autenticação (`auth.test.ts`)
- Testa validação de dados no registro
- Testa validação de dados no login
- Testa credenciais inválidas

### Utilitários
- `utils/errors.test.ts` - Testa classes de erro customizadas
- `utils/validation.test.ts` - Testa função de validação com Zod

## Adicionar Novos Testes

1. Crie arquivos `.test.ts` ou `.spec.ts` na pasta `tests/`
2. Use `describe` e `it` do Jest
3. Para testes de rotas, use `app.inject()` do Fastify
4. Para testes unitários, importe diretamente os módulos

## Exemplo de Teste de Rota

```typescript
import { buildApp } from "../src/app";
import type { FastifyInstance } from "fastify";

describe("Minha Rota", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("deve retornar 200", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/minha-rota",
    });

    expect(response.statusCode).toBe(200);
  });
});
```

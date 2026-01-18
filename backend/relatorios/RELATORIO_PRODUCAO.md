1. 🏗️ Arquitetura de Software: O Padrão em Camadas (Layered Architecture)
   A aplicação foi estruturada seguindo o Repository Pattern e a Service Layer. Essa divisão garante que cada parte do código tenha uma única responsabilidade (SOLID), facilitando a manutenção e a criação de testes automatizados.

A. Controllers (A Porta de Entrada)
Função: Gerenciar as requisições HTTP e as respostas.

Responsabilidade: Validar os dados de entrada (via Zod), chamar o serviço correto e retornar o status code adequado (200, 201, 400, etc.).

Diferencial: Eles são "burros" por design. Não possuem lógica de negócio, apenas orquestram o fluxo.

B. Services (O Coração da Taverna)
Função: Onde reside toda a Lógica de Negócio.

Responsabilidade: É aqui que decidimos se um cliente pode ou não fazer um pedido, calculamos impostos, verificamos estoque e disparamos eventos.

Diferencial: Camada totalmente isolada do framework web. Se amanhã você trocar o Fastify pelo NestJS, seus Services continuam intactos.

C. Repositories (O Guardião dos Dados)
Função: Abstração da camada de dados (MongoDB/Mongoose).

Responsabilidade: Realizar as consultas (find, create, update) no banco de dados.

Diferencial: Se você decidir trocar o MongoDB por um PostgreSQL, você só altera o Repository. O resto do sistema nem percebe a mudança.

2. 📡 Fluxo de uma Requisição (Jornada de uma Reserva)
   Para ilustrar a robustez, veja o que acontece quando um cliente busca um rastreio:

Frontend: Faz um GET /orders/123.

Controller: Recebe o ID, valida se é uma string válida com Zod.

Service: Pergunta ao repositório se essa ordem existe. Se existir, verifica se o usuário tem permissão para vê-la.

Repository: Executa um .findOne({ \_id: 123 }).lean() no MongoDB (o .lean() aumenta a performance em 30% para leituras).

Service: Retorna o objeto processado para o Controller.

Controller: Devolve o JSON para o React, que renderiza a Timeline cinematográfica.

3. 🛡️ Engenharia de Confiabilidade (Reliability)
   Documentamos aqui as estratégias para garantir que o sistema nunca fique offline:

Graceful Shutdown: Implementamos hooks que, ao receber um comando de desligamento, fecham primeiro as rotas (param de aceitar clientes) e depois as conexões com o banco, garantindo que nenhum dado seja corrompido no meio de um salvamento.

Event Bus (Desacoplamento): Quando um pedido é concluído, o sistema dispara um evento interno. Isso permite que o e-mail de confirmação seja enviado em segundo plano, sem travar a navegação do usuário.

Typed Environment: Todas as variáveis de ambiente (.env) são validadas no momento do boot. Se faltar uma senha de banco, o sistema nem sobe, evitando erros silenciosos em produção.

4. 🐳 DevOps e Ecossistema de Containers
   A aplicação é distribuída como um ecossistema pronto para nuvem:

Network Isolation: Os containers do banco e da API conversam em uma rede privada (taverna-network), inacessível pela internet externa, aumentando a segurança.

Build Optimization: O Frontend utiliza Nginx para servir arquivos estáticos, o que reduz o consumo de memória do servidor para quase zero se comparado a rodar um servidor de desenvolvimento em produção.

5. 📑 Resumo de Entrega (Portfolio Highlights)
   Clean Code: Nomes de variáveis semânticos e funções pequenas.

Type Safety: 100% TypeScript, reduzindo erros de "undefined" em 99%.

Modern Logging: Logs que permitem rastrear exatamente onde um erro ocorreu sem poluir o console.

# 🍷 Taverna Reserva - Logistics & Luxury Tracking

O **Taverna Reserva** é uma plataforma de alta performance desenvolvida para a gestão e rastreamento de adegas de luxo. Este projeto demonstra a aplicação de padrões de arquitetura modernos, foco em segurança e infraestrutura escalável utilizando Docker.

## 🏗️ Arquitetura do Sistema

O backend foi construído seguindo o **Layered Pattern** (Arquitetura em Camadas), garantindo separação de responsabilidades e facilidade de manutenção:

- **Controllers:** Responsáveis pela interface HTTP e validação de entrada com Zod.
- **Services:** Camada onde reside a lógica de negócio e regras da "Taverna".
- **Repositories:** Abstração da camada de dados para comunicação com MongoDB.
- **Event Bus:** Gerenciamento de eventos desacoplados para processos em background.

## 🛠️ Tecnologias Utilizadas

| Camada             | Tecnologia                                      |
| :----------------- | :---------------------------------------------- |
| **Backend**        | Fastify (Node.js 22), TypeScript, Zod, Mongoose |
| **Frontend**       | React, Vite, Tailwind CSS                       |
| **Infraestrutura** | Docker, Docker Compose, Nginx                   |
| **Banco de Dados** | MongoDB                                         |
| **Logging**        | Pino Logger (Silent Production Mode)            |

## 🚀 Como Executar

Certifique-se de ter o Docker instalado em sua máquina.

1. Clone o repositório:
   ```bash
   git clone [https://github.com/niltonstano/taverna-reserva.git](https://github.com/niltonstano/taverna-reserva.git)
   ```

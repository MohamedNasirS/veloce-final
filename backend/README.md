<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Application Setup

This application requires a PostgreSQL database and specific environment variables to be configured for proper operation.

### Environment Variables

Create a `.env` file in the `backend` directory or set the following environment variables in your deployment environment:

-   `POSTGRES_HOST`: Hostname of your PostgreSQL server (e.g., `localhost`).
-   `POSTGRES_PORT`: Port number for your PostgreSQL server (e.g., `5432`).
-   `POSTGRES_USER`: Username for the PostgreSQL database.
-   `POSTGRES_PASSWORD`: Password for the PostgreSQL user.
-   `POSTGRES_DB`: Name of the PostgreSQL database to use.
-   `JWT_SECRET`: A secret key for signing JWT tokens (e.g., `your-very-secret-key`). This was already part of the auth setup but is crucial.
-   `PORT`: (Optional) The port on which the backend server will listen (defaults to 3000 if not set).

Example `.env` file:

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=bidding_app_db
JWT_SECRET=supersecretkey123
PORT=3001
```

### Database Setup

1.  Ensure you have a running PostgreSQL instance.
2.  Create a database with the name specified in `POSTGRES_DB`.
3.  The application uses TypeORM with the `synchronize: true` option enabled in development mode (`app.module.ts`). This means that when the application starts, TypeORM will attempt to automatically create or update the database tables based on the defined entities. For production environments, it's recommended to set `synchronize: false` and use migrations for schema management.

### File Uploads

The application handles file uploads (e.g., for item images or documents). Uploaded files are stored in the `backend/uploads/` directory by default.

**Important:** Due to limitations during automated setup, this directory might not be created automatically. Please ensure the `backend/uploads/` directory exists before running the application if you intend to use file upload features. You can create it with:

```bash
mkdir -p backend/uploads
```
(Run this command from the root of the repository).

### Item Approval Workflow

The application implements an approval process for items listed for bidding:

-   **Item Statuses:** Items can have several statuses, including:
    -   `PENDING_APPROVAL`: Newly created by a "Waste Generator" (user with the 'CREATOR' role) and awaiting admin review.
    -   `OPEN`: Approved by an admin and visible for bidding by "Recyclers" ('BIDDER' role) and "Aggregators" ('AGGREGATOR' role).
    -   `REJECTED`: Rejected by an admin.
    -   `CLOSED`: Bidding period has ended.
    -   `SOLD`: Item has been sold.
-   **Creation:** When a Waste Generator creates an item, it automatically enters the `PENDING_APPROVAL` state.
-   **Admin Review:** Users with the 'ADMIN' role are responsible for reviewing items in `PENDING_APPROVAL`. Admins can:
    -   Approve the item, changing its status to `OPEN`.
    -   Reject the item, changing its status to `REJECTED`.
-   **Visibility:**
    -   Recyclers and Aggregators can only view and bid on `OPEN` items.
    -   Waste Generators can see the status of their own submitted items.
    -   Admins have a broader view of items across various statuses for management purposes.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

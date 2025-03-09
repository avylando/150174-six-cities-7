import { injectable, inject } from 'inversify';
import express from 'express';
import cors from 'cors';
import type {
  Config,
  DBClient,
  Logger,
  ConfigSchema,
  Controller,
  ExceptionFilter,
} from '../shared/libs/index.js';
import { Component } from '../shared/models/component.enum.js';
import { ParseTokenMiddleware } from '../shared/libs/rest/middleware/parse-token.middleware.js';
import {
  STATIC_FILES_ROUTE,
  STATIC_UPLOAD_ROUTE,
} from '../shared/constants/static.js';

@injectable()
class Application {
  private readonly server = express();

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config<ConfigSchema>,
    @inject(Component.DBClient) private readonly dbClient: DBClient,
    @inject(Component.ExceptionFilter)
    private readonly exceptionFilter: ExceptionFilter,
    @inject(Component.AuthExceptionFilter)
    private readonly authExceptionFilter: ExceptionFilter,
    @inject(Component.UserController)
    private readonly userController: Controller,
    @inject(Component.OfferController)
    private readonly offerController: Controller,
    @inject(Component.CommentController)
    private readonly commentController: Controller,
  ) {}

  private async initServerMiddleware() {
    const authenticateMiddleware = new ParseTokenMiddleware(
      this.config.get('JWT_SECRET'),
    );

    this.server.use(express.json());
    this.server.use(
      STATIC_UPLOAD_ROUTE,
      express.static(this.config.get('UPLOAD_DIR')),
    );
    this.server.use(
      STATIC_FILES_ROUTE,
      express.static(this.config.get('STATIC_DIR')),
    );
    this.server.use(
      authenticateMiddleware.execute.bind(authenticateMiddleware),
    );
    this.server.use(cors());
  }

  private async initControllers() {
    this.server.use('/users', this.userController.router);
    this.server.use('/offers', this.offerController.router);
    this.server.use('/offers/:offerId/comments', this.commentController.router);
  }

  private async initExceptionFilters() {
    this.server.use(
      this.authExceptionFilter.catch.bind(this.authExceptionFilter),
    );
    this.server.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  private async initServer() {
    const port = this.config.get('PORT');
    this.server.listen(port);
  }

  public async init() {
    this.logger.info('Application is initializing…');

    this.logger.info('Initialize database…');
    await this.dbClient.connect();

    this.logger.info('Database initialized!');

    this.logger.info('Initialize server middleware…');
    await this.initServerMiddleware();

    this.logger.info('Initialize controllers…');
    await this.initControllers();

    this.logger.info('Initialize exception filters…');
    await this.initExceptionFilters();

    this.logger.info('Initialize server…');
    await this.initServer();

    this.logger.info(`Server is running on port: ${this.config.get('PORT')}!`);
  }

  public async close() {
    await this.dbClient.disconnect();
    this.logger.info('Exited successfully!');
  }
}

export { Application };

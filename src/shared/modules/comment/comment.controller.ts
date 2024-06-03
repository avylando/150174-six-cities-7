import { inject, injectable } from 'inversify';
import { Response, Request } from 'express';

import { BaseController, HttpMethod } from '../../libs/rest/index.js';
import { Logger } from '../../libs/logger/index.js';
import { Component } from '../../models/index.js';
import { CommentRdo } from './rdo/comment.rdo.js';
import { fillDTO } from '../../utils/service.js';
import { CommentEndpoint } from './comment-endpoint.enum.js';
import { CreateCommentRequest } from './comment-request.type.js';
import { OfferService } from '../offer/offer-service.interface.js';
import { CommentService } from './comment-service.interface.js';
import { RequestOfferParams } from '../offer/offer-request.type.js';
import { ValidateObjectIdMiddleware } from '../../libs/rest/middleware/validate-object-id.middleware.js';
import { DocumentExistsMiddleware } from '../../libs/rest/middleware/document-exists.middleware.js';

@injectable()
class CommentController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.CommentService)
    private readonly commentService: CommentService,
    @inject(Component.OfferService) private readonly offerService: OfferService,
  ) {
    super(logger);
    this.logger.info('Register routes for CommentController…');
    const validateOfferIdMiddleware = new ValidateObjectIdMiddleware('offerId');
    const validateUserIdMiddleware = new ValidateObjectIdMiddleware(
      'userId',
      'body',
    );
    const offerExistsMiddleware = new DocumentExistsMiddleware(
      this.offerService,
      'offer',
      'offerId',
    );
    this.addRoute({
      path: CommentEndpoint.Index,
      method: HttpMethod.Get,
      handler: this.index,
      middlewares: [validateOfferIdMiddleware, offerExistsMiddleware],
    });
    this.addRoute({
      path: CommentEndpoint.Index,
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [
        validateOfferIdMiddleware,
        validateUserIdMiddleware,
        offerExistsMiddleware,
      ],
    });
  }

  public async index(
    req: Request<RequestOfferParams>,
    res: Response,
  ): Promise<void> {
    const result = await this.commentService.findByOfferId(req.params.offerId);
    this.ok(res, fillDTO(CommentRdo, result));
  }

  public async create(
    { body, params }: CreateCommentRequest,
    res: Response,
  ): Promise<void> {
    const result = await this.commentService.create(body, params.offerId);
    await this.offerService.incCommentsAmount(params.offerId);
    this.created(res, fillDTO(CommentRdo, result));
  }
}

export { CommentController };
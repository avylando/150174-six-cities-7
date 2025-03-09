import { inject, injectable } from 'inversify';
import { Response, Request } from 'express';
import * as mongoose from 'mongoose';
import { BaseController, HttpMethod } from '../../libs/rest/index.js';
import { Logger } from '../../libs/logger/index.js';
import { Component } from '../../models/index.js';
import { OfferService } from './offer-service.interface.js';
import { OfferRdo } from './rdo/offer.rdo.js';
import { fillDTO, parseOffersQuery } from '../../utils/service.js';
import { OfferEndpoint } from './offer-endpoint.enum.js';
import {
  CreateOfferRequest,
  GetOffersRequest,
  RequestOfferParams,
  UpdateOfferRequest,
} from './offer-request.type.js';
import { DocumentExistsMiddleware } from '../../libs/rest/middleware/document-exists.middleware.js';
import { ValidateObjectIdMiddleware } from '../../libs/rest/middleware/validate-object-id.middleware.js';
import { ValidateDtoMiddleware } from '../../libs/rest/middleware/validate-dto.middleware.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { createOfferDtoSchema } from './dto/create-offer.schema.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { updateOfferDtoSchema } from './dto/update-offer.schema.js';
import { OfferReducedRdo } from './rdo/offer-reduced.rdo.js';
import { PrivateRouteMiddleware } from '../../libs/rest/middleware/private-route.middleware.js';
import { HttpError } from '../../libs/rest/errors/http-error.js';
import { StatusCodes } from 'http-status-codes';
import { UploadImagesRdo } from './rdo/upload-images.rdo.js';
import { UploadFileMiddleware } from '../../libs/rest/middleware/upload-file.middelware.js';
import { Config, ConfigSchema } from '../../libs/index.js';
import { UploadMultipleFilesMiddleware } from '../../libs/rest/middleware/upload-multiple-files.middleware.js';
import { UserService } from '../user/user-service.interface.js';
import { DocumentOwnerMiddleware } from '../../libs/rest/middleware/document-owner.middleware.js';
import { DocumentCollection } from '../../libs/rest/types/document-collection.enum.js';
import { CommentService } from '../comment/comment-service.interface.js';

@injectable()
export class OfferController extends BaseController {
  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    @inject(Component.Config) protected readonly config: Config<ConfigSchema>,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.CommentService)
    private readonly commentService: CommentService,
  ) {
    super(logger);
    this.logger.info('Register routes for OfferController…');
    const privateRouteMiddleware = new PrivateRouteMiddleware();
    const validateOfferIdMiddleware = new ValidateObjectIdMiddleware('offerId');
    const offerExistsMiddleware = new DocumentExistsMiddleware(
      this.offerService,
      'offer',
      'offerId',
    );
    const documentOwnerMiddleware = new DocumentOwnerMiddleware(
      this.offerService,
      DocumentCollection.Offers,
      'offerId',
    );

    this.addRoute({
      path: OfferEndpoint.Index,
      method: HttpMethod.Get,
      handler: this.index,
    });
    this.addRoute({
      path: OfferEndpoint.PremiumOffers,
      method: HttpMethod.Get,
      handler: this.getPremiumOffers,
    });
    this.addRoute({
      path: OfferEndpoint.DetailedOffers,
      method: HttpMethod.Get,
      handler: this.getDetailedOffers,
    });
    this.addRoute({
      path: OfferEndpoint.Index,
      method: HttpMethod.Post,
      handler: this.create,
      middlewares: [
        privateRouteMiddleware,
        new ValidateDtoMiddleware(CreateOfferDto, createOfferDtoSchema),
        new ValidateObjectIdMiddleware('id', 'tokenPayload'),
        new DocumentExistsMiddleware(
          this.userService,
          'User',
          'id',
          'tokenPayload',
        ),
      ],
    });
    this.addRoute({
      path: OfferEndpoint.Offer,
      method: HttpMethod.Get,
      handler: this.show,
      middlewares: [validateOfferIdMiddleware, offerExistsMiddleware],
    });
    this.addRoute({
      path: OfferEndpoint.Offer,
      method: HttpMethod.Put,
      handler: this.update,
      middlewares: [
        privateRouteMiddleware,
        validateOfferIdMiddleware,
        new ValidateDtoMiddleware(UpdateOfferDto, updateOfferDtoSchema),
        offerExistsMiddleware,
        documentOwnerMiddleware,
      ],
    });
    this.addRoute({
      path: OfferEndpoint.UploadImages,
      method: HttpMethod.Post,
      handler: this.uploadImages,
      middlewares: [
        privateRouteMiddleware,
        validateOfferIdMiddleware,
        offerExistsMiddleware,
        documentOwnerMiddleware,
        new UploadMultipleFilesMiddleware(
          this.config.get('UPLOAD_DIR'),
          'images',
        ),
      ],
    });
    this.addRoute({
      path: OfferEndpoint.UploadPreviewUrl,
      method: HttpMethod.Post,
      handler: this.uploadPreviewUrl,
      middlewares: [
        privateRouteMiddleware,
        validateOfferIdMiddleware,
        offerExistsMiddleware,
        documentOwnerMiddleware,
        new UploadFileMiddleware(this.config.get('UPLOAD_DIR'), 'previewUrl'),
      ],
    });
    this.addRoute({
      path: OfferEndpoint.Offer,
      method: HttpMethod.Delete,
      handler: this.delete,
      middlewares: [
        privateRouteMiddleware,
        validateOfferIdMiddleware,
        offerExistsMiddleware,
        documentOwnerMiddleware,
      ],
    });
  }

  private async getOffers({ query: rawQuery, tokenPayload }: GetOffersRequest) {
    const { filter, query } = parseOffersQuery(rawQuery);
    const result = await this.offerService.find(
      filter,
      query,
      tokenPayload?.id,
    );
    return result;
  }

  public async index(req: GetOffersRequest, res: Response): Promise<void> {
    const result = await this.getOffers(req);
    this.ok(res, fillDTO(OfferReducedRdo, result));
  }

  public async getPremiumOffers(
    { query: rawQuery }: GetOffersRequest,
    res: Response,
  ): Promise<void> {
    const { filter, query } = parseOffersQuery(rawQuery);
    const result = await this.offerService.find(
      { ...filter, premium: true },
      query,
    );
    this.ok(res, fillDTO(OfferRdo, result));
  }

  public async getDetailedOffers(
    req: GetOffersRequest,
    res: Response,
  ): Promise<void> {
    const result = await this.getOffers(req);
    this.ok(res, fillDTO(OfferRdo, result));
  }

  public async create(
    { body, tokenPayload }: CreateOfferRequest,
    res: Response,
  ): Promise<void> {
    const result = await this.offerService.create(body, tokenPayload.id);
    this.created(res, fillDTO(OfferRdo, result));
  }

  public async show(
    { params }: Request<RequestOfferParams>,
    res: Response,
  ): Promise<void> {
    const { offerId } = params;
    const result = await this.offerService.findById(offerId);

    this.ok(res, fillDTO(OfferRdo, result));
  }

  public async update(
    { body, params }: UpdateOfferRequest,
    res: Response,
  ): Promise<void> {
    const { offerId } = params;
    const updatedOffer = await this.offerService.updateById(
      offerId as string,
      body,
    );

    this.ok(res, fillDTO(OfferRdo, updatedOffer));
  }

  public async delete(
    { params }: Request<RequestOfferParams>,
    res: Response,
  ): Promise<void> {
    const { offerId } = params;

    let error: HttpError | null = null;
    const session = await mongoose.startSession();
    session.startTransaction();
    Promise.allSettled([
      this.offerService.deleteById(offerId),
      this.commentService.deleteByOfferId(offerId),
    ])
      .then(() => session.commitTransaction())
      .then(() => session.endSession())
      .then(() => this.noContent(res))
      .catch((err) => {
        error = new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, err);
      })
      .then(() => session.abortTransaction())
      .then(() => session.endSession())
      .then(() => {
        if (error) {
          throw error;
        }
      });
  }

  public async uploadImages(
    { params, files }: Request<RequestOfferParams>,
    res: Response,
  ) {
    if (!files) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'No files provided');
    }

    const { offerId } = params;
    const updateDto: UpdateOfferDto = {
      images: Array.isArray(files)
        ? files.map((el) => el.filename)
        : files.images.map((el) => el.filename),
    };

    await this.offerService.updateById(offerId, updateDto);
    this.created(res, fillDTO(UploadImagesRdo, updateDto));
  }

  public async uploadPreviewUrl({ params, file }: Request, res: Response) {
    if (!file) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'No file provided');
    }

    const { offerId } = params;
    const updateDto: UpdateOfferDto = {
      previewUrl: file.filename,
    };

    await this.offerService.updateById(offerId, updateDto);
    this.created(res, fillDTO(UploadImagesRdo, updateDto));
  }
}

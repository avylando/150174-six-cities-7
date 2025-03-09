import { DocumentType, types } from '@typegoose/typegoose';
import { inject, injectable } from 'inversify';
import {
  OfferService,
  OffersFindFilterParams,
  OffersFindQueryParams,
} from './offer-service.interface.js';
import { OfferEntity } from './offer.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { Logger } from '../../libs/index.js';
import { Component } from '../../models/component.enum.js';
import { OffersDefault } from './offer.constants.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { DocumentCollection } from '../../libs/rest/types/document-collection.enum.js';
// import * as mongoose from 'mongoose';
@injectable()
class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.OfferModel)
    private readonly OfferModel: types.ModelType<OfferEntity>,
  ) {}

  public async exists(id: string): Promise<boolean> {
    return (await this.OfferModel.exists({ _id: id })) !== null;
  }

  public async isOwner(id: string, userId: string): Promise<boolean> {
    return (await this.OfferModel.findById(id))?.userId.toString() === userId;
  }

  public async create(
    dto: CreateOfferDto,
    userId: string,
  ): Promise<DocumentType<OfferEntity>> {
    const result = await (
      await this.OfferModel.create({ ...dto, userId })
    ).populate(['userId']);
    this.logger.info(`New offer created: ${result._id}`);

    return result;
  }

  public async findById(id: string): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findById(id).populate(['userId']).exec();
  }

  public async find(
    filterParams: OffersFindFilterParams = {},
    {
      limit = OffersDefault.LIMIT,
      offset = OffersDefault.OFFSET,
      sort = OffersDefault.SORT,
    }: OffersFindQueryParams = {},
    // userId: string,
  ): Promise<DocumentType<OfferEntity>[]> {
    return this.OfferModel.aggregate([
      // {
      //   $match: {
      //     ...filterParams,
      //   },
      // },
      {
        $lookup: {
          from: DocumentCollection.Users,
          localField: 'userId'.toString(),
          foreignField: '_id'.toString(),
          as: 'author',
        },
      },
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [{ $arrayElemAt: ['$author', 0] }, '$$ROOT'],
          },
        },
      },
      // {
      //   $project: {
      //     _id: 1,
      //     name: 1,
      //     description: 1,
      //     // add other fields you want to include
      //     author: '$author',
      //   },
      // },
    ])
      .limit(filterParams.premium ? OffersDefault.PREMIUM_LIMIT : limit)
      .skip(offset)
      .sort({ createdAt: sort })
      .exec();
  }

  public async updateById(
    id: string,
    dto: UpdateOfferDto,
  ): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findByIdAndUpdate(id, dto, { new: true })
      .populate(['userId'])
      .exec();
  }

  public async deleteById(
    id: string,
  ): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findByIdAndDelete(id).exec();
  }

  public async incCommentsAmount(
    id: string,
  ): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findByIdAndUpdate(
      id,
      {
        $inc: { commentsAmount: 1 },
      },
      { new: true },
    ).exec();
  }

  public async decCommentsAmount(
    id: string,
  ): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findByIdAndUpdate(
      id,
      {
        $inc: { commentsAmount: -1 },
      },
      { new: true },
    ).exec();
  }

  updateRating(
    offerId: string,
    rating: number,
  ): Promise<DocumentType<OfferEntity> | null> {
    return this.OfferModel.findByIdAndUpdate(
      offerId,
      {
        $push: { usersRatings: rating },
      },
      { new: true },
    ).exec();
  }
}

export { DefaultOfferService };

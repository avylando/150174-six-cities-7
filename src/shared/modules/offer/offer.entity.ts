import {
  defaultClasses,
  getModelForClass,
  prop,
  modelOptions,
  Ref,
} from '@typegoose/typegoose';
import { City } from '../../models/index.js';
import { UserEntity } from '../user/user.entity.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { calculateAggregateRating } from '../../utils/rating.js';
import { DocumentCollection } from '../../libs/rest/types/document-collection.enum.js';
import * as mongoose from 'mongoose';

class Coordinates {
  lat!: number;
  lng!: number;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface OfferEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: DocumentCollection.Offers,
    timestamps: true,
    virtuals: true,
  },
})
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class OfferEntity extends defaultClasses.TimeStamps {
  @prop({ type: String, required: true, trim: true })
  public description!: CreateOfferDto['description'];

  @prop({ type: String, required: true, enum: City })
  public city!: CreateOfferDto['city'];

  @prop({ type: String, required: true, trim: true })
  public name!: CreateOfferDto['name'];

  @prop({ type: String, required: true, trim: true })
  public previewUrl!: string;

  @prop({ type: String, required: true, default: [] })
  public images!: mongoose.Types.Array<string>;

  @prop({ type: Number, required: true })
  public rooms!: CreateOfferDto['rooms'];

  @prop({ type: Coordinates, required: true })
  public coordinates!: CreateOfferDto['coordinates'];

  @prop({ type: Number, required: true })
  public price!: CreateOfferDto['price'];

  @prop({ type: Boolean, default: false })
  public premium!: CreateOfferDto['premium'];

  @prop({ type: Boolean, default: false })
  public favorite!: boolean;

  @prop({ type: Array, required: true, default: [] })
  public features!: CreateOfferDto['features'];

  @prop({ type: String, required: true })
  public housing!: CreateOfferDto['housing'];

  @prop({ type: Number, required: true })
  public guests!: CreateOfferDto['guests'];

  @prop({
    type: mongoose.Schema.ObjectId,
    ref: UserEntity,
    required: true,
  })
  public userId!: Ref<UserEntity>;

  @prop({ type: Number, required: false })
  public commentsAmount: number = 0;

  @prop({ type: Number, required: true, default: [] })
  public usersRatings!: mongoose.Types.Array<number>;

  public get rating(): number {
    return calculateAggregateRating(this.usersRatings);
  }
}

export const OfferModel = getModelForClass(OfferEntity);

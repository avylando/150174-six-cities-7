import { DocumentType } from '@typegoose/typegoose';

import { OfferEntity } from './offer.entity.js';
import type { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';
import { DocumentExists } from '../../models/document-exists.interface.js';
import { SortType } from '../../models/sort-type.enum.js';
import { DocumentOwner } from '../../models/document-owner.interface.js';

type OffersFindQueryParams = Partial<{
  limit: number;
  offset: number;
  sort: SortType;
}>;

type OffersFindFilterParams = Partial<Pick<OfferEntity, 'city' | 'premium'>>;

interface OfferService extends DocumentExists, DocumentOwner {
  create(
    dto: CreateOfferDto,
    userId: string,
  ): Promise<DocumentType<OfferEntity>>;
  findById(offerId: string): Promise<DocumentType<OfferEntity> | null>;
  find(
    filter: OffersFindFilterParams,
    query: OffersFindQueryParams,
    userId?: string,
  ): Promise<DocumentType<OfferEntity>[]>;
  updateById(
    offerId: string,
    dto: UpdateOfferDto,
  ): Promise<DocumentType<OfferEntity> | null>;
  deleteById(offerId: string): Promise<DocumentType<OfferEntity> | null>;
  incCommentsAmount(offerId: string): Promise<DocumentType<OfferEntity> | null>;
  decCommentsAmount(offerId: string): Promise<DocumentType<OfferEntity> | null>;
  updateRating(
    offerId: string,
    rating: number,
  ): Promise<DocumentType<OfferEntity> | null>;
}

export type { OfferService, OffersFindQueryParams, OffersFindFilterParams };

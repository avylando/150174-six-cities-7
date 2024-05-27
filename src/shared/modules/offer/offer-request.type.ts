import { Request } from 'express';
import { RequestBody, RequestParams } from '../../models/index.js';
import { CreateOfferDto } from './dto/create-offer.dto.js';
import { UpdateOfferDto } from './dto/update-offer.dto.js';

type CreateOfferRequest = Request<RequestParams, RequestBody, CreateOfferDto>;
type UpdateOfferRequest = Request<RequestParams, RequestBody, UpdateOfferDto>;

export type { CreateOfferRequest, UpdateOfferRequest };

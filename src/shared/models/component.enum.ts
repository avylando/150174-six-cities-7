export const Component = {
  Application: Symbol.for('Application'),
  Logger: Symbol.for('AppLogger'),
  Config: Symbol.for('AppConfig'),
  DBClient: Symbol.for('DBClient'),
  UserModel: Symbol.for('UserModel'),
  UserService: Symbol.for('UserService'),
  OfferModel: Symbol.for('OfferModel'),
  OfferService: Symbol.for('OfferService'),
  CommentModel: Symbol.for('CommentModel'),
  CommentService: Symbol.for('CommentService'),
  UserController: Symbol.for('UserController'),
  OfferController: Symbol.for('OfferController'),
} as const;
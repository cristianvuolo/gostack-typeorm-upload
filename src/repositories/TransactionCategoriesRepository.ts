import { EntityRepository, Repository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class TransactionCategoriesRepository extends Repository<Category> {
  // TODO
}

export default TransactionCategoriesRepository;

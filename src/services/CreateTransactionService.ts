import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import TransactionCategoriesRepository from '../repositories/TransactionCategoriesRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(
      TransactionCategoriesRepository,
    );

    // check category exists
    let transaction_category = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transaction_category) {
      transaction_category = categoryRepository.create({
        title: category,
      });
      await categoryRepository.save(transaction_category);
    }
    const balance = await transactionsRepository.getBalance();

    if (balance.total < value && type === 'outcome') {
      throw new AppError('invalid balance to add this outcome');
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transaction_category,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

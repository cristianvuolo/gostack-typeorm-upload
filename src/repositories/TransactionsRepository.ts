import { EntityRepository, getCustomRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    let totalIncome = 0;
    let totalOutcome = 0;

    await this.find({
      where: {
        type: 'income',
      },
    }).then(transactions => {
      transactions.map(transaction => {
        totalIncome += transaction.value;
      });
    });

    await this.find({
      where: {
        type: 'outcome',
      },
    }).then(transactions => {
      transactions.map(transaction => {
        totalOutcome += transaction.value;
      });
    });

    return {
      income: totalIncome,
      outcome: totalOutcome,
      total: totalIncome - totalOutcome,
    };
  }
}

export default TransactionsRepository;

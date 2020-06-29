import path from 'path';
import fs from 'fs';
import csvParse from 'csv-parse';
import { getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/uploadConfig';
import TransactionCategoriesRepository from '../repositories/TransactionCategoriesRepository';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionCSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
class ImportTransactionsService {
  async execute(fileName: string): Promise<Transaction[]> {
    const csvFilePath = path.join(uploadConfig.directory, fileName);

    const contactsReadStream = fs.createReadStream(csvFilePath);
    const parser = csvParse({ from_line: 2 });
    const parseCSV = contactsReadStream.pipe(parser);

    const categories: string[] = [];
    const transactions: TransactionCSV[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesRepository = getCustomRepository(
      TransactionCategoriesRepository,
    );
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const existentsCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitle = existentsCategories.map(
      (category: Category) => category.title,
    );

    const addCategories = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCatefories = categoriesRepository.create(
      addCategories.map(title => ({
        title,
      })),
    );

    await categoriesRepository.save(newCatefories);
    await fs.promises.unlink(csvFilePath);
    const finalCategories = [...newCatefories, ...existentsCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);
    return createdTransactions;
  }
}

export default ImportTransactionsService;

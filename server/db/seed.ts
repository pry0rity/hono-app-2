import { db } from './index'
import { expenses } from './schema/expenses'
import { faker } from '@faker-js/faker'

// Define some realistic categories
const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health & Fitness',
  'Travel',
  'Home',
  'Education',
  'Other'
] as const;

async function seed() {
  try {
    // Delete existing records
    await db.delete(expenses)

    // Create expenses spread across the last year
    const testUserId = process.env.TEST_USER_ID! // Replace with your test user ID
    const numberOfExpenses = 500; // Increased to 500 expenses
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000))

    const fakeExpenses = Array.from({ length: numberOfExpenses }, (_, index) => {
      // Distribute dates evenly across the year
      const date = new Date(
        oneYearAgo.getTime() +
        (index * (today.getTime() - oneYearAgo.getTime()) / numberOfExpenses)
      )

      // Randomly decide if this is an income (10% chance)
      const isIncome = Math.random() < 0.1;
      const type = isIncome ? 'income' : 'expense';

      // Select category based on type
      let category;
      if (isIncome) {
        // For income, use a smaller set of categories
        category = faker.helpers.arrayElement(['Salary', 'Freelance', 'Investment', 'Other']);
      } else {
        // For expenses, weight the categories to make some more common
        const rand = Math.random();
        if (rand < 0.3) {
          // 30% chance of Food & Dining
          category = 'Food & Dining';
        } else if (rand < 0.5) {
          // 20% chance of Transportation
          category = 'Transportation';
        } else if (rand < 0.7) {
          // 20% chance of Bills & Utilities
          category = 'Bills & Utilities';
        } else {
          // 30% chance of other categories
          category = faker.helpers.arrayElement([
            'Shopping',
            'Entertainment',
            'Health & Fitness',
            'Travel',
            'Home',
            'Education',
            'Other'
          ]);
        }
      }

      // Amount based on category and type
      let amount;
      if (isIncome) {
        // Income amounts
        if (category === 'Salary') {
          amount = faker.number.float({ min: 2000, max: 8000, fractionDigits: 2 });
        } else if (category === 'Freelance') {
          amount = faker.number.float({ min: 500, max: 3000, fractionDigits: 2 });
        } else {
          amount = faker.number.float({ min: 100, max: 1000, fractionDigits: 2 });
        }
      } else {
        // Expense amounts based on category
        switch (category) {
          case 'Food & Dining':
            amount = faker.number.float({ min: 10, max: 100, fractionDigits: 2 });
            break;
          case 'Transportation':
            amount = faker.number.float({ min: 5, max: 75, fractionDigits: 2 });
            break;
          case 'Bills & Utilities':
            amount = faker.number.float({ min: 50, max: 300, fractionDigits: 2 });
            break;
          case 'Shopping':
            amount = faker.number.float({ min: 20, max: 200, fractionDigits: 2 });
            break;
          case 'Travel':
            amount = faker.number.float({ min: 200, max: 1000, fractionDigits: 2 });
            break;
          default:
            amount = faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
        }
      }

      // Generate appropriate title based on category
      let title;
      if (isIncome) {
        title = category === 'Salary' ? 'Monthly Salary' : `${category} Payment`;
      } else {
        switch (category) {
          case 'Food & Dining':
            title = faker.helpers.arrayElement([
              'Groceries', 'Restaurant', 'Coffee Shop', 'Food Delivery', 'Lunch'
            ]);
            break;
          case 'Transportation':
            title = faker.helpers.arrayElement([
              'Gas', 'Uber', 'Public Transit', 'Parking', 'Car Maintenance'
            ]);
            break;
          case 'Bills & Utilities':
            title = faker.helpers.arrayElement([
              'Electricity', 'Water', 'Internet', 'Phone', 'Insurance'
            ]);
            break;
          default:
            title = faker.commerce.productName();
        }
      }

      return {
        userId: testUserId,
        title,
        description: faker.lorem.sentence(),
        amount: amount.toString(),
        type,
        date,
        category,
        notes: Math.random() < 0.3 ? faker.lorem.sentence() : null,
        status: faker.helpers.arrayElement(['cleared', 'pending', 'reconciled']),
        createdAt: date,
        updatedAt: date
      }
    }).sort((a, b) => a.date.getTime() - b.date.getTime())

    // Insert fake expenses
    const result = await db.insert(expenses).values(fakeExpenses)

    console.log('✅ Seeding completed successfully')
    console.log(`Inserted ${fakeExpenses.length} expenses from ${oneYearAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seed function
seed() 
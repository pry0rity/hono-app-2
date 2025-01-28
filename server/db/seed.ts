import { db } from './index'
import { expenses } from './schema/expenses'
import { categories } from './schema/categories'
import { faker } from '@faker-js/faker'

// Define expense categories with their properties
const EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', type: 'expense', color: '#F97316', icon: '🍽️' },
  { name: 'Transportation', type: 'expense', color: '#3B82F6', icon: '🚗' },
  { name: 'Shopping', type: 'expense', color: '#EC4899', icon: '🛍️' },
  { name: 'Bills & Utilities', type: 'expense', color: '#EAB308', icon: '📱' },
  { name: 'Entertainment', type: 'expense', color: '#A855F7', icon: '🎮' },
  { name: 'Health & Fitness', type: 'expense', color: '#22C55E', icon: '💪' },
  { name: 'Travel', type: 'expense', color: '#6366F1', icon: '✈️' },
  { name: 'Home', type: 'expense', color: '#EF4444', icon: '🏠' },
  { name: 'Education', type: 'expense', color: '#06B6D4', icon: '📚' },
  { name: 'Other', type: 'expense', color: '#71717A', icon: '📝' }
] as const;

// Define income categories
const INCOME_CATEGORIES = [
  { name: 'Salary', type: 'income', color: '#059669', icon: '💰' },
  { name: 'Freelance', type: 'income', color: '#0EA5E9', icon: '💻' },
  { name: 'Investment', type: 'income', color: '#8B5CF6', icon: '📈' },
  { name: 'Other Income', type: 'income', color: '#71717A', icon: '💵' }
] as const;

async function seed() {
  try {
    // Delete existing records
    await db.delete(expenses);
    await db.delete(categories);

    console.log('Seeding categories...');
    // Insert categories
    const insertedCategories = await db.insert(categories)
      .values([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])
      .returning();

    // Create a map of category names to their IDs
    const categoryMap = new Map(insertedCategories.map(cat => [cat.name, cat.id]));

    // Create expenses spread across the last year
    const testUserId = process.env.TEST_USER_ID!
    const numberOfExpenses = 500;
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000))

    console.log('Seeding expenses...');
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
      let categoryName;
      if (isIncome) {
        categoryName = faker.helpers.arrayElement(INCOME_CATEGORIES).name;
      } else {
        const rand = Math.random();
        if (rand < 0.3) {
          // 30% chance of Food & Dining
          categoryName = 'Food & Dining';
        } else if (rand < 0.5) {
          // 20% chance of Transportation
          categoryName = 'Transportation';
        } else if (rand < 0.7) {
          // 20% chance of Bills & Utilities
          categoryName = 'Bills & Utilities';
        } else {
          // 30% chance of other categories
          categoryName = faker.helpers.arrayElement(
            EXPENSE_CATEGORIES.filter(c =>
              !['Food & Dining', 'Transportation', 'Bills & Utilities'].includes(c.name)
            )
          ).name;
        }
      }

      // Amount based on category and type
      let amount;
      if (isIncome) {
        // Income amounts
        if (categoryName === 'Salary') {
          amount = faker.number.float({ min: 2000, max: 8000, fractionDigits: 2 });
        } else if (categoryName === 'Freelance') {
          amount = faker.number.float({ min: 500, max: 3000, fractionDigits: 2 });
        } else {
          amount = faker.number.float({ min: 100, max: 1000, fractionDigits: 2 });
        }
      } else {
        // Expense amounts based on category
        switch (categoryName) {
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
        title = categoryName === 'Salary' ? 'Monthly Salary' : `${categoryName} Payment`;
      } else {
        switch (categoryName) {
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
        categoryId: categoryMap.get(categoryName)!,
        notes: Math.random() < 0.3 ? faker.lorem.sentence() : null,
        status: faker.helpers.arrayElement(['cleared', 'pending', 'reconciled']),
        createdAt: date,
        updatedAt: date
      }
    }).sort((a, b) => a.date.getTime() - b.date.getTime())

    // Insert fake expenses
    const result = await db.insert(expenses).values(fakeExpenses)

    console.log('✅ Seeding completed successfully')
    console.log(`Inserted ${insertedCategories.length} categories`)
    console.log(`Inserted ${fakeExpenses.length} expenses from ${oneYearAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`)

    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the seed function
seed() 
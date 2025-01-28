import { db } from './index'
import { expenses } from './schema/expenses'
import { faker } from '@faker-js/faker'

async function seed() {
  try {
    // Delete existing records
    await db.delete(expenses)
    
    // Create expenses spread across the last year
    const testUserId = process.env.TEST_USER_ID! // Replace with your test user ID
    const numberOfExpenses = 100; // More expenses for a year of data
    const today = new Date()
    const oneYearAgo = new Date(today.getTime() - (365 * 24 * 60 * 60 * 1000))
    
    const fakeExpenses = Array.from({ length: numberOfExpenses }, (_, index) => {
      // Distribute dates evenly across the year
      const date = new Date(
        oneYearAgo.getTime() + 
        (index * (today.getTime() - oneYearAgo.getTime()) / numberOfExpenses)
      )

      // More varied amounts based on expense categories
      const expenseType = Math.random();
      let amount;
      if (expenseType < 0.6) { // 60% daily expenses
        amount = faker.number.float({ min: 5, max: 50, fractionDigits: 2 });
      } else if (expenseType < 0.85) { // 25% medium expenses
        amount = faker.number.float({ min: 51, max: 200, fractionDigits: 2 });
      } else { // 15% large expenses
        amount = faker.number.float({ min: 201, max: 1000, fractionDigits: 2 });
      }

      return {
        userId: testUserId,
        title: faker.commerce.productName(),
        amount: amount.toString(),
        createdAt: date
      }
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) // Sort by date ascending

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
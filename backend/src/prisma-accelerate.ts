import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

// Create Prisma client with Accelerate extension for cloud database
const prisma = new PrismaClient().$extends(withAccelerate())

export default prisma

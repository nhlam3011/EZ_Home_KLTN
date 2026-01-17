-- CreateTable
CREATE TABLE "ContractOccupant" (
    "id" SERIAL NOT NULL,
    "contractId" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "cccdNumber" TEXT,
    "phone" TEXT,
    "dob" TIMESTAMP(3),
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractOccupant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ContractOccupant" ADD CONSTRAINT "ContractOccupant_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

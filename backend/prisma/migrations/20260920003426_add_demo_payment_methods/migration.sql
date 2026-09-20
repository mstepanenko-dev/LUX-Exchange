-- CreateEnum
CREATE TYPE "public"."PaymentMethodType" AS ENUM ('CARD', 'BANK_TRANSFER', 'CRYPTO');

-- CreateTable
CREATE TABLE "public"."PaymentMethod" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "public"."PaymentMethodType" NOT NULL,
    "brand" TEXT,
    "last4" TEXT,
    "cardholderName" TEXT,
    "expiryMonth" INTEGER,
    "expiryYear" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "public"."PaymentMethod"("userId");

-- AddForeignKey
ALTER TABLE "public"."PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

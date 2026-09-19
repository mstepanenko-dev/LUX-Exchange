-- CreateTable
CREATE TABLE "public"."CryptoWallet" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CryptoWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CryptoWallet_address_key" ON "public"."CryptoWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "CryptoWallet_userId_currency_network_key" ON "public"."CryptoWallet"("userId", "currency", "network");

-- AddForeignKey
ALTER TABLE "public"."CryptoWallet" ADD CONSTRAINT "CryptoWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
